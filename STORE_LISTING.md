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
Open a ticket's AWS consoles in one click: Launch Sets, role-picker search + tags, jump to any account, env-coloured tabs.
```

*(122 chars. The 1.6.0 summary is still valid if you'd rather not
change it: "Hop between AWS consoles fast: role-picker search + tags, jump to
any account, env-coloured tabs, consoles that keep their region.")*

### Detailed description
*(max 16,000 characters; plain text with basic line breaks)*

```
Console Hopper turns the AWS SAML role-picker into a fast, filterable
launcher and makes a tab strip full of AWS consoles instantly
readable.

If you have access to dozens — or hundreds — of AWS accounts via SAML
SSO, the default role list is a long, unsorted scroll. Console Hopper
gives every row a star, a service deep-link, and a one-click sign-in,
and gives every open console tab a colour-coded favicon plus an
account name in the title.

NEW IN 1.8.0

• Already signed in? It opens instead — a role you're already signed
in to shows Open instead of Sign In, and opens a tab in that session.
Signing in again would replace the session and sign its open tabs out.
Launch Sets and jumps reuse live sessions too: a jump never restarts
the hub session your other jumps depend on, and a role's extra tabs in
a set open in the session its first tab signed in to.
• Make room for a set — when a Launch Set needs more of AWS's five
console sessions than are free, its confirmation lists your sessions
with a Sign out button each ("Frees enough" marks one that makes room
on its own; a hub and the sessions jumped through it are one row), and
Open stays off until the whole set fits. A set whose roles are all
signed in opens from any role picker page, however long it has been
open.
• Room before you sign in — signing in to a role, or jumping to an
account, when all five AWS sessions are in use now lists your sessions
to sign out first (a hub a jump goes through is kept), instead of
AWS's "Session limit reached" page in the new tab.
• Long names fit — the role picker grows to fit your longest account
and role names, up to 90% of the window (General Settings → Maximum
page width). A name that still doesn't fit is shortened in the middle,
keeping the end that tells similar names apart, and shows in full when
you hover it.
• Ended sessions — when an AWS session ends while its tabs are still
open, the tab group Console Hopper made for it turns grey and reads
"Ended · …", so the tab strip matches what's really signed in.
• Multi-session off? It says so — Console Hopper's session features
(the session counter, Open on a role you're already signed in to,
making room for a Launch Set) need AWS multi-session support, which
AWS leaves off until you turn it on. When it's off, the counter reads
"Multi-session is off" and shows how to turn it on, instead of showing
nothing.
• Jumps follow the new-tab rule — ⌘/Ctrl-click or middle-click on a
jump opens it in a new tab, like any role.
• The sessions panel shows a jump and its hub as one row and signs
them out together; "Sign out idle" no longer counts a hub as idle
while its jumps are in use.
• Fixes — console tabs stay in their region in the first minutes after
a sign-in too; Account Names and Tags point out lines they can't read
instead of dropping them; a tab title keeps its account prefix once;
toasts stack instead of overlapping.

NEW IN 1.7.0

