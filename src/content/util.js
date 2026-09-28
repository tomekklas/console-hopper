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
  // No "name (id)" form: AWS renders an account with no IAM alias as a bare
  // 12-digit id with no parenthetical. Recover the id from a 12-digit run so
  // id-keyed features — jump-hub matching, tags, filters, account names — keep
  // working for alias-less accounts; fall back to id-less only when there's no
  // account number at all.
  const stripped = text.replace(/^Account:\s*/i, "").trim();
  const idMatch = stripped.match(/\b\d{12}\b/);
  return { name: stripped, id: idMatch ? idMatch[0] : "" };
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

// True if `code` is a syntactically valid AWS region code. Lenient enough to
// cover every partition (see REGION_CODE_RE), but strict enough to be safe to
// drop straight into a console host segment or a `region=` query value — only
// [a-z0-9-], so a value can never break out and inject elsewhere in the URL.
export const isValidRegionCode = (code) => REGION_CODE_RE.test(String(code || ""));

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

// Account tags: a { accountId -> [tag, ...] } map. Tags are free-text labels
// (spaces allowed) so an account can be found by concept, not just by its name.
// Line-based editor like account names: "id: tag, tag, tag".
const MAX_TAG_LEN = 40;
const MAX_TAGS_PER_ACCOUNT = 24;

// Trim each tag, collapse internal whitespace, drop empties, cap length, dedupe
// case-insensitively (first spelling wins, so casing stays canonical), cap count.
export const normalizeTagList = (list) => {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const tag = String(raw == null ? "" : raw).trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LEN);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS_PER_ACCOUNT) break;
  }
  return out;
};

export const parseAccountTagLines = (text) => {
  const out = {};
  for (const rawLine of String(text || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const id = line.slice(0, sep).trim();
    if (!/^\d{12}$/.test(id)) continue;
    const tags = normalizeTagList(line.slice(sep + 1).split(","));
    if (tags.length) out[id] = tags;
  }
  return out;
};

export const formatAccountTagLines = (map) =>
  Object.entries(map && typeof map === "object" && !Array.isArray(map) ? map : {})
    .map(([id, tags]) => `${id}: ${(Array.isArray(tags) ? tags : []).join(", ")}`)
    .join("\n");

export const normalizeAccountTags = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [id, tags] of Object.entries(raw)) {
    if (!/^\d{12}$/.test(id)) continue;
    const clean = normalizeTagList(tags);
    if (clean.length) out[id] = clean;
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
    // The hub may name a specific role to sign into — "123456789012/AdminRole".
    // Without it the first row for that account wins, which in an account with
    // several roles may be one that can't assume anything.
    const [hub, ...hubRoleRest] = parts[1].split("/");
    const hubRole = hubRoleRest.join("/").trim().slice(0, 128);
    const name = parts[0].slice(0, 64);
    const role = parts[2].slice(0, 128);
    if (!name || !/^\d{12}$/.test(hub) || !role) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Optional 4th field: the region a jump through this profile should land
    // in. Omitted (or invalid) leaves it empty, and the Jump popover falls back
    // to the last jumped-into region / General Settings region.
    const region = (parts[3] || "").toLowerCase();
    const entry = { name, hub, role };
    if (hubRole) entry.hubRole = hubRole;
    if (isValidRegionCode(region)) entry.region = region;
    out.push(entry);
  }
  return out;
};

export const formatAssumeProfileLines = (list) =>
  (Array.isArray(list) ? list : [])
    .map((p) => {
      // Only emit the optional parts when set, so simpler profiles round-trip
      // unchanged.
      const hub = p.hubRole ? `${p.hub}/${p.hubRole}` : p.hub;
      const head = `${p.name} | ${hub} | ${p.role}`;
      return p.region ? `${head} | ${p.region}` : head;
    })
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
    // Optional per-profile landing region; dropped when absent or malformed so
    // an imported settings file can't inject a bad value into a console URL.
    const region = typeof p.region === "string" ? p.region.trim().toLowerCase() : "";
    const hubRole = typeof p.hubRole === "string" ? p.hubRole.trim().slice(0, 128) : "";
    const entry = { name, hub, role };
    if (hubRole) entry.hubRole = hubRole;
    if (isValidRegionCode(region)) entry.region = region;
    out.push(entry);
  }
  return out;
};

