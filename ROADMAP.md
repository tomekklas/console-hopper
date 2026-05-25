# Console Hopper — Staged Improvement Plan

## Context

Console Hopper (v1.0.2) is a well-built, security-conscious Manifest V3 Chrome
extension that turns the **classic AWS SAML role-picker**
(`https://signin.aws.amazon.com/saml`) into a filterable launcher, colours/labels
AWS console tabs, and clusters them into Chrome tab groups. Documentation
(README, PRIVACY, STORE_LISTING, CHANGELOG) is excellent; escaping is consistent
(`escapeHtml`/`escapeAttr`/`sanitizeInput`); there is **no** `innerHTML`, remote
code, or telemetry; permissions are minimal. It is a polished v1.

This document captures the three highest-leverage improvements found in a thorough
read of the code, organised into **independently-shippable stages** so the work
can land incrementally (bump `manifest.json` version + re-run `npm run build` and
resubmit to the Web Store after any stage).

**Decisions already made (owner):**
- **No IAM Identity Center** support in this round — parked for v2.
- **No "resilience to AWS DOM changes" work** — the SAML role-picker page has
  been stable for years and is very unlikely to change.

### The three headline improvements

| # | Improvement | Maps to stages | Why it's top-tier |
|---|---|---|---|
| **1** | **Shadow DOM UI isolation** | Stage 5 | Eliminates the **1,171 `!important`** declarations + the 850-line injected `<style>`; the extension's CSS stops leaking onto AWS's page and AWS's CSS stops leaking in. Huge maintainability win. |
| **2** | **Toolchain modernization** | Stages 1, 3, 4 | Drop bundled **jQuery (85KB)**, add an esbuild build + minify, split the **4,872-line** `content.js` into modules, add unit tests + ESLint + CI. Long-term health + contributor trust for a public OSS repo. |
| **3** | **Accessibility** | Stage 6 | The custom UI has **0** `aria-*`, **0** `role=`, **0** `tabindex`. Add dialog semantics + focus trap, `aria-pressed` chips, live result counts. Cheapest done *with* Stage 5; broadens adoption and clears WCAG bars enterprises require. |

Stage 2 folds in the small **polish** wins (kill the per-load success toast; quiet
the 57 `console.*` calls).

> **Deferred to v2+** (documented at the end, not in this round): IAM Identity
> Center access-portal support; an env-coloured banner across the console window
> itself; per-sign-in region quick-switch; fuzzy search; Firefox/Edge port.

---

## Status (as of 1.1.0)

