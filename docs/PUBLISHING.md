# Publishing to the Obsidian community directory

Checked against the [official submission guide](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) on 2026-10-03.

## Before the first public release

- Confirm that **Mermaid Viewer** and `mermaid-viewer` are available in the directory. Keep package name, manifest ID and installation directory consistent.
- Replace `author: Local` in `manifest.json` with the author's public name and set `package.json.repository`.
- Choose a license, add `LICENSE`, and replace `UNLICENSED` in `package.json`. Review any third-party attribution or permission requirements, including visual references such as codebase-visualizer.
- Check the declared `minAppVersion` on that version or raise it to one that has actually been validated. Test mobile devices or set `isDesktopOnly: true` for a desktop-only first release.
- Keep generated builds, local backups, machine settings and dependencies out of Git. The examples and images under `docs/` are fictional and reproducible.

No remote repository, public release or directory submission is created by the local development scripts.

## Steps

1. Use this project directory as the root of a public GitHub repository. Include README, source, tests, manifest, lockfile and the chosen LICENSE.
2. Run `npm ci`, `npm run check` and `npm run release:check`. The last command reports unfinished public metadata and licensing separately from engineering checks.
3. Synchronize versions with `npm run version:set -- 1.5.1`, then build. Commit the source and manifest to the default branch.
4. Push a tag matching `manifest.version` exactly, for example `1.5.1`, without a `v` prefix. The release workflow checks the package and creates a draft.
5. Inspect and publish the GitHub Release. Attach `main.js`, `manifest.json` and `styles.css` directly from `dist/`; a zip alone is not enough.
6. Sign in at [Obsidian Community](https://community.obsidian.md/), link GitHub and add the plugin repository. The directory reads the default branch's manifest and the corresponding Release assets.
7. Resolve review feedback, increment the version and publish another Release as needed. The plugin becomes installable after review errors are resolved and the entry is published.

The workflows in `.github/workflows/` run CI and create Release drafts; they do not automatically publish or submit the plugin. Remote workflow execution has not been verified yet.

## References

- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)
