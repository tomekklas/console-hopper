// Console Hopper — service worker for tab grouping and the region lock.
//
// Listens for messages from the console-decorator content script and groups
// the sending tab by `account · role`, emulating Firefox containers via
// Chrome tab groups. Each unique pair gets a deterministic color from
// Chrome's palette so the same role always shows up the same color in your
// tab strip.
//
// It also holds the region each console tab is working in, so a tab that
// bounces through a global console (IAM, Billing, …) comes back to the region
// it was in rather than wherever AWS's per-identity default drops it. The
// decision itself is in src/shared/region-lock.js; this file supplies the
// per-tab memory the decision needs. Tab state lives in chrome.storage.session
// — the service worker is free to be evicted between two navigations, and the
// region is part of the console hostname, so a corrected tab changes origin
// and can't carry sessionStorage across the hop.

import { nextTabState, parseConsolePage, planRegionLock } from "./src/shared/region-lock.js";
import { LAUNCH_MAX_TABS, isSamlAction, sanitizeLaunchFields } from "./src/shared/launch.js";

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

// Grouping runs one tab at a time. A Launch Set opens several tabs that all
// ask for the same group within a second of each other; run concurrently, each
// would find no group with that title yet and create its own.
let groupQueue = Promise.resolve();

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
  groupQueue = groupQueue
    .then(() => groupTab(tabId, account, role, tag, mode, org))
    .catch((err) => console.warn("[hop] groupTab failed:", err));
  // No response needed.
});

// === LAUNCH SETS ===
// The role picker can't open several tabs from one click (the popup blocker
// allows one new window per click), so it hands a batch to us: one set of SAML
// form fields per tab. Each tab gets a single-use ticket; we open launch.html
// with the ticket in its fragment, and that page redeems the ticket for its
// fields and posts them to AWS. Tickets live in chrome.storage.session, which
// content scripts cannot read, so the SAML response never reaches an AWS page
// or a URL.
const LAUNCH_TICKETS_KEY = "hop_launch_tickets";
// A SAML response is only accepted by AWS for a few minutes anyway.
const LAUNCH_TICKET_TTL_MS = 5 * 60 * 1000;
// Opening tabs a moment apart keeps AWS's sign-in from seeing a burst of
// simultaneous posts, and keeps the tab strip order readable as it fills.
const LAUNCH_STAGGER_MS = 350;

const PICKER_URL_RE = /^https:\/\/(?:[a-z0-9-]+\.)?signin\.aws\.amazon\.com\/saml(?:[?#]|$)/;

function newTicket() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
}

async function readTickets() {
  try {
    const res = await chrome.storage.session.get(LAUNCH_TICKETS_KEY);
    const all = (res && res[LAUNCH_TICKETS_KEY]) || {};
    const now = Date.now();
    for (const k of Object.keys(all)) {
      if (!all[k] || now - (all[k].ts || 0) > LAUNCH_TICKET_TTL_MS) delete all[k];
    }
    return all;
  } catch (err) {
    return {};
  }
}

// Ticket reads and writes are serialized, so two launch pages redeeming at the
// same moment can't overwrite each other's deletion.
let ticketQueue = Promise.resolve();
function withTickets(fn) {
  const run = ticketQueue.then(async () => {
    const all = await readTickets();
    const result = await fn(all);
    await chrome.storage.session.set({ [LAUNCH_TICKETS_KEY]: all });
    return result;
  });
  ticketQueue = run.catch(() => {});
  return run;
}

async function launchTabs(action, tabs, sender) {
  if (!isSamlAction(action)) throw new Error("not an AWS SAML sign-in endpoint");
  if (!Array.isArray(tabs) || tabs.length === 0 || tabs.length > LAUNCH_MAX_TABS) {
    throw new Error("nothing to open");
  }
  const cleaned = tabs.map((t) => sanitizeLaunchFields(t && t.fields));
  if (cleaned.some((f) => !f)) throw new Error("a tab's sign-in fields were rejected");

  const tickets = await withTickets((all) => {
    const ts = Date.now();
    return cleaned.map((fields) => {
      const id = newTicket();
      all[id] = { action, fields, ts };
      return id;
    });
  });

  // New tabs go right after the picker, in order, without taking focus from it.
  const pickerTab = sender.tab;
  let index = pickerTab.index + 1;
  for (let i = 0; i < tickets.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, LAUNCH_STAGGER_MS));
    await chrome.tabs.create({
      url: chrome.runtime.getURL(`launch.html#${tickets[i]}`),
      windowId: pickerTab.windowId,
      index: index++,
      active: false,
    });
  }
  return tickets.length;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_launch") return;
  // Only the role picker itself may start a launch.
  if (!sender || !sender.tab || !PICKER_URL_RE.test(String(sender.url || ""))) {
    sendResponse({ ok: false, error: "not sent from the AWS role picker" });
    return;
  }
  launchTabs(message.action, message.tabs, sender)
    .then((opened) => sendResponse({ ok: true, opened }))
    .catch((err) => sendResponse({ ok: false, error: String(err && err.message ? err.message : err) }));
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_launch_take") return;
  // Only our own launch page may redeem a ticket.
  const launchPage = chrome.runtime.getURL("launch.html");
  if (!sender || sender.id !== chrome.runtime.id || !String(sender.url || "").startsWith(launchPage)) {
    sendResponse({ ok: false });
    return;
  }
  const id = String(message.ticket || "");
  withTickets((all) => {
    const hit = all[id];
    delete all[id];
    return hit || null;
  })
    .then((hit) =>
      sendResponse(hit ? { ok: true, action: hit.action, fields: hit.fields } : { ok: false })
    )
    .catch(() => sendResponse({ ok: false }));
  return true;
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