// Jump "recents" and "pinned" — chained jumps, newest first. Each entry is
// { org, account (12-digit), label, role, ts }. Validated and capped on read
// (default 6 for recents; the caller passes a larger cap for pinned) so a
// corrupted or oversized stored value can't reach the popover.
export const normalizeJumpRecents = (raw, cap = 6) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const account = typeof r.account === "string" ? r.account.trim() : "";
    if (!/^\d{12}$/.test(account)) continue;
    const org = typeof r.org === "string" ? r.org.trim().slice(0, 64) : "";
    const label = typeof r.label === "string" ? r.label.trim().slice(0, 120) : "";
    const role = typeof r.role === "string" ? r.role.trim().slice(0, 128) : "";
    const ts = typeof r.ts === "number" && isFinite(r.ts) ? r.ts : 0;
    out.push({ org, account, label, role, ts });
    if (out.length >= cap) break;
  }
  return out;
};

// Search matching. A term wrapped in double quotes ("...") matches an exact
// literal substring (spaces preserved), so `"test 123"` will NOT match
// "test123". Any other term is separator-insensitive — both sides reduced to
// alphanumerics — so "test 123" matches "test123" / "test-123" but not
// "test13". An empty term matches everything (no constraint).
export const searchMatches = (term, text) => {
  const q = String(term == null ? "" : term).trim();
  if (!q) return true;
  const t = String(text == null ? "" : text);
  if (q.length >= 2 && q.startsWith('"') && q.endsWith('"')) {
    const inner = q.slice(1, -1).toLowerCase();
    return inner === "" ? true : t.toLowerCase().includes(inner);
  }
  const alnum = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nq = alnum(q);
  return nq === "" ? true : alnum(t).includes(nq);
};

// Parse a search query into AND-ed terms. Each term is { field, negate, values }:
// `field` is a known qualifier (lowercased) or "" for a bare full-text term;
// `negate` is a leading "-" (exclude); `values` is a comma-OR list of
// { text, quoted }. A prefix is only treated as a field when it's in
// `knownFields` — otherwise the colon stays part of a bare term (so e.g. a role
// ARN searches literally). Quoted spans are kept intact by the tokenizer.
export const parseQuery = (input, knownFields) => {
  const known = knownFields instanceof Set ? knownFields : new Set(knownFields || []);
  const terms = [];
  const tokens = String(input == null ? "" : input).match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  for (const raw of tokens) {
    let token = raw;
    let negate = false;
    if (token.length > 1 && token[0] === "-") { negate = true; token = token.slice(1); }
    let field = "";
    let rest = token;
    if (token[0] !== '"') {
      const ci = token.indexOf(":");
      if (ci > 0 && known.has(token.slice(0, ci).toLowerCase())) {
        field = token.slice(0, ci).toLowerCase();
        rest = token.slice(ci + 1);
      }
    }
    let values;
    if (rest.length >= 2 && rest[0] === '"' && rest[rest.length - 1] === '"') {
      values = [{ text: rest.slice(1, -1), quoted: true }];
    } else {
      values = rest
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const q = p.length >= 2 && p[0] === '"' && p[p.length - 1] === '"';
          return { text: q ? p.slice(1, -1) : p, quoted: q };
        });
    }
    if (values.length) terms.push({ field, negate, values });
  }
  return terms;
};

// Evaluate parsed terms (AND-ed) against a row's fields. `fields` maps a field
// name to its text; bare terms match against fields._all. Within a term the
// values are OR-ed. Quoted values need an exact substring; bare values are
// separator-insensitive (searchMatches). A negated term must NOT match.
export const matchesQuery = (terms, fields) => {
  const f = fields || {};
  const valueHits = (v, text) =>
    v.quoted
      ? String(text == null ? "" : text).toLowerCase().includes(v.text.toLowerCase())
      : searchMatches(v.text, text == null ? "" : text);
  for (const term of terms) {
    const text = (term.field ? f[term.field] : f._all) || "";
    const hit = term.values.some((v) => valueHits(v, text));
    if (term.negate ? hit : !hit) return false;
  }
  return true;
};

