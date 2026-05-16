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
  //  1. tag override (non-empty) → use the tag
  //  2. mode "off" → no grouping (caller checks)
  //  3. mode "org" with an org value → use that label verbatim
  //  4. mode "role" or fallback → "<account> · <role>"
  if (tag) return tag;
  if (mode === "off") return null;
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
