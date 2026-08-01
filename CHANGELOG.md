# Changelog

All notable changes to Console Hopper are listed here. Dates are in
`YYYY-MM-DD`. Versions follow the value in `manifest.json`.

## 1.4.0 — 2026-08-01

### Added

- **Region control for jumps.** The Jump bar now has its own region selector, and
  a jump profile can carry a default landing region as a fourth field
  (`Org | hub | role | region`). AWS drops a switched role into whatever region
  it likes — its per-identity default is "Last used Region" — so Console Hopper
  corrects the landing region to the one you picked.
- **Always start in your default region.** *Remember the region I pick per role*
  in General Settings (on by default) can be turned off, so every row and the
  Jump bar always open on your default region instead of the last one used.
- **Active AWS sessions panel.** A counter at the foot of the right column shows
  how many of AWS's five concurrent console sessions are in use — amber with one
  slot left, red when full, plus a toast at the cap. Open it for each session's
  account, role, region, tab group, start time, time remaining and open-tab
  count, and sign any single session out to free a slot. Reads session metadata
  only; cookie contents are never touched.
- **Skips AWS's session picker during a jump.** With several sessions open, AWS
  asks which to switch from and does not reliably pre-select the right one —
  the cause of "the selected session doesn't have permission to switch to that
  role". Console Hopper now selects the hub session and submits the pre-filled
  form, but only during a jump you started, only when the match is unambiguous,
  and only for the destination you entered.
- **Hub role in a jump profile.** A hub account with several roles can name the
  one to sign in as: `111111111111/HubRole`. Without it the first row for that
  account is used, which may be a role that cannot assume anything.

### Changed

- **"Assume Profiles" is now "Jump Profiles"** in the side menu, so its name
  matches the *⤳ Jump to account* button it configures. Stored settings are
  unchanged.

### Fixed

- **Console tabs stopped being decorated after sign-in.** With AWS multi-session
  enabled, a sign-in lands on the regional console host and is then redirected to
  a per-session one — a different origin, where the hand-off carrying the env
  colour and account name no longer existed. Every direct sign-in was landing
  without its coloured favicon or account title prefix. The hand-off now travels
  through extension storage, which the redirect can't strip.
- **Accounts without an IAM alias were unmatchable by ID.** AWS renders such an
  account as a bare 12-digit number with no `name (id)` form, so the account id
  was parsed as empty — silently breaking jump-hub matching, tags, filters and
  account names for those accounts.
- **A jump could lose its region and tab decoration.** The hand-off written for
  the console side was not awaited before the page navigated away, so it
  sometimes never reached storage.
- **Jump tab decoration was dropped on landing.** The destination console loads
  more than once; the first load consumed the single-use hand-off, leaving later
  loads undecorated. The label is now persisted for the tab.
- **Hardened settings-import validation.** Region values are now charset-checked
  wherever they can reach a URL, and the footer link accepts only `http(s)`
  URLs — on save, on import, and again where it is rendered.
- **Sign-in payload provenance.** The label a sign-in passes to the console tab
  now carries a single-use token, so only payloads this extension issued are
  acted on.
- **Clear AWS Sessions now removes non-Secure cookies too.** They were being
  counted as cleared while silently surviving. The wording also now says which
  sessions it can and cannot reach.
- **Click-away did not dismiss pop-outs** (the Jump popover, the sessions
  popover, an armed ✕) when the click landed below the page content, because the
  listeners were bound to `body` rather than `document`.

## 1.3.0 — 2026-07-22

### Added

- **Account tags.** Give any account one or more short tags and organise your
  list by *your* vocabulary, not just AWS's names. A small tag chip sits on each
  role row — click it to add or remove tags inline (with autocomplete from tags
  you already use), or manage them in bulk from **Account Tags** in the side
  menu. Tags join the search text, get their own filter row (shown from the very
  first tag), and are searchable with `tag:`.

- **A far more powerful search box.** The search field **pops out into a roomy
  card** when focused, with click-to-insert suggestions and a syntax legend.
  Matching is now **separator-insensitive** (`test 123` finds `test123`), with
  `"quotes"` for an exact phrase. Scope a term to a field with **`field:value`**
  — `tag:`, `role:`, `name:`, `account:`, `env:`, `type:`, `org:` — and combine
  terms with a space (**and**), a comma (**or**), or a leading `-` to
  **exclude**. A live **match count** shows how many roles remain. When a tag
  matches, its chip lights up.

