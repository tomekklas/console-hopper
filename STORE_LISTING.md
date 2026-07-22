# Chrome Web Store — Submission Form Values

Paste-ready text for every field of the developer dashboard, plus the
permission justifications and privacy statements Chrome reviewers will ask
for.

---

## Store listing

### Name
*(max 75 characters)*

```
Console Hopper
```

### Summary / short description
*(max 132 characters, single line, no rich text)*

```
Hop between AWS consoles fast: role-picker search + account tags, deep-link services, env-coloured tabs, configurable tab groups.
```

### Detailed description
*(max 16,000 characters; plain text with basic line breaks)*

```
Console Hopper turns the AWS SAML role-picker into a fast, filterable
launcher and makes a tab strip full of AWS consoles instantly readable.

If you have access to dozens — or hundreds — of AWS accounts via SAML
SSO, the default role list is a long, unsorted scroll. Console Hopper
gives every row a star, a service deep-link, and a one-click sign-in,
and gives every open console tab a colour-coded favicon plus an account
name in the title.

WHAT YOU GET

• Filter and search the role list
  Filter by organisation, environment (prod/test/dev), account type
  (Management / Security / Logging / …), role-name keyword (Admin /
  ReadOnly / PowerUser / …) or your own tags. The search box is
  separator-insensitive (type "test 123" to find "test123") and
  supports scoped terms — tag:, role:, name:, account:, env:, type:,
  org: — combined with a space (and), a comma (or) or a leading -
  (exclude), with "quotes" for an exact phrase. It pops out into a
  roomy card with click-to-insert suggestions and a live match count.
  Every filter group is editable from the side menu.

• Tag accounts
  Give accounts your own short labels — palo-alto, prod-network, a
  ticket number — and organise by them. Add or remove tags inline from
  a chip on each row (with autocomplete), or edit in bulk from the side
  menu. Tags get their own filter row and are searchable with tag:.

• Save searches as shortcuts
  Turn a useful query + filter combination into a named chip in one
  click, then re-apply the whole view — search and filters — whenever
  you need it. Set any shortcut (or Favorites, Recent, or a tag) as your
  "Start View" so the picker opens on it every load.

• Rename accounts
  Map specific account IDs to a friendly name via "Account Names". The
  custom name replaces the AWS account name in the list and is used for
  filtering, grouping and tab titles.

• Jump to account (role chaining)
  For accounts you can only reach by assuming a role from a hub:
  configure per-org assume profiles once (org name, hub account id,
  role to assume) and a "Jump to account" button appears in the search column.
  Enter the destination account id and an optional session label —
  Console Hopper signs into the hub and opens AWS's Switch Role
  pre-filled, one click and you're in. The new tab is titled with your
  session label, and recent jumps are one click away — pin the ones you
  use most (they stay at the top and can be dragged to reorder) or
  remove any you don't need.

• Favorites and Recent
  Star roles you use often. Recently signed-in roles are tracked
  automatically (configurable limit).

• Deep-link into a service
  Each role row has a service dropdown — EC2, S3, IAM, CloudWatch,
  Lambda, CloudFormation, VPC, RDS, plus anything you add. Pick a
  service before Sign In and you land directly in that service's
  console for that role.

• Per-sign-in region
  Each role row also has a region dropdown — choose which AWS region a
  sign-in lands in (defaults to your region, remembers your last pick
  per role). Edit the offered regions via "Regions".

• Copy account ID
  Click the account-id button on any row to copy the 12-digit id.

• Colour-coded console tabs
  Every AWS console tab opened through the plugin gets a coloured
  favicon (env colour) and an account-name title prefix, so ten open
  tabs are still distinguishable at a glance.

• Tab groups — visual containers
  Console Hopper drops each new console tab into a Chrome tab group:
  by role, by organisation, or by a per-ticket override tag. Same role
  always gets the same colour. Note: tab groups are a Chrome visual
  feature only — they don't isolate cookies. For real session
  isolation, combine with Chrome profiles.

• Sensitive-sign-in confirmation
  Configure which role-name keywords (default: "admin") and which
  account types are sensitive. Signing into a matching role/account
  pops a "are you sure?" modal so you don't accidentally land in
  production.

• Clear AWS sessions
  One click signs you out of all open AWS consoles by clearing AWS
  authentication cookies (your console favourites and settings are kept).

• New-tab sign-in
  ⌘/Ctrl-click, middle-click or ⌘+Enter opens the console in a new tab.
  A "Sign-in" side-menu option sets the default; the modifier inverts it.

• Drag-to-reorder
  Hold and drag any role row to set your preferred order. "Reset Order"
  in the side menu restores AWS's default.

• Light / dark / auto theme, compact mode, keyboard shortcuts
  / or Ctrl/Cmd+K (or a tap of Alt) focuses search, ↑/↓ moves the
  selection, Alt+arrows walk the search suggestions, Enter signs in to
  the selected role, Esc closes modals / clears filters.

• Export / import settings as JSON
  Share your configured orgs, envs, account types, role names,
  services, tags, favorites and shortcuts with a teammate.

• Org-agnostic
  Ships with generic placeholders. You rename Org A / Org B / Org C and
  fill the patterns to match your real organisations. No hard-coded
  vendor names anywhere.

PRIVACY

Console Hopper runs entirely in your browser. It does not contact any
remote server, send telemetry, or collect personal data. All settings
(favorites, custom org / env / type / role labels, recent signins,
preferences) are stored in chrome.storage.local — they never leave
your device unless you click "Export Settings" yourself.

PERMISSIONS — WHY

• storage      — persist your preferences and configuration locally
• tabs         — read the current tab so the service worker knows which
                 console tab just opened (needed for tab grouping)
• tabGroups    — create and colour Chrome tab groups for each
                 account+role combination
• host access  — limited to AWS SAML sign-in pages and AWS console
                 pages, so the plugin can enhance the role-picker and
                 decorate console tabs. No other sites are touched.

INSTALL

1. Install from the Chrome Web Store.
2. Open your AWS SAML sign-in URL. The role picker is now the Console
   Hopper UI.
3. On first load, a welcome panel walks you through the highlights.
4. Configure your organisations, environments, account types, role
   names and services from the side menu (hover the right edge).

This extension is community-built and not affiliated with Amazon Web
Services. "AWS" is a trademark of Amazon.com, Inc.
```

