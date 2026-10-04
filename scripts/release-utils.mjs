import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { RELEASE_ASSETS } from './package-assets.mjs';

export function releaseNotes(changelog, version) {
  const heading = `## ${version}\n`;
  const start = changelog.indexOf(heading);
  if (start < 0) throw new Error(`Missing changelog entry for ${version}.`);
  const rest = changelog.slice(start + heading.length);
  const end = rest.indexOf('\n## ');
  const notes = (end < 0 ? rest : rest.slice(0, end)).trim();
  if (!notes) throw new Error(`Empty changelog entry for ${version}.`);
  return `## Mermaid Viewer ${version}\n\n${notes}\n`;
}

export async function verifyReleaseAssets(sourceDir, downloadedDir, version) {
  for (const name of RELEASE_ASSETS) {
    const expected = await readFile(path.join(sourceDir, name));
    const downloaded = await readFile(path.join(downloadedDir, name));
    if (!downloaded.length || !expected.equals(downloaded))
      throw new Error(`Release asset ${name} is empty or differs from the checked build.`);
  }
  const manifest = JSON.parse(await readFile(path.join(downloadedDir, 'manifest.json'), 'utf8'));
  if (manifest.version !== version)
    throw new Error('Release asset manifest version differs from tag.');
}

export function verifyReleaseAssetList(assets) {
  const names = assets.map((asset) => asset.name);
  for (const name of RELEASE_ASSETS) {
    if (!assets.some((asset) => asset.name === name && asset.size > 0))
      throw new Error(`Release is missing ${name}.`);
  }
  if (
    names.length !== RELEASE_ASSETS.length ||
    names.some((name) => !RELEASE_ASSETS.includes(name))
  )
    throw new Error('Release must contain only main.js, manifest.json and styles.css.');
}
