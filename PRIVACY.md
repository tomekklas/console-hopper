# Privacy Policy — Console Hopper

**Effective date:** 19 May 2026
**Last updated:** 29 September 2026

This page explains what Console Hopper (the "extension") does and does
not do with your data. The short version: **the extension does not
collect, transmit, or share any data**. Everything stays in your
browser.

## What the extension does

Console Hopper enhances the AWS Identity Federation (SAML) sign-in
page and decorates AWS console tabs in your browser. It runs only on:

- `https://signin.aws.amazon.com/saml` (and its regional subdomains)
- `https://console.aws.amazon.com/*` (and its regional subdomains)

It does not run on any other web page.

## Data the extension stores locally

Console Hopper stores the following information **only on your own
device**, using Chrome's `chrome.storage.local` API:

- Theme preference (light / dark / auto)
- Compact-mode toggle
- Favourite role ARNs (the AWS role identifiers you starred)
- Recently signed-in role ARNs (an auto-managed list, length you set)
- A user-defined ordering of role rows (drag-and-drop result)
- Your custom search shortcuts, organisations, environments, account
  types, role-name filters, and AWS service deep-links
- A per-role memory of the last service dropdown you picked
- Your AWS region preference, optional homepage link, and which
  role-name keywords / account-type IDs should trigger the
  sensitive-sign-in confirmation modal
- A one-time flag indicating you've dismissed the first-run welcome
  screen
- An optional "tab group tag" you typed into the toolbar for the
  current session
- Your tags: free-text labels you attach to an AWS account id + role
  name
- The order you dragged each filter row's chips into
- Your Launch Sets: a name, a tab-group name, whether you archived it,
  and for each tab the role ARN, AWS region and console page (service
  path) to open

When you click **Save open tabs**, the extension reads the addresses
and tab-group names of your open AWS console tabs (and no other tabs)
to show them to you; only the tabs you keep are saved, as above. When
you sign a console session out from the sessions panel, the extension
closes that session's AWS console tabs, matched by the session id in
their address.

None of this data is transmitted to the extension's authors, to
Google, to Amazon, or to any other third party. It is readable only
by the extension itself, in your own browser profile, and is cleared
when you uninstall the extension.

## Authentication information (Launch Sets only)

Since version 1.7.0 the extension handles one piece of authentication
information, and only when you use **Launch Sets**. It is declared as
"Authentication information" in the Chrome Web Store listing.

- **What:** the SAML response your identity provider placed on the AWS
  sign-in page (`signin.aws.amazon.com/saml`). It is the proof AWS
  accepts to sign you into the role you pick. The extension never sees
  your password, MFA codes or AWS access keys.
- **When:** only when you click **Open** on a Launch Set. Browsing the
  role picker, signing in with a single Sign In button, and every other
  feature leave it untouched.
- **Why:** Chrome lets one click open one new window, so the sign-in
  page can't post itself into several new tabs. To open every tab of a
  set at once, each new tab needs its own copy of the response to post
  to AWS.
- **How it's handled:** the response is passed to the extension's
  background worker and held in Chrome's in-memory
  `chrome.storage.session` store — one single-use copy per tab, readable
  only by the extension (not by web pages or other extensions). Each new
  tab takes its copy once and posts it to AWS's sign-in endpoint,
  exactly as the page's own Sign In button would. A copy nobody takes
  is discarded after five minutes, which is also as long as AWS accepts
  it.
- **Where it goes:** only to `https://signin.aws.amazon.com/saml` (or
  your region's AWS sign-in endpoint). It is never written to disk,
  never put in a URL, never logged, and never sent to the extension's
  authors, to Google, or to anyone else.

## Data the extension does NOT collect

The extension does **not**:

- Send any HTTP requests, WebSocket messages, or telemetry to servers
  controlled by the authors, or to any third party. The extension talks
  only to AWS itself, and only for two things: reading the list of AWS
  console sessions open in your browser (so it can show you how many of
  AWS's five slots are in use), and signing a session out when you click
  the ✕ next to it. Both are ordinary AWS endpoints, sent from your
  browser with your existing AWS cookies, exactly as the AWS console
  itself would
- Use cookies, fingerprinting, analytics, error reporting, or any
  third-party SDK
- Read or transmit your AWS credentials, SAML assertions, session
  tokens, or any authentication material — with the one exception
  described under "Authentication information (Launch Sets only)"
  above, where the sign-in page's own SAML response is posted to AWS's
  sign-in endpoint and nowhere else. (The optional **Clear AWS
  Sessions** button deletes AWS session cookies on your device when you
  click it — to sign you out — but never reads or transmits them. The
  session list described above returns only metadata — account id, role
  name, when the session started and when it expires — never credentials
  or cookie contents.)
- Read content from pages outside the AWS sign-in and AWS console
  domains listed above
- Collect personally identifiable information, health, financial,
  payment, location, communications, web history, user activity,
  or website content

## Permissions and why they're used

| Permission | Why it's requested |
|---|---|
| `storage` | To persist your settings (themes, favourites, filters …) locally in `chrome.storage.local`. |
| `tabs` | To place a newly opened AWS console tab into the correct Chrome tab group; to open a Launch Set's tabs next to the role picker; to list your open AWS console tabs when you click **Save open tabs**; and to close a console session's tabs when you sign that session out. Only AWS console tab addresses are read, and never transmitted. |
| `tabGroups` | To create and update Chrome tab groups that visually cluster AWS console tabs by account, role, or organisation. |
| `cookies` | To delete AWS authentication cookies when you click **Clear AWS Sessions**, signing you out of all AWS consoles at once. The extension only deletes these cookies — it never reads their contents or sends them anywhere. |
| Host access to `*.aws.amazon.com` (sign-in + console) | To inject the enhanced UI on the SAML sign-in page, set the per-tab favicon/title on console pages, clear AWS session cookies, and call AWS's own session endpoints on `signin.aws.amazon.com` — one to list the console sessions open in your browser, one to sign a single session out when you ask. Requests go only to AWS, from your browser, with the cookies you already have. |

## Sharing

The extension does not share your data because it does not have any of
your data to share.

If you choose to use the **Export Settings** feature, the extension
will format your locally-stored configuration as a JSON string in a
text box for you to copy. Whether you share that string with anyone
is entirely your own decision. The extension itself does not transmit
the exported JSON.

## Children's privacy

Console Hopper is a workplace developer-tooling extension and is not
directed at children under 13. It does not knowingly collect data
from anyone, including children.

## Changes to this policy

If this policy changes, the updated version will be published in the
project's GitHub repository
(https://github.com/tomekklas/console-hopper) and the "Last updated"
date at the top of this document will change. Material changes will
also be noted in the extension's Chrome Web Store listing.

## Contact

Questions or concerns about this policy, or anything the extension
does or does not do, can be raised at:

- GitHub issues:
  https://github.com/tomekklas/console-hopper/issues
