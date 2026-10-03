# Changelog

All notable changes to Console Hopper are listed here. Dates are in
`YYYY-MM-DD`. Versions follow the value in `manifest.json`.

## 1.8.0 — 2026-10-03

### Added

- **A sign-in or jump at five of five makes room first.** Signing in to a
  role that has no live session, or jumping to an account, when AWS has no
  session free used to open AWS's "Session limit reached" page in the new
  tab. Now the picker shows the Open-set dialog's list of your sessions
  instead, each with its own **Sign out**, and **Sign in** / **Jump** stays
  off until there's room. A jump whose hub isn't signed in needs two
  sessions (the hub's and the account's); a live hub it goes through is
  kept, with no Sign out. With room to spare nothing changes: the check
  uses the sessions chip's count, so an ordinary sign-in doesn't wait.
- **The sessions chip says when AWS multi-session support is off.** AWS
  leaves it off until you turn it on, and while it's off there are no
  sessions to list, so the chip used to stay hidden with no reason given.
  Now, when AWS lists nothing and your console tabs are on plain addresses
  (no account number in front), it reads **Multi-session is off**; click
  it for what that means and how to turn it on (your account name at the
  top right of any console tab → *Turn on multi-session support*).
  **Don't show again** hides it; the normal counter still appears once
  AWS lists sessions.
- README and store listing say that the session features (the counter,
  **Open** on a signed-in role, making room for a set) need AWS
  multi-session support.

### Changed

