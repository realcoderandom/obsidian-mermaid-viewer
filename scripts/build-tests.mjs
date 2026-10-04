import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: {
    camera: 'src/viewer/camera.ts',
    theme: 'src/theme/decorate.ts',
    settings: 'src/settings-model.ts',
  },
  outdir: '.test-build',
  outExtension: { '.js': '.cjs' },
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  bundle: true,
  external: ['obsidian'],
});