// === SAVE OPEN TABS AS A LAUNCH SET ===
// Every open console tab, with what a set needs to reopen it: the role (from
// the AWS session its multi-session host belongs to), the region (from the
// host) and the page. Tabs we can't tie to a session — AWS multi-session off,
// or a session that has since expired — come back without a role, and the
// picker lists them as not savable.
function consolePageOf(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  const parts = u.hostname.split(".");
  const differentiator = /^\d{12}-[a-z0-9-]+$/i.test(parts[0]) ? parts[0] : "";
  const regionLabel = parts[differentiator ? 1 : 0] || "";
  const region =
    /^[a-z]{2}(-[a-z]+)+-\d$/.test(regionLabel) ? regionLabel : "";
  // Drop our own #hop payload if it is still on the URL; keep the console's
  // own fragment (EC2 and CloudWatch route with it).
  const hash = new URLSearchParams(u.hash.replace(/^#/, ""));
  const ownHash = u.hash && !hash.has("hop") ? u.hash : "";
  return {
    differentiator,
    region,
    path: u.pathname.replace(/^\//, "") + u.search + ownHash,
  };
}

async function listConsoleTabsForSets(region) {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: "https://*.console.aws.amazon.com/*" });
  } catch {
    return [];
  }
  let sessions = [];
  try {
    sessions = await listAwsSessions(region);
  } catch {
    /* signed out or endpoint moved: every tab comes back without a role */
  }
  const byDifferentiator = new Map(sessions.map((s) => [s.differentiator, s]));
  const groupTitles = new Map();
  const out = [];
  for (const t of tabs.sort((a, b) => a.windowId - b.windowId || a.index - b.index)) {
    const page = consolePageOf(t.url);
    if (!page) continue;
    const session = byDifferentiator.get(page.differentiator);
    let group = "";
    if (t.groupId != null && t.groupId !== -1) {
      if (!groupTitles.has(t.groupId)) {
        try {
          const g = await chrome.tabGroups.get(t.groupId);
          groupTitles.set(t.groupId, (g && g.title) || "");
        } catch {
          groupTitles.set(t.groupId, "");
        }
      }
      group = groupTitles.get(t.groupId);
    }
    out.push({
      tabId: t.id,
      title: t.title || "",
      account: session ? session.account : page.differentiator.slice(0, 12),
      role: session ? session.role : "",
      region: page.region,
      path: page.path,
      group,
      groupId: t.groupId != null ? t.groupId : -1,
    });
  }
  return out;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_list_console_tabs") return;
  listConsoleTabsForSets(message.region)
    .then((tabs) => sendResponse({ ok: true, tabs }))
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

// Sign out of EVERY live session — the sessions panel's "Sign out all" button.
// The list is re-read here rather than trusted from the page, so the button
// acts on the server's truth even if the panel was stale; one failing session
// doesn't stop the rest. Same per-session logout endpoint as above — this is
// NOT the cookie-clearing "Clear AWS Sessions".
async function signOutAllAwsSessions(region) {
  const sessions = await listAwsSessions(region);
  // Independent logouts, fired together — one failure doesn't stop the rest,
  // and five sequential round-trips would make the button feel stuck.
  const results = await Promise.allSettled(
    sessions.map((s) => signOutAwsSession(region, s.differentiator))
  );
  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[hop] sign-out-all: one session failed:", r.reason);
    }
  }
  const done = results.filter((r) => r.status === "fulfilled").length;
  return { done, total: sessions.length };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_signout_all") return;
  signOutAllAwsSessions(message.region)
    .then((r) => sendResponse({ ok: true, done: r.done, total: r.total }))
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

// === REGION LOCK ===

