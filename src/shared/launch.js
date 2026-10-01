// Launch Sets — the checks the service worker applies before it opens tabs
// that post a SAML response to AWS. Pure functions, shared with the unit tests.
//
// A launch carries a bearer credential (the SAML response), so the worker only
// accepts one that is going to AWS's own SAML endpoint, only lands on an AWS
// console, and only carries the fields the role picker's form carries.

// https://signin.aws.amazon.com/saml, or a regional/partition sign-in host.
const SAML_ACTION_RE = /^https:\/\/(?:[a-z0-9-]+\.)?signin\.aws\.amazon\.com\/saml$/;

// Where a launched tab may land after sign-in: an AWS console host.
const CONSOLE_HOST_RE = /^(?:[a-z0-9-]+\.)*console\.aws\.amazon\.com$/;

// The most tabs one launch may open. AWS allows five concurrent console
// sessions, but one role can have several tabs, so this is a sanity bound
// rather than the session limit.
export const LAUNCH_MAX_TABS = 20;

// Form fields are copied from the role picker's own form; anything else is
// dropped. Values are bounded — a SAML response is typically 10–20 KB.
const FIELD_NAME_RE = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const FIELD_VALUE_MAX = 200000;

export const isSamlAction = (url) => SAML_ACTION_RE.test(String(url || ""));

export const isConsoleRelay = (url) => {
  try {
    const u = new URL(String(url || ""));
    return u.protocol === "https:" && CONSOLE_HOST_RE.test(u.hostname);
  } catch (e) {
    return false;
  }
};

// A tab reopened in a session that's already live goes straight to that
// session's own console host — "{account}-{id}.{region}.console.aws.amazon.com"
// (or the global "{account}-{id}.console…") — with no sign-in at all.
const SESSION_HOST_RE = /^\d{12}-[a-z0-9]+\.(?:[a-z0-9-]+\.)?console\.aws\.amazon\.com$/;

export const isSessionConsoleUrl = (url) => {
  try {
    const u = new URL(String(url || ""));
    return u.protocol === "https:" && !u.username && !u.password && !u.port && SESSION_HOST_RE.test(u.hostname);
  } catch (e) {
    return false;
  }
};

// A sign-in's landing URL (its RelayState, on a plain console host) moved onto
// a live session's own host — how a role's extra tabs open in the session its
// first tab signed in to, with no second sign-in. "" when it can't be.
export const sessionRelayUrl = (relayUrl, differentiator) => {
  if (!/^\d{12}-[a-z0-9]+$/.test(String(differentiator || ""))) return "";
  try {
    const u = new URL(String(relayUrl || ""));
    if (u.protocol !== "https:" || !/^(?:[a-z0-9-]+\.)?console\.aws\.amazon\.com$/.test(u.hostname)) return "";
    if (/^\d{12}-/.test(u.hostname)) return ""; // already on a session's host
    u.hostname = `${differentiator}.${u.hostname}`;
    const out = u.toString();
    return isSessionConsoleUrl(out) ? out : "";
  } catch (e) {
    return "";
  }
};

// Returns the cleaned [name, value] pairs for one tab, or null if the tab
// can't be launched safely: it must carry a SAML response, exactly one role and
// a RelayState that lands on an AWS console.
export const sanitizeLaunchFields = (fields) => {
  if (!Array.isArray(fields)) return null;
  const out = [];
  let saml = 0;
  let role = 0;
  let relay = 0;
  for (const pair of fields) {
    if (!Array.isArray(pair) || pair.length !== 2) return null;
    const [name, value] = pair;
    if (typeof name !== "string" || typeof value !== "string") return null;
    if (!FIELD_NAME_RE.test(name) || value.length > FIELD_VALUE_MAX) return null;
    if (name === "SAMLResponse") saml++;
    if (name === "roleIndex") {
      if (!/^arn:aws[a-z-]*:iam::\d{12}:role\/\S+$/.test(value)) return null;
      role++;
    }
    if (name === "RelayState") {
      if (!isConsoleRelay(value)) return null;
      relay++;
    }
    out.push([name, value]);
  }
  if (saml !== 1 || role !== 1 || relay !== 1) return null;
  return out;
};