### Category
```
Productivity
```
*(Alternative: "Developer Tools" if you'd rather position it as a dev tool.)*

### Language
```
English (United States)
```

---

## Graphic assets

All assets live in `store-assets/` (kept in git, excluded from the
submission zip — they're for the listing only, not for the extension
package).

| Field | Spec | File | Shows |
|---|---|---|---|
| Store icon | 128 × 128 PNG | ✅ `icons/icon128.png` | — |
| Screenshot 1 | 1280 × 800 | ✅ `store-assets/screenshot-1-main.png` | The filterable role picker |
| Screenshot 2 | 1280 × 800 | ⚠️ `store-assets/screenshot-2-jump.png` | Jump-to-account popover — **refresh for 1.2.2** to show pinned jumps + drag-reorder (current image is pre-1.2.2 recents) |
| Screenshot 3 | 1280 × 800 | ✅ `store-assets/screenshot-3-side-menu.png` | Grouped side menu (View / Configure / Data) |
| Screenshot 4 | 1280 × 800 | ✅ `store-assets/screenshot-4-filter.png` | Filtering by PROD + ReadOnly |
| Screenshot 5 | 1280 × 800 | ✅ `store-assets/screenshot-5-dark.png` | Dark theme |
| Small promo tile (optional) | 440 × 280 PNG | ⚠️ `store-assets/promo-small-440x280.png` (pre-1.2 UI) | — |
| Marquee promo tile (optional) | 1400 × 560 PNG | ⚠️ `store-assets/promo-marquee-1400x560.png` (pre-1.2 UI) | — |

Chrome Web Store requires at least **one** screenshot; five is the max.
We're shipping the full five (1280 × 800, real extension). For 1.3.0 the
headline features — **account tags** and the **pop-out search with scoped
`tag:` / `role:` queries** — aren't shown in any current shot; refreshing a
couple (e.g. the main list with tag chips, and the search card mid-query)
would best represent this release. The two promo tiles are optional and
still show the pre-1.2 UI; regenerate them if you want them current, or drop them.

---

## Privacy practices

### Single purpose description
*(required, max 1000 chars)*

```
Console Hopper enhances the AWS Identity Federation sign-in page
(https://signin.aws.amazon.com/saml) by adding filters, search,
account tags, favorites, deep-link service shortcuts, environment
colour-coding, keyboard navigation and tab grouping, so users who have access to
many AWS accounts via SAML SSO can find and sign into the right
role faster. It also decorates AWS console tabs with a coloured
favicon and account-name title prefix so multiple open consoles
stay visually distinguishable. A one-click "Clear AWS Sessions" button
signs the user out of all AWS consoles by deleting AWS authentication
cookies (cookies only — never read or transmitted).
```

### Data usage disclosure
*(answer the form's Yes/No questions)*

| Question | Answer |
|---|---|
| Personally identifiable information | **No** |
| Health information | **No** |
| Financial and payment information | **No** |
| Authentication information | **No** |
| Personal communications | **No** |
| Location | **No** |
| Web history | **No** |
| User activity | **No** |
| Website content | **No** |

**Certifications** (tick all three):
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL

```
https://github.com/tomekklas/console-hopper/blob/main/PRIVACY.md
```

---

## Permission justifications
*(Chrome reviewers ask for one sentence per permission)*

### `storage`
```
Persists user-configured org / environment / account-type / role-name
filter definitions, favorites, recent sign-ins, service deep-link
list, theme and keyboard preferences in chrome.storage.local so they
survive across browser sessions.
```

### `tabs`
```
Reads the calling tab's id and window in the service worker so a
newly opened AWS console tab can be placed into the right Chrome tab
group. Tab URLs or content are not transmitted.
```

### `tabGroups`
```
Creates and updates Chrome tab groups so AWS console tabs cluster
visually by account + role (or by organisation, or by a user-supplied
ticket tag), emulating a Firefox-containers-style visual experience.
```

### `cookies`
```
Used solely by the extension's "Clear AWS Sessions" feature, which lets
the user sign out of all open AWS console sessions in one click. Only
when the user clicks "Clear AWS Sessions" and confirms, the service
worker enumerates cookies on aws.amazon.com and its sign-in / console
subdomains (chrome.cookies.getAll) and deletes them
(chrome.cookies.remove). It uses only each cookie's name and domain to
target it for deletion; it does not use, store, log, or transmit any
cookie value or content. No cookies are read for any other purpose, and
the extension makes no network requests of any kind.
```

### Host permission: `https://aws.amazon.com/*`, `https://*.aws.amazon.com/*`
```
Grants the cookies API the access it needs to delete AWS authentication
cookies for the "Clear AWS Sessions" feature. Limited to aws.amazon.com
and its subdomains — no other sites are touched.
```

### Host permission: `https://signin.aws.amazon.com/saml`, `https://*.signin.aws.amazon.com/saml`
```
Required to inject the enhanced role-picker UI into the AWS SAML
sign-in page. Without this host permission the extension cannot
display its filters, favorites, search or service dropdowns.
```

### Host permission: `https://console.aws.amazon.com/*`, `https://*.console.aws.amazon.com/*`
```
Required to set the per-tab favicon and tab-title prefix on AWS
console pages so the user can tell their many open AWS console
tabs apart at a glance.
```

---

## Distribution

| Field | Value |
|---|---|
| Visibility | **Public** (or **Unlisted** if you want share-by-link only) |
| Pricing | **Free** |
| Regions | **All regions** |
| Mature content | **No** |

---

## Optional listing fields

| Field | Suggested value |
|---|---|
| Official URL | `https://github.com/tomekklas/console-hopper` |
| Homepage URL | `https://github.com/tomekklas/console-hopper` |
| Support URL | `https://github.com/tomekklas/console-hopper/issues` |

---

## Pre-submission checklist

- [x] Manifest is clean of localhost host matches.
- [x] Icons are wired in (`icons/icon{16,32,48,128}.png`).
- [x] No remote code (`eval`, `new Function`, `fetch`, XHR, WebSocket, external `<script>` — all absent).
- [x] No `<all_urls>` or other broad host permissions.
- [x] User-facing description (manifest) fits inside the 132-char limit.
- [x] Bump `version` in `manifest.json` for every resubmission (Chrome
      reviewers won't re-accept the same version).
- [x] `npm run build` packages the **contents** (not the wrapping directory)
      into `console-hopper.zip`, excluding docs, `store-assets/`, `samples/`,
      and `.git/`.
- [ ] Test the built `dist/` by loading it unpacked in a clean profile —
      re-verify end-to-end for 1.3.0 (mock-SAML → role picker; account tags,
      the pop-out search + scoped queries, save/restore shortcuts, the
      redesigned Start View, filters, side-menu and dark theme; footer reads
      v1.3.0).
- [ ] Screenshots in `store-assets/` don't yet show 1.3.0's tags or pop-out
      search — refresh a couple (1280×800) to showcase them before publishing.
- [ ] Promo tiles (440×280 and 1400×560) still show pre-1.2 UI — optional;
      regenerate or drop before publishing if you want them current.
- [ ] Confirm the 128×128 icon renders cleanly (the current one is
      upscaled from a 64×64 source — a sharper 128×128 original is
      worth providing).

---

## Build the submission zip

```bash
npm install   # first time only
npm run build
```

Bundles a minified `dist/` and produces `console-hopper.zip`, printing the file
listing + size so a broken exclude rule shows up immediately. The build
validates `manifest.json` before zipping.
