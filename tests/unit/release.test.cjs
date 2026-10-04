const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const utils = import('../../scripts/release-utils.mjs');

test('release notes are nonempty and specific to the exact version', async () => {
  const { releaseNotes } = await utils;
  const changelog =
    '# Changelog\n\n## 1.5.2\n\n- Fix release assets.\n\n## 1.5.1\n\n- Earlier change.\n';
  assert.equal(
    releaseNotes(changelog, '1.5.2'),
    '## Mermaid Viewer 1.5.2\n\n- Fix release assets.\n',
  );
  assert.throws(() => releaseNotes(changelog, '1.5.20'), /Missing/);
  assert.throws(() => releaseNotes('## 1.5.2\n\n## 1.5.1\nOld', '1.5.2'), /Empty/);
});

test('release verification rejects missing, stale and mismatched install assets', async () => {
  const { verifyReleaseAssets } = await utils;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-release-test-'));
  const source = path.join(root, 'source');
  const downloaded = path.join(root, 'downloaded');
  try {
    await fs.mkdir(source);
    await fs.mkdir(downloaded);
    const files = {
      'main.js': 'plugin bundle',
      'manifest.json': '{"version":"1.5.2"}',
      'styles.css': '.diagram {}',
      LICENSE: 'MIT License',
    };
    for (const [name, bytes] of Object.entries(files)) {
      await fs.writeFile(path.join(source, name), bytes);
      await fs.writeFile(path.join(downloaded, name), bytes);
    }
    await verifyReleaseAssets(source, downloaded, '1.5.2');
    await assert.rejects(verifyReleaseAssets(source, downloaded, '1.5.1'), /version differs/);
    await fs.writeFile(path.join(downloaded, 'main.js'), 'stale bundle');
    await assert.rejects(verifyReleaseAssets(source, downloaded, '1.5.2'), /main.js/);
    await fs.writeFile(path.join(downloaded, 'main.js'), files['main.js']);
    await fs.rm(path.join(downloaded, 'manifest.json'));
    await assert.rejects(verifyReleaseAssets(source, downloaded, '1.5.2'), /ENOENT/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