- **Save a search as a Shortcut.** Built a useful query + filter combination?
  Click **☆ save as shortcut** in the search card, name it, and it becomes a chip
  in the Shortcuts row — one click re-applies the whole view (search *and*
  filters).

- **Start View, redesigned and expanded.** The Start View dialog is now one tidy
  set of chips grouped by *Views* (Favorites / Recent), *Shortcuts*, and *Tags* —
  pick any one and the picker opens on it every load. The active choice is
  highlighted, and **Save current filters** / **Clear** sit in the footer.

### Changed

- **Enter is now unambiguous.** Pressing Enter signs in **only** to a role you've
  explicitly selected with the arrow keys — never to an arbitrary first result.
  Type to filter, arrow to the row you want, then Enter. Use **⌥/Alt + ↑ ↓** to
  move through the search suggestions instead, and Enter to add the highlighted
  one. Tapping **⌥/Alt** jumps focus to the search box.

- **Consistent "click again to remove" deletes.** Removing a saved shortcut, a
  jump-history entry, or a tag all behave the same way now: the first **✕** click
  arms it (turns red), a second confirms, and it auto-cancels if you click away —
  clear, but hard to trigger by accident.

### Fixed

- **Tags made only of digits now filter correctly.** A numeric tag like `123`
  was read as a number internally and silently failed to match the (string) tags
  stored on each row; word tags were unaffected. Numeric tags now filter and
  highlight like any other.

## 1.2.2 — 2026-07-13

### Added

- **Manage your jump history.** In the Jump popover, hovering a recent reveals a
  **★ pin** and **✕ delete**. Pinned destinations (filled gold star) sit at the
  top of the list and survive the 6-recents cap, so a place you jump to often
  stays one click away without retyping its 12-digit account id — and you can
  **drag pinned entries to reorder** them, with the same smooth motion as the
  main role list. The list also caps its height and scrolls, so a long history
  can't push the popover off the bottom of the screen.

### Fixed

- **"Custom tag" tab-grouping is now a saved choice**, like By role / By org /
  Off. Previously, choosing "Custom tag" saved nothing, so with an empty tag a
  Sign In silently grouped by whatever mode was set before (often "Off" → no
  group at all), and the dropdown only re-synced after a page reload. Now the
  dropdown is the single source of truth: an empty custom tag means no group —
  every time — and the choice persists across sign-ins and reloads.

## 1.2.1 — 2026-07-12

### Changed

- **Tab grouping is now a single self-labelling dropdown.** The free-text "tab
  group tag" field (which used to sit among the filter chips) is replaced by a
  **Tabs:** dropdown — *By role / By org / Custom tag / Off*. A custom tag is
  just the fourth choice, so its input appears only when you pick **Custom tag**,
  and hides (and clears) when you pick a mode. The side-menu Tab Groups dialog
  still works and stays in sync.
