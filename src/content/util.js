// Pure helpers extracted from content.js for unit testing (see ROADMAP.md
// Stage 4). No DOM or chrome.* dependencies — safe to import in Node tests.

// Escape a string for safe interpolation into an HTML template. Handles the
// five HTML-significant characters. NEVER use for CSS or URL contexts; those
// need their own escapers.
export const escapeHtml = (input) => {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Backwards-compatible alias (historically misused as an HTML escaper).
export const sanitizeInput = escapeHtml;

// AWS renders `Account: name (id)`; pull out the name and 12-digit id. On the
// no-match path we still strip the `Account:` prefix so it doesn't show up in
// the role row.
export const parseAccountInfo = (accountText) => {
  const text = (accountText || "").trim();
  const match = text.match(/Account:\s*(.+?)\s*\((\d+)\)/);
  if (match) {
    return { name: match[1].trim(), id: match[2].trim() };
  }
  return { name: text.replace(/^Account:\s*/i, ""), id: "" };
};

// Shared matcher: a pattern is either an exact account-ID match (full 12-digit
// account number) or a case-insensitive substring of the account name. Used by
// every entry-based manager.
export const matchesAnyPattern = (patterns, accountName, accountId) => {
  if (!patterns || patterns.length === 0) return false;
  const name = (accountName || "").toLowerCase();
  const id = (accountId || "").toString().trim();
  for (const raw of patterns) {
    const pattern = (raw || "").toString().trim();
    if (!pattern) continue;
    if (id && pattern === id) return true;
    if (name.includes(pattern.toLowerCase())) return true;
  }
  return false;
};

// Matches a role-name keyword: case-insensitive substring of the role name.
// (Role-name filters use only the role text — not account info.)
export const matchesRolePatterns = (patterns, roleName) => {
  if (!patterns || patterns.length === 0) return false;
  const rn = (roleName || "").toLowerCase();
  for (const raw of patterns) {
    const p = (raw || "").toString().trim().toLowerCase();
    if (p && rn.includes(p)) return true;
  }
  return false;
};

// AWS region code shape — deliberately lenient so it covers every partition
// (us-east-1, ap-southeast-2, eu-central-1, us-gov-east-1, cn-north-1, …).
const REGION_CODE_RE = /^[a-z0-9-]+$/;

// Parse the Manage Regions textarea: one region per line, either "code" or
// "code: Friendly Label". Invalid codes are skipped; the first of any
// duplicate id wins. The resulting order is the order regions appear in the
// switcher dropdown.
export const parseRegionLines = (text) => {
  const out = [];
  const seen = new Set();
  for (const rawLine of String(text || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    const id = (sep === -1 ? line : line.slice(0, sep)).trim().toLowerCase();
    const label = (sep === -1 ? "" : line.slice(sep + 1).trim()) || id;
    if (!REGION_CODE_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label });
  }
  return out;
};

// Render a region list back into the textarea form (inverse of parseRegionLines).
export const formatRegionLines = (list) =>
  (Array.isArray(list) ? list : [])
    .map((r) => (r.label && r.label !== r.id ? `${r.id}: ${r.label}` : r.id))
    .join("\n");

// Validate a stored / imported region list into clean [{ id, label }] entries.
export const normalizeRegionList = (raw) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const id = (e.id || "").toString().trim().toLowerCase();
    if (!REGION_CODE_RE.test(id) || seen.has(id)) continue;
    const label = (e.label || id).toString().trim() || id;
    seen.add(id);
    out.push({ id, label });
  }
  return out;
};

// Account renaming: a { accountId -> custom name } map. ids must be 12-digit
// AWS account numbers. parse/format mirror the region helpers.
export const parseAccountNameLines = (text) => {
  const out = {};
  for (const rawLine of String(text || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const id = line.slice(0, sep).trim();
    const name = line.slice(sep + 1).trim();
    if (!/^\d{12}$/.test(id) || !name) continue;
    out[id] = name;
  }
  return out;
};

export const formatAccountNameLines = (map) =>
  Object.entries(map && typeof map === "object" ? map : {})
    .map(([id, name]) => `${id}: ${name}`)
    .join("\n");

export const normalizeAccountNames = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [id, name] of Object.entries(raw)) {
    if (/^\d{12}$/.test(id) && typeof name === "string" && name.trim()) {
      out[id] = name.trim();
    }
  }
  return out;
};

// Assume-role "jump" profiles — one per org, for accounts reached by chaining
// from a hub. Each line is "Org name | hubAccountId | roleName": the hub is the
// 12-digit account you sign into and roleName is the role to assume in targets.
export const parseAssumeProfileLines = (text) => {
  const out = [];
  const seen = new Set();
  for (const rawLine of String(text || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;
    const hub = parts[1];
    const name = parts[0].slice(0, 64);
    const role = parts[2].slice(0, 128);
    if (!name || !/^\d{12}$/.test(hub) || !role) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, hub, role });
  }
  return out;
};

export const formatAssumeProfileLines = (list) =>
  (Array.isArray(list) ? list : [])
    .map((p) => `${p.name} | ${p.hub} | ${p.role}`)
    .join("\n");

export const normalizeAssumeProfiles = (raw) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const name = typeof p.name === "string" ? p.name.trim().slice(0, 64) : "";
    const hub = typeof p.hub === "string" ? p.hub.trim() : "";
    const role = typeof p.role === "string" ? p.role.trim().slice(0, 128) : "";
    if (!name || !/^\d{12}$/.test(hub) || !role) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, hub, role });
  }
  return out;
};

// Jump "recents" — the most-recent chained jumps, newest first. Each entry is
// { org, account (12-digit), label, ts }. Validated and capped on read so a
// corrupted or oversized aws_jump_recents value can't reach the popover.
export const normalizeJumpRecents = (raw) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const account = typeof r.account === "string" ? r.account.trim() : "";
    if (!/^\d{12}$/.test(account)) continue;
    const org = typeof r.org === "string" ? r.org.trim().slice(0, 64) : "";
    const label = typeof r.label === "string" ? r.label.trim().slice(0, 120) : "";
    const ts = typeof r.ts === "number" && isFinite(r.ts) ? r.ts : 0;
    out.push({ org, account, label, ts });
    if (out.length >= 6) break;
  }
  return out;
};