• Launch Sets — open every console a ticket needs in one click. Save
the console tabs a piece of work needs under a name (usually the
ticket id) — each tab with its own role, landing service and region,
several tabs per role if you like — and open them all at once, next to
the role picker. Save one from a search or filter ("Save current
view"), or record the console tabs you already have open ("Save open
tabs", exact pages included). A Sets column beside the filters holds
them; the Launch Sets panel in the side menu reorders (drag), edits,
archives and restores them. One confirmation covers the whole set when
it includes sensitive roles or would go past AWS's five-session limit.
• Tags belong to an account + role, not the whole account — tag the
one role a ticket needs and only that row carries it. Existing account
tags are copied onto each of that account's roles, so nothing is lost.
• Filter rows stay on one line — chips that don't fit fold into a +N
chip, so the panel no longer grows as tags pile up. Drag chips along a
row to reorder it, drag one out of +N to keep it in view, or onto +N
to tuck it away.
• Sessions panel: signing a session out also closes its console tabs,
and "Sign out idle" signs out every session with no console tab open.
• Fixed: if Console Hopper is installed twice (say, a store copy and a
developer copy), the second copy stands aside instead of doubling
every row.

WHAT YOU GET

• Filter and search the role list
Filter by organisation, environment (prod/test/dev), account type
(Management / Security / Logging / …), role-name keyword (Admin /
ReadOnly / PowerUser / …) or your own tags. Each filter row stays on
one line — extra chips fold into a +N chip — and you order the chips
by dragging. The search box is separator-insensitive (type "test 123"
to find "test123") and supports scoped terms — tag:, role:, name:,
account:, env:, type:, org: — combined with a space (and), a comma
(or) or a leading - (exclude), with "quotes" for an exact phrase. It
pops out into a roomy card with click-to-insert suggestions and a live
match count. Every filter group is editable from the side menu.

• Tag roles
Give an account + role your own short labels — prod-network, pci, a
ticket number — and organise by them. A tag belongs to that one role,
so tagging your admin role doesn't tag the account's other roles. Add
or remove tags inline from a chip on each row (with autocomplete), or
edit in bulk from the side menu. Tags get their own filter row and are
searchable with tag:.

• Launch Sets
Save the console tabs a ticket needs and open them all in one click.
Each tab keeps its own role, landing service and region; one role can
have several tabs. Save from the current search or filters, or from
the console tabs you have open. The tabs open next to the role picker
and are grouped the way your tab-group setting says; roles you're
already signed in to open in their session, and if a set needs more
sessions than are free you choose which to sign out. Reorder, edit,
archive and restore sets from the Launch Sets panel.

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
For accounts you can only reach by assuming a role from a hub —
including accounts that aren't in your role list at all. Configure
each org once under “Jump Profiles” (org name, hub account id, role to
assume, and optionally the region to land in) and a “Jump to account”
button appears in the search column. Enter the destination account id,
pick a region, add an optional session label — Console Hopper signs
into the hub (or uses your hub session if it's already open) and opens
AWS's Switch Role pre-filled, one click and you're in. It lands you in
the region you chose rather than whichever one AWS picks for that
account, and when several console sessions are open it selects the
right one for you instead of leaving you to guess. The new tab is
titled with your session label, and recent jumps are one click away in
the popover. Save the destinations you use often — via "Jump
Destinations" in the side menu, or the "Save as a named destination"
tick when you jump — and they appear as ⤳ rows in the main list
itself, with a dashed environment stripe, the hub they go through, and
their own service and region picks.

• Favorites and Recent
Star roles you use often. Recently signed-in roles are tracked
automatically (configurable limit).

• Deep-link into a service
Each role row has a service dropdown. Pick one before Sign In and you
land straight in that service's own console for that role, instead of
the console home page and another two clicks. A handful of common
destinations are set up by default, and you can add, rename or remove
any of them from the side menu.

• Per-sign-in region
Each role row also has a region dropdown — choose which AWS region a
sign-in lands in. It defaults to your region and remembers your last
pick per role; turn off “Remember the region I pick per role” in
General Settings and every row always opens on your default instead.
Edit the offered regions via “Regions”.

• Console tabs stay in their region
Some AWS consoles are account-wide and carry no region of their own,
so visiting one drops the region from the console address — and the
next regional console you open lands wherever your AWS profile's
default Region points rather than where you were working. Console
Hopper remembers what region each console tab is in and sends the tab
back, while leaving alone any region you picked yourself from AWS's
own region menu.

• Room for long names
The picker grows to fit your longest account and role names, up to a
share of the window you choose. A name that still doesn't fit is
shortened in the middle and shown in full when you hover it.

• Copy account ID
Click the account-id button on any row to copy the 12-digit id.

• Colour-coded console tabs
Every AWS console tab opened through the plugin gets a coloured
favicon (env colour) and an account-name title prefix, so ten open
tabs are still distinguishable at a glance.

• Tab groups — visual containers
Console Hopper drops each new console tab into a Chrome tab group: by
role, by organisation, or by a per-ticket override tag. Same role
always gets the same colour, and a group whose session has ended turns
grey. Note: tab groups are a Chrome visual feature only — they don't
isolate cookies. For real session isolation, combine with Chrome
profiles.

• Sensitive-sign-in confirmation
Configure which role-name keywords (default: "admin") and which
account types are sensitive. Signing into a matching role/account pops
a "are you sure?" modal so you don't accidentally land in production.

• Active AWS sessions
AWS allows five concurrent console sessions per browser profile, and
normally only tells you once you have hit the limit. A counter at the
foot of the right column turns amber with one slot left and red when
full. Open it to see every session — account, role, region, tab group,
when it started, how long it has left and how many tabs it still has
open — and sign any one of them out to free a slot (its console tabs
close with it), sign out every session that has no tab open, or sign
out all of them. A jump and the hub it goes through show as one row. A
sign-in or jump that needs a session when all five are in use shows
the same list first. This needs AWS multi-session support, which is
off until you turn it on (in any AWS console tab, your account name at
the top right → Turn on multi-session support); while it's off, the
counter says so. Session metadata only; cookie contents are never
read.

• Clear AWS sessions
One click signs you out of your AWS console sessions by clearing
aws.amazon.com authentication cookies (your console favourites and
settings are kept). Sessions held elsewhere — an IAM Identity Center
portal on awsapps.com, for instance — are outside the extension's
reach and stay signed in.

• New-tab sign-in
⌘/Ctrl-click, middle-click or ⌘+Enter opens the console in a new tab,
for jumps too. A "Sign-in" side-menu option sets the default; the
modifier inverts it.

• Drag-to-reorder
Hold and drag any role row to set your preferred order. "Reset Order"
in the side menu restores AWS's default.

• Light / dark / auto theme, compact mode, keyboard shortcuts
/ or Ctrl/Cmd+K (or a tap of Alt) focuses search, ↑/↓ moves the
selection, Alt+arrows walk the search suggestions, Enter signs in to
the selected role, Esc closes modals / clears filters.

• Export / import settings as JSON
Share your configured orgs, envs, account types, role names, services,
tags, favorites and shortcuts with a teammate.

• Org-agnostic
Ships with generic placeholders. You rename Org A / Org B / Org C and
fill the patterns to match your real organisations. No hard-coded
vendor names anywhere.

PRIVACY

Console Hopper runs entirely in your browser. It does not contact any
server of ours, send telemetry, or collect personal data. It talks
only to AWS: to read which console sessions you have open, to sign one
out when you ask, and — when you open a Launch Set — to post the
sign-in page's own SAML response to AWS's sign-in endpoint once per
tab that signs in (a role you're already signed in to opens in its
session without it), exactly as the page's Sign In button does. That
response is the only authentication information Console Hopper ever
handles: it is held in memory, one single-use copy per tab, for at
most five minutes, and never goes anywhere but AWS's own sign-in
endpoint. Your password, MFA codes and AWS access keys are never seen,
and cookie contents are never read. All settings (favorites, custom
org / env / type / role labels, recent signins, preferences) are
stored in chrome.storage.local — they never leave your device unless
you click "Export Settings" yourself.

PERMISSIONS — WHY

• storage — persist your preferences and configuration locally
• tabs — group new console tabs, open a Launch Set's tabs next to the
role picker, open a tab in a session you're already signed in to, list
your open console tabs for "Save open tabs", notice a tab group whose
session has ended, and close a signed-out session's tabs
• tabGroups — create and colour Chrome tab groups for each
account+role combination, and grey out one whose session has ended
• host access — limited to AWS SAML sign-in pages and AWS console
pages, so the plugin can enhance the role-picker, decorate console
tabs, and ask AWS which console sessions you have open. No other sites
are touched.

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
| Screenshot 1 | 1280 × 800 | `store-assets/screenshot-1-main.png` | Role picker — one-line filter rows with +N, the Sets column beside them |
| Screenshot 2 | 1280 × 800 | `store-assets/screenshot-2-sets.png` | Launch Sets panel — sets in order, archive, open |
| Screenshot 3 | 1280 × 800 | `store-assets/screenshot-3-edit.png` | Edit a set — tabs per role with landing service and region |
| Screenshot 4 | 1280 × 800 | `store-assets/screenshot-4-sessions.png` | Active AWS sessions — sign out one, the idle ones, or all |
| Screenshot 5 | 1280 × 800 | `store-assets/screenshot-5-dark.png` | Dark theme — a filter row's +N pop-out |
| Small promo tile (optional) | 440 × 280 PNG | ✅ `store-assets/promo-small-440x280.png` | Icon + wordmark over the filter rows |
| Marquee promo tile (optional) | 1400 × 560 PNG | ✅ `store-assets/promo-marquee-1400x560.png` | Wordmark + tagline beside the role picker |

Chrome Web Store requires at least **one** screenshot; five is the max.
We're shipping the full five (1280 × 800, real extension) — refreshed for
1.4.0 to lead with the two new headline features, the sessions panel and
the Jump region row. The account ids, account names and role names in
them are substituted demo values, so no real AWS estate detail is
published; everything else is the live UI. Both promo tiles were
regenerated for 1.4.0 from that same staged UI, so every asset in the
listing now shows the shipping build.

---

## Privacy practices

### Single purpose description
*(required, max 1000 chars)*

```
Console Hopper enhances the AWS Identity Federation sign-in page
(https://signin.aws.amazon.com/saml) with filters, search, role tags,
favorites, deep-link service shortcuts, environment colour-coding,
keyboard navigation and tab grouping, so users with many AWS accounts
via SAML SSO reach the right role faster. Launch Sets save the console
tabs a task needs (role, service, region per tab) and open them
together from the same page. Saved jump destinations, reached by role-
chaining through a hub, sign in from the same list. It labels AWS
console tabs with a coloured favicon and account name so many open
consoles stay tellable apart, and keeps each console tab in its AWS
Region. A panel shows how many of AWS's five console sessions are in
use and signs one, the idle ones, or all out (closing their tabs).
"Clear AWS Sessions" deletes AWS sign-in cookies (never read or
transmitted).
```

### Data usage disclosure
*(answer the form's Yes/No questions)*

| Question | Answer |
|---|---|
| Personally identifiable information | **No** |
| Health information | **No** |
| Financial and payment information | **No** |
| Authentication information | **Yes** (since 1.7.0: opening a Launch Set hands the page's SAML response to AWS's sign-in endpoint, held in memory ≤ 5 min) |
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
filter definitions, favorites, recent sign-ins, role tags, saved jump
destinations, Launch Sets (named lists of console tabs to open
together: role, service and region per tab), the order of filter
chips, the service deep-link list, theme, page-width and keyboard
preferences in chrome.storage.local so they survive across browser
sessions. chrome.storage.session (in memory, discarded when the
browser closes) holds short-lived things: which AWS Region each
console tab is working in, so a tab returning from an account-wide
console can be sent back to its Region; which tab groups the extension
made, and the original name and colour of one it marked as ended; and,
while a Launch Set opens, one single-use hand-off per signing-in tab
of the sign-in page's own SAML response, deleted when that tab takes
it or after five minutes at most, and posted only to AWS's sign-in
endpoint.
```

### `tabs`
```
Places each new AWS console tab into the right Chrome tab group; opens
a Launch Set's tabs next to the role picker, and opens a console tab
in a session the user is already signed in to instead of signing in
again; lists the user's open AWS console tabs (address and tab group)
when they click "Save open tabs", so the set can reopen the same
consoles; compares open console tabs' addresses with the user's live
AWS sessions to mark a tab group whose session has ended; and closes a
console session's tabs when the user signs that session out. Tab
addresses are read only for AWS console tabs, only for these actions,
and are never transmitted.
```

### `tabGroups`
```
Creates and updates Chrome tab groups so AWS console tabs cluster
visually by account + role (or by organisation, or by a user-supplied
ticket tag — or the Launch Set's name): each account + role gets its
own colour, so many open console tabs stay visually grouped and
tellable apart. When every tab in a group the extension made belongs
to an AWS session that has ended, it turns the group grey and puts
"Ended" in front of its name, restoring both if a signed-in tab joins
the group.
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
cookie value or content. No cookies are read for any other purpose.
```

### Host permission: `https://aws.amazon.com/*`, `https://*.aws.amazon.com/*`
```
Two uses, both limited to aws.amazon.com and its subdomains — no other
sites are touched.

1. Grants the cookies API the access it needs to delete AWS
   authentication cookies for the "Clear AWS Sessions" feature.
2. Lets the service worker call two AWS endpoints on the user's behalf,
   with the user's existing AWS cookies, exactly as the AWS console
   itself does: signin.aws.amazon.com/sessions/v1/list to read how many
   of AWS's five concurrent console sessions are in use (the "Active AWS
   sessions" panel, the Launch Set confirmation, and noticing a session
   that has ended so its tab group can be marked), and
   .../sessions/{id}/v1/logout to sign a session out when the user asks
   (the button next to it in the panel or the Launch Set confirmation,
   or "Sign out idle" / "Sign out all sessions"). The list response
   contains
   only session metadata — account id, role name, start and expiry time
   — which is displayed to the user and never stored or transmitted
   anywhere else. The extension makes no other network requests, and
   none at all to servers controlled by its authors.
```

### Host permission: `https://signin.aws.amazon.com/saml`, `https://*.signin.aws.amazon.com/saml`
```
Required to inject the enhanced role-picker UI into the AWS SAML
sign-in page. Without this host permission the extension cannot
display its filters, favorites, search or service dropdowns.
```

### Host permission: `https://console.aws.amazon.com/*`, `https://*.console.aws.amazon.com/*`
```
Two uses, both confined to AWS console pages. First, to set the per-tab
favicon and tab-title prefix so the user can tell their many open AWS
console tabs apart at a glance. Second, to keep a console tab in the
AWS Region it was working in: some AWS consoles are account-wide and
are served without a Region, so returning to a regional console lands
in whatever Region that AWS profile defaults to. The extension compares
the loaded console address's Region against the one the tab was using
and, when they differ, sends the tab to the same console address in its
own Region. Page content is neither read nor transmitted.
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
- [x] Test the built `dist/` by loading it unpacked — re-verified end-to-end
      for 1.4.0 against a live AWS org (mock-SAML → role picker; filters,
      tags, pop-out search + scoped queries, shortcuts, Start View, per-row
      region + service, sign-in, tab groups, jump with region, sessions panel
      + sign-out, side menu, dark theme; footer reads v1.4.0).
- [x] Region lock verified against a live AWS console (1.6.0): a global
      console (IAM) moves the tab to the region-less host and is left
      untouched; a region picked from AWS's own menu is kept; and two tabs
      pinned to different Regions each returned to their own after an IAM
      bounce — which AWS's single per-identity default cannot produce.
- [x] 1.7.0 verified against a live AWS org (mock-SAML → role picker):
      Launch Set opened two tabs of one role into one multi-session, landed on
      the saved pages and grouped by role; Save open tabs listed them, all
      ticked; per-role tags; +N overflow, pop-out and chip drag; Launch Sets
      panel edit / archive / restore / drag; session sign-out closed exactly
      its tabs; Sign out idle signed out the tab-less session.
- [ ] Reload the final build and re-check the post-review fixes (stale
      sign-in page guard, Save-open-tabs naming, Esc on the open-set
      confirmation); footer reads v1.7.0.
- [x] Authentication information data-usage answer changed to **Yes** for
      1.7.0 (Launch Sets hand the SAML response to AWS).
- [x] 1.8.0 verified against a live AWS org (mock-SAML → role picker,
      session ids and sign-in times compared with AWS's own session list
      after every step): Open on a signed-in role reuses its session; a set
      with a live role reuses it and keeps its tabs; a role's extra tabs
      open in its session even at five of five; ⌘-click jumps open a new
      tab and land in their group; jumps through a live hub never restart
      it, and opening a set containing the hub role leaves both jumps
      alive; the "doesn't fit" confirmation (Frees enough, Open disabled,
      sign-out arm lapses) opens exactly what fits; Sign out idle spares a
      hub whose jumps are busy; an ended session's group turns grey; an
      all-live set opens from a stale role picker page.
- [x] 1.8.0 store fields: no permission changes (manifest differs only in
      version). storage / tabs / tabGroups / host justifications updated
      for the new uses (open in a live session, mark ended groups, session
      list read on tab switch); PRIVACY.md updated 2 October 2026.
- [ ] Reload the final 1.8.0 build; footer reads v1.8.0.
- [x] 1.8.0: the sessions chip reads "Multi-session is off" (with how to
      turn it on, and Don't show again) when AWS lists no sessions while
      console tabs are on plain hosts; checked on the harness in light and
      dark, through each transition (sessions appear, read fails, hidden).
      No permission changes; the tabs justification gains one clause and
      PRIVACY.md one sentence (3 October 2026).
- [x] Confirmed live: with multi-session off, sessions/v1/list answers
      with AWS's 404 page, the console tab is on the plain regional host,
      and the chip reads "Multi-session is off". The menu item is "Turn on
      multi-session support"; turning it on moves the live session onto a
      session host and the chip goes back to "1 of 5 sessions".
- [x] 1.8.0 verified live (mock-SAML, real Chrome, 2026-10-03, built as
      1.9.0 before the store-version rename); ⌘-click sign-in with
      service + region; jump through a hub that wasn't live; set at 4/5
      → dialog, two sign-outs, 4 tabs, a role's second tab in its
      session, hub and jump never restarted; Open at 5/5 (role and
      jump); a single sign-in at 5/5 → the new room dialog → one
      sign-out → signed in; region lock corrects IAM → EC2 within a
      minute of a sign-in; Cost Management title has one prefix; ended
      group greyed; Save open tabs lists real tabs; ✕ closed 3 tabs;
      Clear AWS sessions signed everything out and left multi-session
      on.
- [x] Five 1280×800 screenshots in `store-assets/`, still current for 1.8.0
      (it adds to the UI rather than changing what they show); reshot for 1.7.0
      (main with Sets column + one-line rows, Launch Sets panel, Edit set,
      sessions with Sign out idle, dark +N pop-out). Real UI, placeholder
      account data (AWS-doc-style ids, acme/globex/initech names, generic
      tags and ticket-style set names — no real vendor or service names).
- [x] Promo tiles (440×280 and 1400×560) regenerated for 1.4.0.
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