const TAB_REGIONS_KEY = "hop_tab_regions";
const REGION_LOCK_SETTING = "aws_region_lock";
const DEFAULT_REGION_SETTING = "aws_region";
// A tab's region memory is worthless once the tab is gone; entries are dropped
// on close, and this bounds the map if a close event is ever missed.
const TAB_REGIONS_MAX = 200;

async function readTabRegions() {
  try {
    const res = await chrome.storage.session.get(TAB_REGIONS_KEY);
    const all = (res && res[TAB_REGIONS_KEY]) || {};
    return typeof all === "object" && all !== null ? all : {};
  } catch (err) {
    return {};
  }
}

async function writeTabRegions(all) {
  const keys = Object.keys(all);
  if (keys.length > TAB_REGIONS_MAX) {
    // Oldest-seen first; `seen` is stamped on every write below.
    keys
      .sort((a, b) => (all[a].seen || 0) - (all[b].seen || 0))
      .slice(0, keys.length - TAB_REGIONS_MAX)
      .forEach((k) => delete all[k]);
  }
  try {
    await chrome.storage.session.set({ [TAB_REGIONS_KEY]: all });
  } catch (err) { /* session storage is best-effort; the lock degrades, nothing breaks */ }
}

// The user's General Settings region, and whether the lock is on at all.
// Absent means "not configured yet": the lock defaults to on, because a tab
// silently changing region is the bug it exists to fix.
async function readRegionLockSettings() {
  try {
    const res = await chrome.storage.local.get([REGION_LOCK_SETTING, DEFAULT_REGION_SETTING]);
    return {
      enabled: res[REGION_LOCK_SETTING] ?? true,
      fallback: typeof res[DEFAULT_REGION_SETTING] === "string" ? res[DEFAULT_REGION_SETTING] : "",
    };
  } catch (err) {
    return { enabled: true, fallback: "" };
  }
}

// A jump owns its own landing: the picker stashes the region it asked for and
// console-decorator.js re-navigates if AWS ignored it. While that hand-off is
// live for this account, the lock stays out of the way — otherwise it would
// race the jump and send the tab back to the region it came *from*.
async function jumpInFlight(href) {
  const m = /^https:\/\/(\d{12})-/.exec(String(href || ""));
  if (!m) return false;
  try {
    const res = await chrome.storage.local.get("hop_pending_jumps");
    const hit = ((res && res.hop_pending_jumps) || {})[m[1]];
    return !!hit && !!hit.ts && Date.now() - hit.ts <= 5 * 60 * 1000;
  } catch (err) {
    return false;
  }
}

// One console page load in one tab: update what we know about the tab, and
// answer with the URL the tab should go to instead, or null to stay put.
async function checkTabRegion(tabId, href) {
  const { enabled, fallback } = await readRegionLockSettings();
  if (!enabled) return null;

  const page = parseConsolePage(href);
  if (!page) return null;
  if (await jumpInFlight(href)) return null;

  const all = await readTabRegions();
  const state = all[tabId] || {};
  const plan = planRegionLock({
    page,
    pinned: state.pinned,
    prev: state.prev,
    fallback,
    tried: state.tried,
  });

  all[tabId] = nextTabState({ state, page, plan });
  await writeTabRegions(all);

  return plan.action === "correct" ? plan.url : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hop_region_check") return;
  const tabId = sender && sender.tab && sender.tab.id;
  if (!tabId) {
    sendResponse({ redirect: null });
    return true;
  }
  checkTabRegion(tabId, String(message.href || ""))
    .then((redirect) => sendResponse({ redirect }))
    .catch((err) => {
      console.warn("[hop] region check failed:", err);
      sendResponse({ redirect: null });
    });
  return true;
});

// A jump that had to correct its own landing region tells us which region it
// is steering to, so the corrected load doesn't look like a region change and
// get pinned as one.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== "hop_region_pin") return;
  const tabId = sender && sender.tab && sender.tab.id;
  const region = String(message.region || "");
  if (!tabId || !region) return;
  readTabRegions()
    .then((all) => {
      const state = all[tabId] || {};
      all[tabId] = { ...state, pinned: region, tried: null, seen: Date.now() };
      return writeTabRegions(all);
    })
    .catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  readTabRegions()
    .then((all) => {
      if (!(tabId in all)) return null;
      delete all[tabId];
      return writeTabRegions(all);
    })
    .catch(() => {});
});

const isConsoleUrl = (url) => /^https:\/\/[^/]*console\.aws\.amazon\.com\//.test(url || "");

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isConsoleUrl(changeInfo.url)) notifyPickersSessionsChanged();
});
chrome.tabs.onRemoved.addListener(() => notifyPickersSessionsChanged());
