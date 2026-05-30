# Changelog

All notable changes to Console Hopper are listed here. Dates are in
`YYYY-MM-DD`. Versions follow the value in `manifest.json`.

## 1.1.0 — 2026-06-02

### Added

- **Per-row region picker.** Each role row now has a region dropdown beside the
  service picker, choosing which AWS region that sign-in targets. It defaults to
  the General Settings region and remembers your last pick per role — just like
  the service dropdown. Configure which regions appear (and their order) via the
  new **Manage Regions** panel.
- **Clear AWS Sessions.** A confirm-gated side-menu button that signs you out of
  all open AWS consoles by clearing AWS authentication cookies. Cookies only —
  your console favorites and settings are kept. Adds the `cookies` permission and
  `https://*.aws.amazon.com/*` host access (cookies are only deleted, never read
  or transmitted).

### Changed

- Removed the bundled jQuery dependency in favour of a small built-in DOM
  helper. The installed extension is now ~50% smaller (submission package
  95K → 48K) with no change in behaviour.
- The "loaded successfully" toast no longer pops on every visit to the
  sign-in page, and verbose debug logging no longer prints to the browser
  console in the shipped build. Genuine warnings and errors are unchanged.

### Internal

- Added a build toolchain (esbuild bundle + minify), ESLint, Prettier, and a
  vitest test suite, wired into GitHub Actions CI. Source now lives in `src/`
  and is bundled into the shipped `content.js` — load the built `dist/` folder
  when developing (see README). No user-facing behaviour change.

## 1.0.2 — 2026-05-22

### Changed

- Footer / console-log / settings-export version now read from
  `manifest.json` at runtime via `chrome.runtime.getManifest()`,
  instead of from a hardcoded `SCRIPT_VERSION` constant that had
  drifted from the manifest (the constant said `1.0` even on 1.0.0
  and 1.0.1 installs). One source of truth going forward.

---

## 1.0.1 — 2026-05-22

### Added

- MIT `LICENSE` file at the repo root. Code is now released under the
  MIT License — previously the public repo had no explicit licence,
  which legally meant "all rights reserved" and contradicted the
  open-source impression a public repo gives.

### Fixed

- Dark mode: restored the per-entry coloured borders on filter chips
  (Organizations, Environments, Role names, Account types). The generic
  dark-theme rule was overriding the inline `--tm-fb-color` border with
  a uniform grey, so all chips looked identical in dark mode. The same
  fix also restores the coloured fill on the active state.
- Filter chip hover feedback: the light-mode hover background was too
  close to white to be perceptible, and active chips had no hover state
  at all. Bumped the idle hover shade and added a brightness-based
  hover for active chips that works across both themes and any
  per-entry colour.
- Side action menu now hides fully off-viewport, exposing only the
  "…" handle on the right edge. The previous offset (`right: -120px`)
  was tuned for a narrower container; longer button labels grew the
  panel past that, leaving roughly half of it sticking out. The
  container now has a fixed width so the slide-out geometry is
  predictable.

---

## 1.0.0 — Initial public release

- First Chrome Web Store submission.
