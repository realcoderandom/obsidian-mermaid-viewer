import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version))
  throw new Error('Usage: npm run version:set -- x.y.z');
const read = async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const manifest = await read('manifest.json'),
  pkg = await read('package.json'),
  versions = await read('versions.json'),
  lock = await read('package-lock.json');
manifest.version = pkg.version = lock.version = lock.packages[''].version = version;
versions[version] = manifest.minAppVersion;
for (const [name, value] of Object.entries({
  'manifest.json': manifest,
  'package.json': pkg,
  'versions.json': versions,
  'package-lock.json': lock,
})) {
  await writeFile(path.join(root, name), JSON.stringify(value, null, 2) + '\n');
}
console.log(`Version set to ${version}. Rebuild before packaging.`);