- **The right side is now one tidy vertical stack** — *Find account*, *Jump to
  account*, then *Tabs:* — each control labelling itself, fenced by hairlines.
  The separate tab-group column is gone, which also gives the filters more room.
  (Tabs sits last so revealing its custom-tag field doesn't push Jump around.)
- **Filter order** is now Organizations / Environments / Account types / Roles.
- **Clear buttons on the text fields.** A small ✕ appears in the account search,
  the custom-tag field, and the Jump popover's account-id and session-label
  fields whenever they hold a value — one click empties them.
- **Jump recents** show the org and the role used on a second line, and the rows
  highlight on hover like the main listing.
- **Polish.** The side-menu pull-tab now sits at the vertical middle of the
  panel; the menu's left/right padding is even and a little roomier; and the
  spacing under the role list, down to the footer, is tightened.

### Fixed

- **Jumped-into sessions are now placed in a tab group** like a normal sign-in.
  The Jump built its own tab payload without the grouping info, so the
  destination console tab (and the Switch Role page on the way there) stayed
  ungrouped. The tab is now grouped the moment you jump — by the destination
  account and assumed role, or your custom tag / org, honouring the Tab group
  setting — and, since a tab keeps its group across navigations, it stays
  grouped through the whole chain.
- **The side menu no longer clips a button's left edge on hover.** A leftward
  hover nudge collided with the panel's clipped inner edge and ate the button's
  left border; the nudge is gone and the panel is wider.
- **The tab-group tag was ignored when you signed in immediately after typing
  it.** The in-memory value only updated on a 300 ms debounce, so a quick Sign
  In read a stale (often empty) tag and grouping fell back to by-role. The tag
  now updates on every keystroke; only the storage write is debounced.

## 1.2.0 — 2026-07-11

### Added

- **Jump to account (role chaining).** For accounts you can only reach by
  assuming a role from a hub: configure per-org **Assume Profiles** (one line
  per org — `Org name | hub account id | role to assume`), and a
  **⤳ Jump to account** button appears beside search. Pick the org, enter the
  12-digit destination account and an optional session label, and Console
  Hopper signs into the hub and opens AWS's Switch Role pre-filled — one click
  there and you're in. The jumped-into tab is titled with your session label
  (plus env colour when the account matches an Environment pattern), and your
  recent jumps are one click away inside the popover. The hub→target trust must
  already exist in AWS; chained sessions are capped at 1 hour by AWS.
- **Start View.** Save the filters and search you have selected as the view the
  role picker opens with — it's re-applied automatically on every load. Set it
  from the new **Start View** side-menu entry, which offers a one-click
  **★ Start with my Favorites** (open the picker showing only your starred
  roles), **Save my current filters**, or **Clear** (which leaves your favorites
  intact).

### Changed

- **Redesigned filter panel.** Filters now read as aligned label rows
  (Organizations / Environments / Roles / Account types / Shortcuts) with
  Search and Jump in a compact rail on the right — replacing the old
  two-column layout with scattered section headers.
- **Filter rows with fewer than two options hide automatically** — a lone
  option can't narrow the list, so the row is pure noise. The row reappears
  as soon as a second option is configured, and hiding a row also releases
  any filter it had active so nothing stays constrained invisibly.
- **Simplified side menu.** Items are grouped under View / Configure / Data /
  Help, the word "Manage" is gone from the config entries (and their modal
  titles), and the menu scrolls when it's taller than the window.
- **Compact mode is actually compact now.** It tightens the panel padding and
  the spacing between result rows (the rows themselves keep their full size),
  instead of only nudging the filter chips together.
- The **tab-group tag** field now clears when you click into it — the common
  intent there is to wipe the current tag, so it no longer needs selecting and
  deleting by hand.

### Fixed

- Pressing **Enter** in the search box no longer toggles a role's favorite — it
  signs into the selected (or first visible) role, as intended. The ☆ and
  **Sign In** buttons had no explicit `type`, so they defaulted to form-submit
  buttons and the search field's implicit Enter-submission was clicking the
  first one (the star).
- **Session labels with emoji or non-Latin characters** no longer break the
  tab-decoration payload (it's now UTF-8-safe end-to-end).
- Hardening: the Switch Role hand-off re-validates the destination account
  before navigating, pending jump decorations expire and prune after 5
  minutes, and stored jump recents are validated and capped on read.

## 1.1.0 — 2026-06-02

### Added

- **Rename accounts.** Map specific account IDs to a custom name via the new
  **Manage Account Names** panel; the custom name replaces the AWS account name
  in the list and is used for filtering, grouping, and tab titles. Saving
  updates the open list immediately — no page reload.
- **Per-row region picker.** Each role row now has a region dropdown beside the
  service picker, choosing which AWS region that sign-in targets. It defaults to
  the General Settings region and remembers your last pick per role — just like
  the service dropdown. Configure which regions appear (and their order) via the
  new **Manage Regions** panel. Ships with the regions that are enabled by
  default in every account (Frankfurt first); opt-in regions and GovCloud/China
  are excluded (add opt-in ones via Manage Regions). The default sign-in region
  is chosen in General Settings from a dropdown of your Manage Regions list
  (ships as **eu-central-1 / Frankfurt**).
- **Clear AWS Sessions.** A confirm-gated side-menu button that signs you out of
  all open AWS consoles by clearing AWS authentication cookies. Cookies only —
  your console favorites and settings are kept. Adds the `cookies` permission and
  `https://*.aws.amazon.com/*` host access (cookies are only deleted, never read
  or transmitted).
- **Sign-in tab control.** A side-menu **Sign-in** option — a small dialog with
  explanations, like Tab Groups — chooses whether a plain Sign In click opens the
  console in the same tab or a new tab. ⌘/Ctrl-click or middle-click inverts it,
  so both behaviours are always one click away.

### Changed

- Reworked each role row into an aligned grid — ★ · account name · role name ·
  account ID · Service · Region · Sign In — so every column lines up vertically
  across rows. The two name columns flex (with ellipsis) so long account/role
  names get the room, while the controls stay aligned. The account ID is now a
  click-to-copy button (the separate "Copy Account ID" button is gone).
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
