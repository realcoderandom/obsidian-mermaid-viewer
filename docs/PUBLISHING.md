# Publishing to the Obsidian community directory

Checked against the [official submission guide](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) on 2026-10-03.

## Before the first public release

- Confirm that **Mermaid Viewer** and `mermaid-viewer` are available in the directory. Keep package name, manifest ID and installation directory consistent.
- The public author is `realcoderandom`. The public source repository is [realcoderandom/obsidian-mermaid-viewer](https://github.com/realcoderandom/obsidian-mermaid-viewer), configured in `package.json.repository`.
- The project uses the [MIT License](../LICENSE), included in the build and Release assets. Review any third-party attribution or permission requirements, including visual references such as codebase-visualizer.
- Check the declared `minAppVersion` on that version or raise it to one that has actually been validated. Test mobile devices or set `isDesktopOnly: true` for a desktop-only first release.
- Keep generated builds, local backups, machine settings and dependencies out of Git. The examples and images under `docs/` are fictional and reproducible.

Build and local-install commands do not publish anything. Only the release workflow (or an explicit run of `scripts/publish-release.mjs`) publishes a GitHub Release; community submission remains a separate step.

## Steps

1. Use this project directory as the root of a public GitHub repository. Include README, source, tests, manifest, lockfile and the chosen LICENSE.
2. Run `npm ci`, `npm run check` and `npm run release:check`. The last command reports unfinished public metadata and licensing separately from engineering checks.
3. Synchronize versions with `npm run version:set -- 1.5.2`, then build. Commit the source and manifest to the default branch.
4. Push a tag matching `manifest.version` exactly, for example `1.5.2`, without a `v` prefix. The release workflow checks the package, creates or updates a draft, downloads and verifies every installation asset, and then publishes it.
5. Confirm that the Release workflow succeeded. The public Release must contain `main.js`, `manifest.json`, `styles.css` and `LICENSE` as direct attachments. The workflow supplies a versioned title and notes from the matching CHANGELOG entry; do not create a separate empty Release.
6. Sign in at [Obsidian Community](https://community.obsidian.md/), link GitHub and add the plugin repository. The directory reads the default branch's manifest and the corresponding Release assets.
7. Resolve review feedback, increment the version and publish another Release as needed. The plugin becomes installable after review errors are resolved and the entry is published.

Pushing a version tag authorizes the Release workflow to publish that checked version. Failed asset verification leaves the release as a draft. The workflow never submits the plugin to the community directory.

## References

- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)
