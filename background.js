// Console Hopper — service worker for tab grouping.
//
// Listens for messages from the console-decorator content script and groups
// the sending tab by `account · role`, emulating Firefox containers via
// Chrome tab groups. Each unique pair gets a deterministic color from
// Chrome's palette so the same role always shows up the same color in your
// tab strip.

const GROUP_COLORS = [
  "grey", "blue", "red", "yellow",
  "green", "pink", "purple", "cyan", "orange",
];

function hashString(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0; // 32-bit int
  }
  return Math.abs(hash);
}

function colorFor(key) {
  return GROUP_COLORS[hashString(key) % GROUP_COLORS.length];
}

function titleFor(account, role) {
  return `${account} · ${role}`;
}

function resolveTitle(account, role, tag, mode, org) {
  // Precedence:
  //  1. tag (non-empty) → use the tag (this is the "custom" case with a tag)
  //  2. mode "off", or "custom" with an empty tag → no grouping (caller checks)
  //  3. mode "org" with an org value → use that label verbatim
  //  4. mode "role" or fallback → "<account> · <role>"
  if (tag) return tag;
  if (mode === "off" || mode === "custom") return null;
  if (mode === "org" && org) return org;
  return titleFor(account, role);
}

async function groupTab(tabId, account, role, tag, mode, org) {
  const title = resolveTitle(account, role, tag, mode, org);
  if (!title) return; // grouping disabled by mode
  const color = colorFor(title);

  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (err) {
    return; // tab might have been closed
  }

  // If already in a group with the right title, leave it alone — this also
  // means we respect the user manually moving the tab out of the group
  // (we only act on the first message per tab, see decorator side).
  if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
    try {
      const currentGroup = await chrome.tabGroups.get(tab.groupId);
      if (currentGroup && currentGroup.title === title) return;
    } catch (err) { /* group may have been removed; fall through */ }
  }

  // Find an existing group with the same title in the same window so multiple
  // tabs of the same account/role cluster together.
  let groups = [];
  try {
    groups = await chrome.tabGroups.query({ title, windowId: tab.windowId });
  } catch (err) { /* ignore */ }

  if (groups.length > 0) {
    await chrome.tabs.group({ tabIds: [tabId], groupId: groups[0].id });
    return;
  }

  // Create a fresh group, then set its title + color.
  const groupId = await chrome.tabs.group({ tabIds: [tabId] });
  try {
    await chrome.tabGroups.update(groupId, { title, color });
  } catch (err) { /* ignore */ }
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== "hop_group_tab") return;
  const tabId = sender && sender.tab && sender.tab.id;
  if (!tabId) return;
  const account = (message.account || "").trim();
  const role = (message.role || "").trim();
  const tag = (message.tag || "").trim();
  const mode = (message.mode || "role").trim();
  const org = (message.org || "").trim();
  if (!account || !role) return;
  groupTab(tabId, account, role, tag, mode, org).catch((err) =>
    console.warn("[hop] groupTab failed:", err)
  );
  // No response needed.
});

// Clear all AWS console sessions by deleting AWS auth cookies. This touches
// cookies ONLY — never localStorage — so console UI preferences such as the
// favorites bar are kept (they live in localStorage or server-side). Scoped to
// aws.amazon.com and its subdomains (signin / console) via host_permissions.
const AWS_COOKIE_DOMAINS = ["aws.amazon.com"];

