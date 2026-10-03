// Compatibility entry point. Prefer `npm run build` (includes type checking).
import('./scripts/build.mjs').catch(error => { console.error(error); process.exitCode = 1; });