Stages 1–4 (improvement **#2, toolchain**) are **shipped in 1.1.0**: build + CI,
console cleanup, jQuery removed (zip 95K → 48K), `src/` modules + 25 tests.

The other two headline improvements were re-evaluated against the actual code:

- **#1 Shadow DOM — dropped (poor architectural fit).** Console Hopper injects
  its controls *into* AWS's light-DOM `.saml-role` rows and styles those rows,
  and the toolbar lives inside the SAML `<form>`. A shadow root can't enclose
  any of that, so most of the 1,171 `!important` would have to stay regardless.
  Combined with "AWS won't change that page" (so the CSS-stability rationale is
  moot), it isn't worth the risk/effort. Isolating just the 6 standalone modals
  remains a small optional future item.
- **#3 Accessibility — skipped** by owner decision.

1.1.0 is a clean, self-contained release. Further ideas live in "Deferred to
v2+" below (the console env-colour banner is the standout).

## Staged execution

Each stage is self-contained, behavior-preserving unless noted, and shippable on
its own.

### Stage 1 — Build & CI foundation *(no behavior change)*

**Goal:** introduce tooling without changing the shipped output yet.

- Add `package.json` with **esbuild** (bundle/minify), **ESLint** + **Prettier**,
  and **vitest** (unit tests, wired now, used from Stage 4).
  - Note: `web-ext lint` is Mozilla's *Firefox* linter — it false-fails on a
    Chrome-only MV3 manifest (`background.service_worker`, missing `gecko.id`),
    so it's deferred to the Firefox port (v2+), not used as a Chrome CI gate.
- `npm run build` bundles `content.js` (+ future modules) into the single file the
  manifest references and produces the zip (replacing `build.sh`, keeping its
  manifest-JSON sanity check and file-list echo).
- Add a **GitHub Actions** workflow: `lint` + `build` + `web-ext lint` on push/PR.
- `.gitignore` already covers `*.zip`; add `node_modules/` and `dist/`.

**Risk:** low. **Verify:** built unpacked extension behaves identically to the
current one on the SAML page; CI green (lint + test + build).

### Stage 2 — Quick polish *(tiny behavior change: quieter)*

**Goal:** stop the noise.

- Remove the **per-load success toast** — `showToast("Console Hopper loaded
  successfully!", …)` fires on *every* visit (final lines of the IIFE).
- Replace the **57 `console.log/warn/error`** calls with a `debug()` helper gated
  on a flag, and have the esbuild prod build **drop** debug logs. Keep genuine
  `console.error` for real failures behind the same gate.

**Risk:** low. **Verify:** DevTools console is clean on a normal load; no toast on
load; toasts still fire on real actions (sign-in errors, import, etc.).

### Stage 3 — Drop jQuery *(behavior parity; −85KB)*

**Goal:** remove the bundled `lib/jquery.min.js` dependency.

- The ~137 `$()` calls use only mechanical methods (`.find`, `.on`, `.val`,
  `.text`, `.map`, `.filter`, `.append`, `.attr`, `.remove`, `.each`, `.closest`,
  `.addClass/removeClass`, `.css`, `.trigger`, `.data`, `.prop`, `.html`×2,
  `.fadeOut`×1) — all have direct vanilla equivalents. Add a tiny internal helper
  module covering the few ergonomic ones:
  - `.on(evt, selector, fn)` → delegated `addEventListener` + `e.target.closest(selector)`.
  - `.trigger("custom")` → `dispatchEvent(new CustomEvent(...))`.
  - `.fadeOut` → a small CSS-transition helper.
- Remove `lib/jquery.min.js` from `manifest.json` `content_scripts[0].js` and
  delete the file.

**Risk:** medium (touches event handling, drag-reorder, modals). Mitigated by
Stage 4's tests landing right after. **Verify:** every interaction (filter chips,
search, favorites, drag-reorder, all 6 modals, deep-link sign-in, new-tab sign-in)
works exactly as before; bundle ~85KB smaller.

### Stage 4 — Modularize + unit tests *(internal)* — done (focused scope)

**Goal:** make the logic testable; establish the `src/` → `dist/` build.

- Source now lives in `src/content/`, bundled by esbuild into a single classic
  `dist/content.js`. Dev loads `dist/` after `npm run build`.
- Extracted first (the chosen focused scope): `dom.js` (the jQuery-subset shim)
  and `util.js` (pure helpers — `escapeHtml`/`sanitizeInput`, `parseAccountInfo`,
  `matchesAnyPattern`, `matchesRolePatterns`). The rest stays in `index.js` and
  can be split further incrementally (render / filtering / dnd / modals).
- **vitest** unit tests in `test/`: `util.test.js` (node) + `dom.test.js`
  (jsdom) — 25 tests covering the pure logic and the shim.

**Verify:** `npm run lint` (0 errors), `npm test` (25 pass), `npm run build`.
Remaining per-feature splits + tests for the managers/`buildDestination`/
`resolveTitle`/`hashString` can land opportunistically later.

### Stage 5 — Shadow DOM isolation *(Improvement #1)*

**Goal:** stop fighting AWS's CSS; delete the `!important` war.

- Create one **open shadow host** on the SAML page and re-root the UI into it:
  the main panel (`samlForm.prepend(mainPanelHTML)`), the floating actions, and the
  **six modals** currently appended to `<body>`.