- **Opening a set that won't fit in AWS's five sessions.** The confirmation
  lists your live sessions, each with its own **Sign out** button, plus
  **Sign out all**. A session with open tabs asks once more ("Close 2
  tabs?"). A row that makes enough room on its own is marked **Frees
  enough** (unless every row would), and a session the set itself opens in has no Sign out (signing it
  out frees nothing). **Open** stays disabled until there's room for the
  whole set, and says how many sessions to sign out first. A set with more roles than AWS
  allows sessions says so and asks you to split it. This replaces *Manage
  sessions…* and *Open anyway*, which opened tabs that couldn't sign in.
- **Jumps count as one session pair.** A jump signs in to its hub and
  switches from there, so the hub and the sessions jumped through it are one
  row in that list and sign out together. The pair is recognised from your
  Jump Profiles.
- The session count behind all this is read fresh from AWS when you click
  **Open**, not taken from the sessions chip, which could lag behind.
- **A role you're already signed in to opens, rather than signing in
  again.** Its button reads **Open** instead of Sign In (or Jump), and opens
  that live session — here, or in a new tab — instead of starting a new
  sign-in, which signed its open tabs out.
- **The sessions panel shows a jump as one row** (hub → destination) and
  signs it out as one. **Sign out idle** no longer counts a jump's hub as
  idle: it has no tab of its own, but ending it would end the jump you're
  working in. A session of a role you can sign in to directly is never taken
  for a jump, even when a Jump Profile switches into a role of the same name. A row's ✕ now asks twice only when the session has tabs open,
  the same as in the Open-set dialog.
- The set preview bar says when a set needs more free sessions than you
  have, and the Open-set dialog names the region of any tab that picks one.
- **A set whose roles are all signed in opens from any role picker page**,
  however long it has been open: nothing signs in, so AWS's five-minute limit
  on the sign-in page doesn't apply. A set that does sign in still asks for
  a fresh page.
- ⌘-click (or middle-click) on the Jump popover's **Jump →** and on its
  recent jumps opens a new tab, like the listing's rows.
- **Long account and role names fit.** The role picker used to stop at
  1100px wide, leaving each name column about 190px however big the window,
  so names sharing a prefix all looked the same. The page now grows to fit
  your longest account and role names, up to 90% of the window, and never
  below 1100px; the two name columns share the room in proportion to what
  they need. **General Settings → Maximum page width** changes the cap
  (a share of the window, like `90%`, or pixels, like `1600px`).
- A name that still doesn't fit is shortened in the middle, not at the end:
  its last word or two stay visible ("cutspace-landi… payments-prod"), so
  names that share a prefix stay tellable apart.
- A name that's still cut off shows in full as soon as you hover it, with the
  account ID and AWS's own name for it, and a pointer to *Account Names* to
  give it a shorter one.
- **Tab groups of ended sessions turn grey.** When a session ends on AWS's
  side (a jumped role lasts at most an hour), its tabs stay open but can't
  do anything. A tab group Console Hopper made, holding only such tabs, now
  turns grey and is titled "Ended · …" (after two checks a few seconds apart,
  so a tab still signing in isn't caught), and the tab strip matches the
  session count. Groups you made yourself are left alone, nothing is closed,
  and a signed-in tab joining the group restores it. Grey is kept for this: a
  new group that would have been grey gets another colour.

### Fixed

- **Opening a set no longer signs out sessions you already have.** A role
  in the set that's already signed in opens its tabs in that session,
  instead of signing in again (AWS replaces the session and signs its open
  tabs out). It also costs no new session. A session with under ten
  minutes left is still signed in afresh.
- **A jump no longer signs out its hub's tabs.** When the hub is already
  signed in, the jump switches role from that session instead of signing in
  to the hub again; when the destination is already signed in, it just
  opens it.
- **⌘-click on a ⤳ jump row opens a new tab**, like it does on a direct role
  (middle-click and the *Sign-in: New tab* setting too). Jumps used to take
  over the role picker's tab whatever you clicked with. The jumped tab still
  lands in its tab group.
- Dark theme: the Open-set dialog's role list was unreadable, and dialog
  buttons such as Cancel stayed white.
- Edit set no longer offers **+ Add tab** for a role that isn't in today's
  role list, the sessions panel's *Started* column no longer cuts off "1h 30m
  ago", and the Sign In / Jump / Open buttons share one width so the rows'
  columns line up.
- **A role's extra tabs in a set open in the session its first tab signed
  in to**, with no sign-in of their own. They used to post a second sign-in,
  which AWS turns away once all five sessions are in use, so a set that
  filled the last slots lost those tabs. If the first tab never reaches the
  console, the rest are dropped and the picker says so.
- Picking a landing service on a row shows its "… selected — click Sign
  In" note again; the lookup behind it used a selector the picker's DOM
  helper doesn't support, so it failed quietly.
- Toasts that appear together stack instead of overlapping.
- **Keep console tabs in their region** works in the first five minutes
  after a sign-in too. Every sign-in and Launch Set leaves a hand-off for
  the tab label, and the region lock mistook it for a jump steering its own
  landing, so it stood aside: a tab that went to IAM and back in that time
  stayed in the region AWS picked. Only a jump's hand-off (which carries
  the region it asked for) holds the lock off now.
- A jump destination saved from the Jump popover ("Save as a named
  destination") shows as a ⤳ row straight away, not after the next reload.
- A console tab's title keeps the account prefix once. Billing and Cost
  Management builds its title from the previous one, so the prefix used to
  show up twice ("[123…] Billing … | [123…] Billing …").
- **Account Names** and **Tags** say which lines they can't read (say,
  `123456789012=Name`, or a full role ARN) and save nothing until they're
  fixed or removed. Those lines used to vanish on Save, under a "saved"
  toast.
- Example tags in the Tags dialog and the help no longer use vendor names.
- Help & About: the Active AWS sessions section describes the panel as it
  is (Sign out idle / all, Open on a signed-in role, a jump as one row)
  and the multi-session requirement, and no longer mentions a "you"
  marker the panel doesn't have.

## 1.7.0 — 2026-09-29

### Added

- **Launch Sets.** Save the console tabs a ticket needs under a name such as
  the ticket id, then open them all in one click. Each tab in a set has its
  own role, service and region, and one role can have several tabs — EC2
  and IAM side by side. The tabs open next to the role picker, without
  taking focus, and are grouped by the **Tabs** setting like any sign-in
  (by role, by org or off); in Custom tag mode they gather in one group
  named after the set.
  - A **Sets** column sits in the filter panel, beside the search column:
    each set with its tab count and a small **↗** button to open it, in
    your order. Clicking a set's name shows only its roles in the listing, each
    noting what it opens, under a bar with **Edit** and **Open all**. The
    column never makes the panel taller: it shows as many sets as fit
    beside the filter rows, and **All sets** opens the rest.
  - **Launch Sets** in the side menu lists every set to reorder (drag), show,
    edit, archive, delete or open, and saves new ones. New sets start at
    the top. **Archive** keeps a finished ticket's set without it taking a
    place in the Sets column; the window's *Archived* section restores or
    deletes it. Up to 200 sets, archived ones included.
  - **↗ save as set** in the search card saves the roles your search shows,
    each with the service and region its row is set to. **+ New set** offers
    the same (*Save current view*) and **Save open tabs**, which records
    your open console tabs — role, region and exact page — so the same
    layout comes back next time.
  - **Edit** lists a set's tabs one per line with *Land on service* and
    *Land in region*, **+ Add tab for this role**, **+ Add a role** and a
    two-click **Delete set**.
  - With nothing to flag, **Open** takes one click. A set with sensitive
    roles, roles missing from today's list, or more sessions than AWS's five
    gets one confirmation for the whole set; tabs of one role count as one
    session, and **Manage sessions…** opens the sessions panel.
  - Sets are included in Export / Import settings.

### Changed

- Signing a session out in the sessions panel (✕, or **Sign out all
  sessions**) now also closes that session's console tabs, which would
  only show AWS's signed-out page otherwise. Tabs are matched by the
  session in their address, so other sessions' tabs stay open.
- **Sign out idle** in the sessions panel, beside *Sign out all sessions*,
  signs out every session with no console tab open (two clicks, like the
  others), freeing slots without touching the sessions you're working in.
- **Filter rows stay on one line.** Chips that don't fit fold into a **+N**
  chip (showing *· N on* when a selected one is inside), so the panel no
  longer grows as tags pile up and the Sets column lines up one set per
  row. **+N** opens just the chips that didn't fit. Drag chips along a row
  to reorder it, drag one out of **+N** onto the row to keep it in view, or
  a row chip onto **+N** to tuck it away — like the bookmarks bar. The order
  is kept per row, separately from the Organizations/Environments/...
  lists; new tags start at the front.
- **Tags belong to an account + role**, not the whole account: tagging your
  Admin role no longer tags every other role of that account. Existing
  account tags are copied onto each role of that account the picker lists,
  so nothing is lost — remove them from the roles you don't want. The bulk
  editor (now **Tags** in the side menu) takes `123456789012/Admin: tags`
  lines; a bare `123456789012: tags` line still tags every role of the
  account.
- A Launch Set's extra tabs for the same role open once that role's first
  tab has reached the console, so they share its AWS session instead of
  each starting one of the five.
- Opening a Launch Set from a role picker that has been open more than
  about five minutes now says to sign in again, instead of opening tabs
  that AWS would reject ("Token must be redeemed within 5 minutes").
- If Console Hopper is installed twice (say the Web Store copy and an
  unpacked build), the second copy stands aside and a banner says so,
  instead of both decorating every role row.
- Tabs opened together now join one tab group instead of each creating its
  own: grouping runs one tab at a time.
- Several tabs of the same account landing at once are all decorated; the
  per-account hand-off used to be consumed by the first one.

## 1.6.0 — 2026-09-07

### Added

- **Console tabs stay in their region.** AWS serves its global consoles (IAM,
  Billing, Organizations, Route 53, CloudFront, Health, Trusted Advisor,
  Artifact, Cost Management, Support) *without* a region — visiting one drops
  the region from the console host, so the next regional service you open is
  placed by AWS in your identity's own default Region rather than the one you
  were working in. Open IAM from a Frankfurt tab, come back to EC2, and you
  land in Stockholm. Console Hopper now remembers what region each console tab
  is working in and sends the tab back when that happens. Changing region from
  AWS's own region picker still works exactly as before: the tab follows you
  and holds the new region. New **Keep console tabs in their region** tick in
  General Settings, on by default.

### Fixed

- **"Remember the region I pick per role" now survives a reload.** The toggle
  updated the running page but was never written to storage, so it silently
  returned to *on* every time the role picker loaded.

### Changed

- The service worker is now an ES module and is bundled by `npm run build`
  (it shares `src/shared/region-lock.js` with the unit tests) instead of being
  minified in place.

## 1.5.0 — 2026-09-04

### Added

- **Jump destinations live in the role listing.** Save an account you chain
  into and it appears as a **⤳ row** among your normal roles — searchable,
  taggable, favouritable and drag-orderable like any other row, with its own
  landing **Service** and **Region** dropdowns and a **Jump** button where a
  direct role has Sign In. A dashed environment stripe and a small
  "via *profile* hub · max 1 h" line keep the mechanism visible, and a
  destination whose hub role isn't in today's role list greys out with the
  reason on the row instead of failing at click time.
- **Source filter and `is:jump` search.** Once at least one destination is
  saved, a **Source** filter row (Direct roles / ⤳ Jumps) appears above the
  listing, and `is:jump` / `source:direct` join the search syntax.
- **Jump Destinations** in the side menu (Configure) — the one place
  destinations are added, edited and removed, laid out as **one grid with a
  labelled column for everything**: name, account, profile, landing service,
  landing region, session label. Names and labels edit in place (they read as
  text until you point at them) and save when you click away; service and
  region save on change; **the last line of the grid is the add row**, so
  adding looks like every other line; ✕ keeps the usual
  click-again-to-confirm; and **Import…** takes bulk paste — one per line,
  `Name | account | profile | region | service | label`, or start the line
  with the bare 12-digit id to skip the name (the box is pre-filled with the
  current list in the same format). Account and profile are a destination's
  identity and stay fixed once added; adding the same pair again updates the
  existing entry and says so.
- **"Save as a named destination"** tick in the ⤳ Jump popover — jump
  somewhere once and keep it as a listing row, with the label and region you
  picked, no separate setup step.
- **Jumps can land on a service.** A destination row's Service dropdown picks
  where the jump lands — after the switch-role settles, the same single
  navigation that already corrects the landing region now deep-links into the
  chosen service console too.
- **Sensitive-sign-in confirmation now covers jumps.** A jump whose
  destination account or assumed role matches your confirmation triggers asks
  first, exactly like a direct sign-in; previously jumps skipped the check.
- **"Sign out all sessions"** in the Active AWS sessions panel — outlined
  red, needs a second click to confirm, then signs out every session using the
  same per-session logout the row ✕ uses. (It is not the cookie-clearing
  *Clear AWS Sessions* — console settings and the multi-session opt-in are
  untouched.)

### Changed

- **The ⤳ Jump popover slimmed down to quick-and-dirty.** It keeps the form,
  the *Save as a named destination* tick and a plain recent-jumps list (click
  to re-jump, ✕ to forget). The ★ pin-and-reorder list it used to carry has
  graduated: existing pinned jumps are migrated into **Jump Destinations**
  automatically on first load, where they pick up names, a landing
  service/region, and a ⤳ row in the listing.

### Fixed

- **The sessions panel could hand your click to a Sign In button.** The
  panel's ✕ column sits directly above the listing's Sign In buttons, and
  signing out the last session hid the whole panel — so a click aimed at the
  next ✕ landed on the listing underneath and signed into a different
  account. The panel now stays open at zero sessions ("0 of 5", with an
  explicit Close), stays visible through a transient refresh failure while
  open, and sits on a scrim that swallows any click outside it, so a stray
  click can no longer reach the page below.

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
