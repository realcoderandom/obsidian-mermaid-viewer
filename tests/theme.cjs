const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const dir = path.resolve(__dirname, '..');
const fixtures =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ['flow', 'sequence'].map((name) => path.join(__dirname, 'fixtures', name + '.svg'));
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluate(require('./helpers/obsidian-mock.cjs'));
    await page.setContent(
      '<style>.theme-dark .mermaid>svg{filter:invert(100%) hue-rotate(180deg) saturate(1.25)} .mermaid>svg{max-width:100%;height:auto}</style><main class="mermaid-notes"><div class="mermaid mpv-note-diagram"></div></main>',
    );
    await page.addStyleTag({ content: fs.readFileSync(path.join(dir, 'styles.css'), 'utf8') });
    await page.evaluate(
      (src) => {
        const module = { exports: {} };
        new Function('module', src)(module);
        window.theme = module.exports;
      },
      fs.readFileSync(path.join(dir, '.test-build/theme.cjs'), 'utf8'),
    );
    for (const fixture of fixtures) {
      await page.evaluate(
        (svg) => {
          const container = document.querySelector('.mermaid');
          container.innerHTML = svg;
          theme.decorate(container.querySelector('svg'));
        },
        fs.readFileSync(fixture, 'utf8'),
      );
      const snapshots = [];
      for (const dark of [false, true]) {
        await page.evaluate((dark) => document.body.classList.toggle('theme-dark', dark), dark);
        const result = await page.evaluate(() => {
          const svg = document.querySelector('.mermaid>svg'),
            root = getComputedStyle(svg),
            failures = [];
          const luminance = (color) => {
            const rgb = color.startsWith('#')
              ? color
                  .slice(1)
                  .match(/../g)
                  .map((v) => parseInt(v, 16))
              : color
                  .match(/[\d.]+/g)
                  .slice(0, 3)
                  .map(Number);
            const c = rgb.map((n) => {
              const v = n / 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
          };
          const colors = [];
          for (const el of svg.querySelectorAll('text, .nodeLabel')) {
            if (!el.textContent.trim()) continue;
            const style = getComputedStyle(el),
              role = el.closest('[data-mpv-role]');
            let background = '--mpv-surface';
            if (role && !role.classList.contains('actor-man'))
              background = `--mpv-${role.getAttribute('data-mpv-role')}-bg`;
            else if (el.classList.contains('sequenceNumber')) background = '--mpv-accent';
            else if (el.classList.contains('noteText')) background = '--mpv-note-bg';
            const fg = el.namespaceURI.includes('svg') ? style.fill : style.color;
            const bg = root.getPropertyValue(background).trim();
            const a = luminance(fg),
              b = luminance(bg),
              ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            if (ratio < 4.5) failures.push({ text: el.textContent, ratio, fg, bg });
            colors.push([fg, bg]);
          }
          for (const text of svg.querySelectorAll('text.actor')) {
            const rect = text.parentElement.querySelector('rect.actor');
            if (!rect) continue;
            const t = text.getBBox(),
              r = rect.getBBox();
            if (
              t.x < r.x - 2 ||
              t.x + t.width > r.x + r.width + 2 ||
              t.y < r.y - 2 ||
              t.y + t.height > r.y + r.height + 2
            )
              failures.push({ clipped: text.textContent });
          }
          return {
            failures,
            colors,
            filter: root.filter,
            background: getComputedStyle(svg.parentElement).backgroundColor,
          };
        });
        assert.deepEqual(
          result.failures,
          [],
          path.basename(fixture) + ': low contrast or clipped labels',
        );
        assert.equal(result.filter, 'none');
        assert.equal(result.background, 'rgb(250, 249, 245)');
        snapshots.push(result.colors);
      }
      assert.deepEqual(snapshots[0], snapshots[1], 'vault theme must not change diagram colors');
    }
    console.log(
      `PASS: ${fixtures.length} diagrams, light/dark vaults, all text contrast >= 4.5, actor bounds, fixed surface and no inversion.`,
    );
  } finally {
    await browser.close();
  }
})();