async function clearAwsSessions() {
  let removed = 0;
  for (const domain of AWS_COOKIE_DOMAINS) {
    let cookies = [];
    try {
      cookies = await chrome.cookies.getAll({ domain });
    } catch {
      continue; // no host permission for this domain, or none set
    }
    for (const c of cookies) {
      const host = c.domain.replace(/^\./, "");
      // Always https: host_permissions are https-only, so an http:// URL here
      // makes cookies.remove fail for any non-Secure cookie — silently, leaving
      // the cookie in place while still counting it as cleared.
      const url = `https://${host}${c.path}`;
      try {
        await chrome.cookies.remove({ url, name: c.name, storeId: c.storeId });
        removed++;
      } catch {
        // A cookie that can't be removed individually is skipped.
      }
    }
  }
  return removed;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_clear_sessions") return;
  clearAwsSessions()
    .then((count) => sendResponse({ ok: true, count }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true; // keep the message channel open for the async response
});

// === ACTIVE CONSOLE SESSIONS ===
// AWS caps you at 5 concurrent console sessions per cookie jar, and only tells
// you once you're over it (the "Choose your session" wall). It does expose the
// live set though:
//     GET https://{region}.signin.aws.amazon.com/sessions/v1/list
// which returns { sessions: [{ differentiator, principal_arn, expiry,
// auth_time, account_alias }, …] }. We read it here in the service worker
// rather than a content script because the picker page is a *different* origin
// from the regional signin host — a page-context fetch is CORS-blocked, while
// the worker is covered by host_permissions. Only session metadata is read;
// no cookie is ever inspected.
const AWS_SESSION_LIMIT = 5;

// A session's console host is "{differentiator}.{region}.console.aws.amazon.com",
// so counting a session's open tabs is a hostname-prefix match. This is the
// closest honest answer to "is this session still in use?" — AWS exposes no
// last-activity timestamp.
// Everything we can learn about a session from its open tabs: how many there
// are, which regions they're in, and which Chrome tab group they landed in.
// The console host is "{differentiator}.{region}.console.aws.amazon.com", so
// both the session and its region fall out of the hostname.
async function collectTabInfo() {
  const info = {};
  try {
    const tabs = await chrome.tabs.query({ url: "https://*.console.aws.amazon.com/*" });
    const groupTitles = new Map();
    for (const t of tabs) {
      let parts = [];
      try {
        parts = new URL(t.url).hostname.split(".");
      } catch {
        continue;
      }
      const diff = parts[0];
      if (!/^\d{12}-/.test(diff)) continue;
      const entry = info[diff] || (info[diff] = { tabs: 0, regions: [], group: "" });
      entry.tabs++;
      const region = parts[1];
      if (/^[a-z0-9-]+$/.test(region || "") && region !== "console" && !entry.regions.includes(region)) {
        entry.regions.push(region);
      }
      // Tab-group titles are looked up once each; a tab may legitimately be in
      // no group, and the group may vanish between query and get.
      if (!entry.group && t.groupId != null && t.groupId !== -1) {
        if (!groupTitles.has(t.groupId)) {
          try {
            const g = await chrome.tabGroups.get(t.groupId);
            groupTitles.set(t.groupId, (g && g.title) || "");
          } catch {
            groupTitles.set(t.groupId, "");
          }
        }
        entry.group = groupTitles.get(t.groupId) || "";
      }
    }
  } catch {
    /* tabs/tabGroups unavailable; callers get an empty map */
  }
  return info;
}

// Only [a-z0-9-] plus the 12-digit account prefix — this value lands in a URL
// path, so it is validated before use.
const DIFFERENTIATOR_RE = /^\d{12}-[a-z0-9-]+$/i;

function signinHost(region) {
  // Region only picks which regional signin host answers; any works. Validated
  // because it lands in a URL host.
  const r = /^[a-z0-9-]+$/.test(String(region || "")) ? region : "us-east-1";
  return `${r}.signin.aws.amazon.com`;
}

async function listAwsSessions(region) {
  const res = await fetch(`https://${signinHost(region)}/sessions/v1/list`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`sessions/v1/list responded ${res.status}`);
  const data = await res.json();
  const raw = Array.isArray(data && data.sessions) ? data.sessions : [];
  const tabInfo = await collectTabInfo();
  return raw.map((s) => {
    // arn:aws:sts::123456789012:assumed-role/RoleName/session-name
    const m = String(s.principal_arn || "").match(
      /^arn:aws:sts::(\d{12}):assumed-role\/([^/]+)\/(.*)$/
    );
    const differentiator = String(s.differentiator || "");
    const t = tabInfo[differentiator] || { tabs: 0, regions: [], group: "" };
    return {
      account: m ? m[1] : "",
      role: m ? m[2] : "",
      // The SAML RoleSessionName, which survives a switch-role — usually the
      // user's email, so it's the same for every session and only worth showing
      // when it isn't.
      sessionName: m ? m[3] : "",
      differentiator,
      alias: String(s.account_alias || ""),
      expiry: Number(s.expiry) || 0,
      authTime: Number(s.auth_time) || 0,
      tabs: t.tabs,
      regions: t.regions,
      group: t.group,
    };
  });
}

// Sign a single session out. Same URL family as the per-session authorize link
// the console's own account menu uses:
//   https://{region}.signin.aws.amazon.com/sessions/{differentiator}/v1/logout
// Done here rather than in the page because the picker is a different origin
// from the regional signin host.
async function signOutAwsSession(region, differentiator) {
  if (!DIFFERENTIATOR_RE.test(String(differentiator || ""))) {
    throw new Error("invalid session id");
  }
  const url = `https://${signinHost(region)}/sessions/${encodeURIComponent(differentiator)}/v1/logout`;
  const res = await fetch(url, { credentials: "include", redirect: "follow" });
  // AWS answers the logout with a redirect to a sign-in page; any non-5xx means
  // the session was dropped.
  if (res.status >= 500) throw new Error(`logout responded ${res.status}`);
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_list_sessions") return;
  listAwsSessions(message.region)
    .then((sessions) =>
      sendResponse({ ok: true, sessions, limit: AWS_SESSION_LIMIT })
    )
    // Not signed in at all, or AWS changed the endpoint — callers treat this as
    // "unknown" and stay silent rather than guessing a count.
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_signout_session") return;
  signOutAwsSession(message.region, message.differentiator)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});

// Signing in opens the console in another tab, which leaves the role picker
// showing a stale session count. Watch console tabs appearing and disappearing
// and nudge any open picker so its list stays live. Debounced, because a single
// sign-in fires several onUpdated events as the tab navigates.
let sessionsChangedTimer = null;

function notifyPickersSessionsChanged() {
  clearTimeout(sessionsChangedTimer);
  sessionsChangedTimer = setTimeout(async () => {
    let pickers = [];
    try {
      pickers = await chrome.tabs.query({
        url: ["https://signin.aws.amazon.com/saml", "https://*.signin.aws.amazon.com/saml"],
      });
    } catch {
      return;
    }
    for (const t of pickers) {
      // A picker tab that has since navigated has no listener; ignore the error.
      chrome.tabs.sendMessage(t.id, { type: "hop_sessions_changed" }).catch(() => {});
    }
  }, 800);
}

const isConsoleUrl = (url) => /^https:\/\/[^/]*console\.aws\.amazon\.com\//.test(url || "");

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isConsoleUrl(changeInfo.url)) notifyPickersSessionsChanged();
});
chrome.tabs.onRemoved.addListener(() => notifyPickersSessionsChanged());