- Move the **850-line CSS** (`const css = …` → injected `<style>`) into the shadow
  root via a constructable/adopted stylesheet, and **strip the 1,171 `!important`**
  — no longer needed once isolated.
- Watch the known gotchas: re-declare fonts inside the root; keep fixed-overlay
  positioning; confirm the FLIP drag-reorder, the modal `MutationObserver`, theming
  (`body.tm_theme_dark` classes → host attribute), and native `<select>` dropdowns
  still work inside the shadow root. Keep the `console-decorator.js` favicon/title
  logic as-is (it runs on the console page, not here).

**Risk:** high (largest rewrite) — that's why tests (Stage 4) land first.
**Verify:** pixel/behavior parity for all UI; AWS page styles can no longer bleed
in or out; light/dark/auto theme + compact mode intact.

### Stage 6 — Accessibility *(Improvement #3)*

**Goal:** make the UI usable with a keyboard and screen reader. Done **with/after
Stage 5** while the rendering is already being rewritten.

- Modals: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; a **focus
  trap**; **return focus** to the trigger on close; ensure Esc closes.
- Filter chips: `aria-pressed` reflecting active state; accessible names.
- An `aria-live="polite"` status node announcing filtered result counts / "no
  matches".
- Non-colour cue for environment in the picker rows (colour-only fails WCAG
  1.4.1); consistent visible focus rings; an accessible name on every control.

**Risk:** low-medium. **Verify:** keyboard-only walkthrough (Tab/Shift-Tab stays
within an open modal, returns focus on close); VoiceOver/NVDA announces dialogs,
chip states, and result counts; axe DevTools shows no critical violations.

---

## Critical files

| File | Role | Touched in |
|---|---|---|
| `content.js` | 4,872-line main script (IIFE) | All stages |
| `manifest.json` | MV3 manifest; lists jQuery + content.js | 1, 3 |
| `lib/jquery.min.js` | 85KB bundled dep — to be removed | 3 |
| `build.sh` | current zip builder | 1 (fold into npm) |
| `console-decorator.js` | favicon/title on console pages | unchanged (v2 candidate) |
| `background.js` | tab-group service worker | unchanged (logic reused in tests) |
| `package.json`, esbuild/eslint configs, `.github/workflows/*` | **new** | 1 |

## Reusable code already present (don't reinvent)
- Escaping: `escapeHtml`/`escapeAttr`/`sanitizeInput`.
- Storage safety wrapper: `safeStorageOperation`.
- Pure classifiers ideal for unit tests: `matchesAnyPattern`, `*.classify`,
  `parseAccountInfo`, `resolveTitle`, `hashString`/`colorFor`, `buildDestination`.
- Version single-source: `chrome.runtime.getManifest().version`.

## Overall verification
- **Per stage:** load unpacked in a clean Chrome profile; exercise the full UI on
  the SAML page (or a saved/sanitized role-picker HTML fixture — recommended to
  capture one for repeatable testing without live AWS).
- **Automated:** `npm run lint`, `npm test` (vitest), `npm run build`, CI green.
- **Release:** bump `manifest.json` version, `npm run build`, confirm the printed
  zip file-list contains only shipping files, smoke-test the zipped build.

---

## Deferred to v2+ (out of scope this round)
- **IAM Identity Center access-portal** support (`*.awsapps.com/start`) — biggest
  reach play; React SPA, larger effort.
- **Console-window env colour** — slim coloured banner/tint across the AWS console
  (not just the favicon); builds on `console-decorator.js`; the signature feature
  of AWS Extend Switch Roles.
- **Region quick-switch** — expose `{region}` per sign-in instead of one global.
- **Fuzzy search** — subsequence/typo-tolerant matching for large role lists.
- **Firefox/Edge port** — `webextension-polyfill` + `browser_specific_settings`
  (`gecko.id`, `background.scripts`); re-add `web-ext lint` here (it targets
  Firefox and false-fails on a Chrome-only MV3 manifest). Firefox additionally
  unlocks per-account session isolation via containers.
