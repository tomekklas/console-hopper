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
