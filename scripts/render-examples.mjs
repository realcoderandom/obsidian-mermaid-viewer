import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.setContent('<main></main>');
  await page.addScriptTag({ path: path.join(root, 'node_modules/mermaid/dist/mermaid.min.js') });
  const diagrams = [
    { file: 'document-workflow', fixture: 'flow', title: 'Document workflow · 文档发布流程' },
    { file: 'preview-sequence', fixture: 'sequence', title: 'Preview lifecycle · 预览交互时序' },
  ];
  for (const item of diagrams) {
    const source = await readFile(path.join(root, 'docs/examples', `${item.file}.mmd`), 'utf8');
    const svg = await page.evaluate(
      async ({ source, id }) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          fontFamily: 'Arial',
          deterministicIds: true,
          flowchart: { htmlLabels: true },
          sequence: { useMaxWidth: false },
        });
        return (await mermaid.render(id, source)).svg;
      },
      { source, id: `example-${item.fixture}` },
    );
    await writeFile(path.join(root, 'tests/fixtures', `${item.fixture}.svg`), svg + '\n');
    item.svg = svg;
  }
  const chrome = `*{box-sizing:border-box}body{margin:0;background:#202124;color:#e6e6e6;font-family:Arial,sans-serif}main{max-width:1000px;margin:48px auto}h1{font-size:24px;font-weight:500;margin:0 0 24px}.mermaid>svg{max-width:100%;height:auto}.modal-container{position:fixed;inset:0;display:flex}.modal{background:white}.theme-dark .mermaid>svg{filter:invert(100%) hue-rotate(180deg) saturate(1.25)}`;
  await page.setContent(
    `<style>${chrome}</style><main class="mermaid-notes markdown-preview-view"><h1>Mermaid Viewer</h1></main>`,
  );
  await page.addStyleTag({ content: await readFile(path.join(root, 'dist/styles.css'), 'utf8') });
  await page.evaluate(require('../tests/helpers/obsidian-mock.cjs'));
  await page.evaluate(
    async (code) => {
      const module = { exports: {} };
      new Function('module', 'require', code)(module, () => window.obsidianMock);
      window.viewer = new module.exports.default();
      await viewer.onload();
    },
    await readFile(path.join(root, 'dist/main.js'), 'utf8'),
  );
  await mkdir(path.join(root, 'docs/images'), { recursive: true });
  for (const item of diagrams) {
    await page.evaluate(({ svg, title }) => {
      const main = document.querySelector('main');
      main.innerHTML = `<h1>${title}</h1><div class="mermaid">${svg}</div>`;
    }, item);
    await page.waitForSelector('.mpv-mermaid-open');
    if (item.fixture === 'flow') {
      await page
        .$('main')
        .then((el) => el.screenshot({ path: path.join(root, 'docs/images/inline-workflow.png') }));
    }
    await page.click('.mpv-mermaid-open');
    await page.waitForFunction(() =>
      document.querySelector('.mpv-diagram-canvas')?.querySelector('svg')?.hasAttribute('viewBox'),
    );
    await page.evaluate(() => [...viewer.modals][0].fit());
    await page.screenshot({
      path: path.join(root, 'docs/images', `fullscreen-${item.fixture}.png`),
    });
    await page.keyboard.press('Escape');
  }
  console.log(
    'Rendered original examples, SVG fixtures, and three screenshots. No vault content was read.',
  );
} finally {
  await browser.close();
}