// === Jump destinations — saved chained-jump targets, shown as rows in the
// role listing. One entry: { name, account, profile, region, service, label }
//   name    — optional display name (max 64); the row falls back to the
//             Account Names entry for the account, then the bare id
//   account — required 12-digit destination account
//   profile — required Jump Profile (org) name this jump goes through (max 64)
//   region  — optional landing region code (validated, else dropped)
//   service — optional landing service PATH from the Services config; path
//             fragment only, charset-checked so it can never carry a scheme,
//             a host, or a traversal into the console URL it lands in
//   label   — optional default session label (max 120)

// Path fragment only: no leading slash or "//" (the first character class
// has no "/"), no "..", no whitespace. "#" and ":" ARE allowed — real console
// deep links carry both (ec2/home?region={region}#Instances:) and the value
// is only ever appended after "https://{host}/", so neither can smuggle a
// scheme or host. Cap matches the Services config's 256.
// Mirrored inline in console-decorator.js as SERVICE_PATH_RE (a standalone
// classic script that can't import) — keep the two in sync.
export const JUMP_DEST_SERVICE_RE = /^[A-Za-z0-9_\-?=&{}.%+][A-Za-z0-9/_\-?=&{}.%+#:]{0,255}$/;

export const isSafeServicePath = (p) => {
  const s = String(p == null ? "" : p);
  if (s === "") return true;
  return JUMP_DEST_SERVICE_RE.test(s) && !s.includes("..");
};

export const normalizeJumpDests = (raw, cap = 100) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const account = typeof d.account === "string" ? d.account.trim() : "";
    const profile = typeof d.profile === "string" ? d.profile.trim().slice(0, 64) : "";
    if (!/^\d{12}$/.test(account) || !profile) continue;
    // One row per account+profile: the same target through the same hub is the
    // same destination, whatever it's called.
    const key = `${account} ${profile.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // "|" is the Import line format's delimiter — a name or label carrying it
    // would corrupt (or delete) the entry on the next Import round-trip, so
    // swap it for the lookalike broken bar on the way into storage.
    const name = typeof d.name === "string"
      ? d.name.replace(/\|/g, "¦").trim().slice(0, 64) : "";
    const label = typeof d.label === "string"
      ? d.label.replace(/\|/g, "¦").trim().slice(0, 120) : "";
    const region = typeof d.region === "string" ? d.region.trim().toLowerCase() : "";
    const service = typeof d.service === "string" ? d.service.trim() : "";
    out.push({
      name,
      account,
      profile,
      region: isValidRegionCode(region) ? region : "",
      service: service && isSafeServicePath(service) ? service : "",
      label,
    });
    if (out.length >= cap) break;
  }
  return out;
};

// Stable identity for a destination row. Stands in for a role ARN wherever the
// listing keys per-row state (favorites, manual order, last service/region), so
// it must never collide with a real ARN ("jump::" can't start one) and must
// round-trip any profile name — encodeURIComponent leaves no ":" in the
// profile part, so the "::" separators stay unambiguous.
export const jumpDestKey = (account, profile) =>
  `jump::${account}::${encodeURIComponent(String(profile || ""))}`;

// Resolve a human service token — a Services entry's id, display name, or
// literal path — to that entry's PATH. "", "console" and "console only" mean
// the console home (""). Unknown tokens return null so callers can decide
// whether to drop or report them.
export const resolveServiceToken = (token, services) => {
  const t = String(token == null ? "" : token).trim();
  if (!t || /^console(\s+only)?$/i.test(t)) return "";
  const lc = t.toLowerCase();
  for (const s of Array.isArray(services) ? services : []) {
    if (!s || typeof s !== "object") continue;
    if (
      String(s.id || "").toLowerCase() === lc ||
      String(s.name || "").toLowerCase() === lc ||
      String(s.path || "") === t
    ) {
      return String(s.path || "");
    }
  }
  return null;
};

// Inverse for display/export: prefer the configured service's name, fall back
// to the raw path so an entry for a since-deleted service still round-trips.
export const serviceTokenForPath = (path, services) => {
  const p = String(path == null ? "" : path);
  if (!p) return "";
  for (const s of Array.isArray(services) ? services : []) {
    if (s && typeof s === "object" && String(s.path || "") === p) {
      return String(s.name || s.id || p);
    }
  }
  return p;
};

// Parse the pipe-delimited bulk format, one destination per line:
//   Name | account | profile | region | service | label
// Fields are positional; trailing fields are optional and empty middle slots
// are allowed ("x | 111111111111 | Org A | | rds"). A line may start with the
// bare 12-digit account id to skip the name. The service slot accepts a
// Services id, display name, or path; unknown tokens are dropped to "console".
export const parseJumpDestLines = (text, services) => {
  const out = [];
  for (const rawLine of String(text || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    let parts = line.split("|").map((p) => p.trim());
    // Bare-account shorthand — but only when the SECOND cell isn't also a
    // 12-digit id, which would mean the first cell is a name that merely
    // looks like an account ("111111111111 | 222222222222 | Org A").
    if (/^\d{12}$/.test(parts[0] || "") && !/^\d{12}$/.test(parts[1] || "")) {
      parts = ["", ...parts];
    }
    const [name = "", account = "", profile = "", region = "", serviceTok = "", ...labelRest] = parts;
    const service = resolveServiceToken(serviceTok, services);
    out.push({
      name,
      account,
      profile,
      region,
      service: service == null ? "" : service,
      label: labelRest.join(" | "),
    });
  }
  return normalizeJumpDests(out);
};

// Render destinations back into the line format (inverse of
// parseJumpDestLines): trailing empties dropped, nameless entries emitted in
// the bare-account shorthand.
export const formatJumpDestLines = (list, services) =>
  (Array.isArray(list) ? list : [])
    .map((d) => {
      const cells = [
        d.name || "",
        d.account,
        d.profile,
        d.region || "",
        serviceTokenForPath(d.service, services),
        d.label || "",
      ];
      while (cells.length && !cells[cells.length - 1]) cells.pop();
      if (!cells[0]) cells.shift();
      return cells.join(" | ");
    })
    .join("\n");

// === LAUNCH SETS ===
// A launch set is a named list of console tabs to open together:
//   { id, name, group, tabs: [{ roleArn, service, region }], lastUsed }
// `group` is the Chrome tab-group name the tabs gather in ("" = no group);
// `service` is a console path in the Services format ("" = console home), and
// `region` a region code ("" = the row's default). One role may appear in
// several tabs. Everything is re-validated on load and import: service paths
// and regions end up in a sign-in URL.
export const LAUNCH_SET_MAX_TABS = 20;
export const LAUNCH_SETS_MAX = 50;
const LAUNCH_SET_ID_RE = /^[a-z0-9]{1,24}$/;
const ROLE_ARN_RE = /^arn:aws[a-z-]*:iam::\d{12}:role\/[\w+=,.@/-]{1,512}$/;

export const isRoleArn = (arn) => ROLE_ARN_RE.test(String(arn || ""));

export const normalizeLaunchSetTabs = (raw) =>
  (Array.isArray(raw) ? raw : [])
    .filter((t) => t && typeof t === "object" && isRoleArn(t.roleArn))
    .slice(0, LAUNCH_SET_MAX_TABS)
    .map((t) => ({
      roleArn: t.roleArn,
      service: typeof t.service === "string" && isSafeServicePath(t.service) ? t.service : "",
      region: isValidRegionCode(t.region) ? t.region : "",
    }));

export const normalizeLaunchSets = (raw) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const ids = new Set();
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const id = typeof s.id === "string" && LAUNCH_SET_ID_RE.test(s.id) ? s.id : "";
    if (!id || ids.has(id)) continue;
    const name = typeof s.name === "string" ? s.name.trim().slice(0, 64) : "";
    if (!name) continue;
    const group = typeof s.group === "string" ? s.group.trim().slice(0, 64) : name;
    const tabs = normalizeLaunchSetTabs(s.tabs);
    if (!tabs.length) continue;
    const lastUsed = Number.isFinite(s.lastUsed) && s.lastUsed > 0 ? s.lastUsed : 0;
    out.push({ id, name, group, tabs, lastUsed });
    ids.add(id);
    if (out.length >= LAUNCH_SETS_MAX) break;
  }
  return out;
};

// How many distinct roles a set signs into — what it costs in AWS's
// five-session budget, since tabs of one role share a session.
export const launchSetRoleCount = (set) =>
  new Set(((set && set.tabs) || []).map((t) => t.roleArn)).size;
