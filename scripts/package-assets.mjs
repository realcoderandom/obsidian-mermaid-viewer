// Files shared by the build and local installer, relative to the project root.
export const PACKAGE_ASSETS = [
  'manifest.json',
  'LICENSE',
  'styles.css',
  'README.md',
  'README.zh-CN.md',
  'docs/images/inline-workflow.png',
  'docs/images/fullscreen-flow.png',
  'docs/images/fullscreen-sequence.png',
];

// These files must be direct GitHub Release attachments for community installation.
export const RELEASE_ASSETS = ['main.js', 'manifest.json', 'styles.css', 'LICENSE'];
