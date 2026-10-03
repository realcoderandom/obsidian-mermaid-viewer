import { PACKAGE_ASSETS } from './package-assets.mjs';
import { readFile, writeFile, mkdir, copyFile, realpath, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const vaultArg = process.argv[2];
if (!vaultArg)
  throw new Error('Usage: npm run install:local -- /absolute/path/to/vault [config-dir]');
const vault = await realpath(vaultArg);
const configDir = process.argv[3] ?? '.obsidian';
if (!/^[.\w-]+$/.test(configDir) || configDir === '.' || configDir === '..')
  throw new Error('Config directory must be a single directory name.');
const configPath = await realpath(path.join(vault, configDir));
if (!configPath.startsWith(vault + path.sep))
  throw new Error('Config directory must be inside the selected vault.');
const manifest = JSON.parse(await readFile(path.join(root, 'dist/manifest.json'), 'utf8'));
if (!/^[a-z]+(?:-[a-z]+)*$/.test(manifest.id)) throw new Error('Invalid plugin id.');
const target = path.join(configPath, 'plugins', manifest.id);
await mkdir(target, { recursive: true });
if (!(await realpath(target)).startsWith(configPath + path.sep))
  throw new Error('Plugin directory must stay inside the selected vault.');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(root, 'backups', `local-${stamp}`);
await mkdir(backup, { recursive: true });
for (const name of ['main.js', ...PACKAGE_ASSETS]) {
  await mkdir(path.dirname(path.join(backup, name)), { recursive: true });
  await mkdir(path.dirname(path.join(target, name)), { recursive: true });
  try {
    await copyFile(path.join(target, name), path.join(backup, name));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const bytes = await readFile(path.join(root, 'dist', name));
  const temp = path.join(path.dirname(path.join(target, name)), `.${path.basename(name)}.update`);
  await writeFile(temp, bytes);
  await rename(temp, path.join(target, name));
}
console.log(
  `Installed to ${target}. Settings data.json preserved. Backup: ${backup}. Reload the plugin in Obsidian.`,
);
