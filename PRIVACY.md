# Privacy Policy — Console Hopper

**Effective date:** 19 May 2026
**Last updated:** 19 May 2026

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

None of this data is transmitted to the extension's authors, to
Google, to Amazon, or to any other third party. It is readable only
by the extension itself, in your own browser profile, and is cleared
when you uninstall the extension.

## Data the extension does NOT collect

The extension does **not**:

- Send any HTTP requests, WebSocket messages, or telemetry to any
  server controlled by the authors or by anyone else
- Use cookies, fingerprinting, analytics, error reporting, or any
  third-party SDK
- Read, transmit, or modify your AWS credentials, SAML assertions,
  session tokens, or any authentication material
- Read content from pages outside the AWS sign-in and AWS console
  domains listed above
- Collect personally identifiable information, health, financial,
  payment, location, communications, web history, user activity,
  or website content

## Permissions and why they're used

| Permission | Why it's requested |
|---|---|
| `storage` | To persist your settings (themes, favourites, filters …) locally in `chrome.storage.local`. |
| `tabs` | To read the calling tab's id and window in the service worker, so a newly opened AWS console tab can be placed into the correct Chrome tab group. |
| `tabGroups` | To create and update Chrome tab groups that visually cluster AWS console tabs by account, role, or organisation. |
| Host access to AWS SAML / console URLs | To inject the enhanced UI on the SAML sign-in page and to set the per-tab favicon and title on AWS console pages. |

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
