// Console Hopper — Chrome Extension
// Enhances the AWS SAML role picker with filters, favorites, deep-link
// services, per-tab env decoration, and tab-group clustering.

import { $ } from "./dom.js";
import {
  escapeHtml,
  sanitizeInput,
  parseAccountInfo,
  matchesAnyPattern,
  matchesRolePatterns,
  parseRegionLines,
  formatRegionLines,
  normalizeRegionList,
  parseAccountNameLines,
  formatAccountNameLines,
  normalizeAccountNames,
  parseAccountTagLines,
  formatAccountTagLines,
  normalizeAccountTags,
  normalizeTagList,
  parseAssumeProfileLines,
  formatAssumeProfileLines,
  normalizeAssumeProfiles,
  normalizeJumpRecents,
  searchMatches,
  parseQuery,
  matchesQuery,
} from "./util.js";

(async function () {
  "use strict";

  // === CONSTANTS & CONFIGURATION ===
  // All org-specific labels, filter buttons, colors and triggers are driven
  // from chrome.storage via the side-menu config modals. The defaults
  // below are intentionally generic so the plugin works in any AWS org.
  const CONFIG = {
    SCRIPT_VERSION: chrome.runtime.getManifest().version,
    SCRIPT_HOMEPAGE_DEFAULT: "",
    DEFAULT_AWS_REGION: "eu-central-1", // Frankfurt — the default sign-in region
    STS_DURATION: 43200, // 12 hours
    TOAST_DURATION: 3000,
    TOAST_DURATION_SHORT: 1500,
    TOAST_DURATION_LONG: 2000,
    SEARCH_DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
    STORAGE_KEYS: {
      THEME: "aws_theme",
      FAVORITES: "aws_favorites",
      SHORTCUTS: "aws_custom_shortcuts",
      COMPACT_MODE: "aws_compact_mode",
      SIGNIN_NEW_TAB: "aws_signin_new_tab",
      SERVICES: "aws_services",
      LAST_SERVICE: "aws_last_service",
      LAST_REGION: "aws_last_region",
      ENV_PATTERNS: "aws_env_patterns",
      ORG_PATTERNS: "aws_org_patterns",
      TYPE_PATTERNS: "aws_type_patterns",
      ROLE_PATTERNS: "aws_role_patterns",
      RECENT_ROLES: "aws_recent_roles",
      RECENT_LIMIT: "aws_recent_limit",
      ROLE_ORDER: "aws_role_order",
      TAB_GROUP_TAG: "aws_tab_group_tag",
      TAB_GROUP_MODE: "aws_tab_group_mode",
      AWS_REGION: "aws_region",
      REGION_LIST: "aws_region_list",
      ACCOUNT_NAMES: "aws_account_names",
      ACCOUNT_TAGS: "aws_account_tags",
      HOMEPAGE_URL: "aws_homepage_url",
      SIGNIN_CONFIRM_ROLE_KEYWORDS: "aws_signin_role_keywords",
      SIGNIN_CONFIRM_TYPE_IDS: "aws_signin_type_ids",
      WELCOME_SEEN: "hop_welcome_seen",
      START_VIEW: "aws_start_view",
      ASSUME_PROFILES: "aws_assume_profiles",
      JUMP_RECENTS: "aws_jump_recents",
      JUMP_PINNED: "aws_jump_pinned",
    },
    TAB_GROUP_MODES: ["role", "org", "off", "custom"],
    TAB_GROUP_MODE_LABELS: { role: "By role", org: "By org", off: "Off", custom: "Custom tag" },
    DEFAULT_RECENT_LIMIT: 10,
    // Each entry: { id, label, color, patterns:[] }. `id` is a stable internal
    // key used in DOM data-attrs and signed-in-confirm references; `label` is
    // the visible text on the filter button; `color` paints the button border,
    // the role-row left-stripe, and (for envs) the console favicon.
    DEFAULT_ENV_PATTERNS: [
      { id: "prod", label: "PROD", color: "#dc3545", patterns: ["prod", "production"] },
      { id: "test", label: "TEST", color: "#ffc107", patterns: ["test", "staging"] },
      { id: "dev",  label: "DEV",  color: "#28a745", patterns: ["dev", "development"] },
    ],
    // Generic placeholders. Users renames them to match their actual orgs,
    // or hits "Reset to Defaults" to start from these again.
    DEFAULT_ORG_PATTERNS: [
      { id: "org-a", label: "Org A", color: "#0073bb", patterns: [] },
      { id: "org-b", label: "Org B", color: "#6610f2", patterns: [] },
      { id: "org-c", label: "Org C", color: "#17a2b8", patterns: [] },
    ],
    // AWS Landing Zone / Control Tower style defaults. Patterns are
    // intentionally generic and overridable; works for many real orgs as-is.
    DEFAULT_TYPE_PATTERNS: [
      { id: "management", label: "Management", color: "#dc3545", patterns: ["management", "master", "payer"] },
      { id: "security",   label: "Security",   color: "#dc3545", patterns: ["security", "audit"] },
      { id: "logging",    label: "Logging",    color: "#dc3545", patterns: ["log", "logging", "logarchive"] },
      { id: "network",    label: "Network",    color: "#6c757d", patterns: ["network", "transit"] },
    ],
    // Common AWS role conventions. Pattern is the lower-cased keyword.
    DEFAULT_ROLE_PATTERNS: [
      { id: "admin",     label: "Admin",     color: "#dc3545", patterns: ["admin"] },
      { id: "poweruser", label: "PowerUser", color: "#0073bb", patterns: ["poweruser", "power-user"] },
      { id: "readonly",  label: "ReadOnly",  color: "#28a745", patterns: ["readonly", "read-only", "viewonly"] },
    ],
    // Sign-in confirmation triggers ship as 'admin' role-name keyword only.
    // Account-type IDs to flag are configured in General Settings; empty by
    // default because no account types ship.
    DEFAULT_SIGNIN_CONFIRM_ROLE_KEYWORDS: ["admin"],
    DEFAULT_SIGNIN_CONFIRM_TYPE_IDS: [],
    // Service paths now include a {region} placeholder; replaced at render
    // time with the configured AWS region.
    DEFAULT_SERVICES: [
      { id: "cloudwatch",     name: "CloudWatch",     path: "cloudwatch/home?region={region}" },
      { id: "s3",             name: "S3",             path: "s3/home?region={region}" },
      { id: "ec2",            name: "EC2",            path: "ec2/home?region={region}" },
      { id: "iam",            name: "IAM",            path: "iam/home" },
      { id: "lambda",         name: "Lambda",         path: "lambda/home?region={region}" },
      { id: "cloudformation", name: "CloudFormation", path: "cloudformation/home?region={region}" },
      { id: "vpc",            name: "VPC",            path: "vpcconsole/home?region={region}" },
      { id: "rds",            name: "RDS",            path: "rds/home?region={region}" },
    ],
    // The AWS regions that are ENABLED BY DEFAULT in every account (no opt-in
    // required), so a sign-in to any of them works out of the box. Frankfurt
    // first; the *default selection* is the General Settings region. Opt-in
    // regions (Zurich, Milan, Spain, Cape Town, Hong Kong, Hyderabad, Jakarta,
    // Melbourne, Malaysia, Calgary, Mexico, UAE, Bahrain, Tel Aviv, …) are
    // omitted — a sign-in to a region an account hasn't enabled would fail; add
    // the ones your org uses via Regions. GovCloud/China are also out
    // (different console domains).
    DEFAULT_REGION_LIST: [
      { id: "eu-central-1", label: "Europe (Frankfurt)" },
      { id: "eu-west-1", label: "Europe (Ireland)" },
      { id: "eu-west-2", label: "Europe (London)" },
      { id: "eu-west-3", label: "Europe (Paris)" },
      { id: "eu-north-1", label: "Europe (Stockholm)" },
      { id: "us-east-1", label: "US East (N. Virginia)" },
      { id: "us-east-2", label: "US East (Ohio)" },
      { id: "us-west-1", label: "US West (N. California)" },
      { id: "us-west-2", label: "US West (Oregon)" },
      { id: "ca-central-1", label: "Canada (Central)" },
      { id: "sa-east-1", label: "South America (São Paulo)" },
      { id: "ap-south-1", label: "Asia Pacific (Mumbai)" },
      { id: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
      { id: "ap-northeast-2", label: "Asia Pacific (Seoul)" },
      { id: "ap-northeast-3", label: "Asia Pacific (Osaka)" },
      { id: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
      { id: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
    ],
    THEMES: {
      light: { name: "Light", icon: "☀️", next: "dark" },
      dark: { name: "Dark", icon: "🌙", next: "auto" },
      auto: { name: "System", icon: "🖥️", next: "light" },
    },
    SELECTORS: {
      SAML_FORM: "#saml_form",
      SAML_ROLES: ".saml-role",
      SAML_RESPONSE: 'input[name="SAMLResponse"]',
      SIGNIN_BUTTON: "#signin_button",
      RADIO_BUTTONS: 'input[type="radio"]',
      THEME_TOGGLE: "#tm_theme_toggle",
      COMPACT_TOGGLE: "#tm_compact_toggle",
      SIGNIN_TAB_TOGGLE: "#tm_signin_tab_toggle",
      SEARCH_INPUT: "#tm_search_input",
      FAVORITE_BUTTONS: ".tm_favorite_button",
      FILTER_BUTTONS: ".tm_filter_button",
      SHORTCUTS_SECTION: ".tm_shortcuts_section .tm_button_group",
      CUSTOM_SHORTCUTS: ".tm_custom_shortcut",
    },
  };

  // === UTILITY FUNCTIONS ===
  // Verbose logging is opt-in: flip DEBUG to true during development. With it
  // false the minified production build folds `if (DEBUG)` away, so these calls
  // never reach a user's console. Genuine problems still use console.warn /
  // console.error directly so they remain visible for bug reports.
  const DEBUG = false;
  const debug = (...args) => {
    if (DEBUG) console.log("[hop]", ...args);
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const safeStorageOperation = async (operation, fallback = null) => {
    try {
      return await operation();
    } catch (error) {
      console.error("Storage operation failed:", error);
      return fallback;
    }
  };

  // === CACHED DOM SELECTORS ===
  let $cachedElements = {};

  const getCachedElement = (selector) => {
    if (!$cachedElements[selector]) {
      $cachedElements[selector] = $(selector);
    }
    return $cachedElements[selector];
  };

  const refreshCachedElements = () => {
    $cachedElements = {};
  };

  // Wait for jQuery to be ready
  await new Promise((resolve) => {
    if (typeof $ !== "undefined") {
      $(document).ready(resolve);
    } else {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    }
  });

  debug(`Console Hopper v${CONFIG.SCRIPT_VERSION}`);

  // Global filter state. FILTER_GROUPS is the canonical list of filter groups;
  // emptyFilters/cloneFilters build the {group: string[]} shape everywhere it's
  // needed (capture, apply, start-view chips) so the group list lives in one
  // place. cloneFilters(src, true) also drops non-strings (restoring saved data).
  const FILTER_GROUPS = ["org", "env", "type", "role", "show", "tag"];
  const emptyFilters = () =>
    FILTER_GROUPS.reduce((o, g) => { o[g] = []; return o; }, {});
  const cloneFilters = (src, sanitize) => {
    const f = src || {};
    return FILTER_GROUPS.reduce((o, g) => {
      const arr = Array.isArray(f[g]) ? f[g] : [];
      o[g] = sanitize ? arr.filter((s) => typeof s === "string") : [...arr];
      return o;
    }, {});
  };
  // Deep-equal two {search, filters} views — used to light up the shortcut chip
  // and Start-View chip that match the current/saved view.
  const viewsEqual = (a, b) => {
    if (!a || !b) return false;
    if (String(a.search || "") !== String(b.search || "")) return false;
    const fa = a.filters || {}, fb = b.filters || {};
    return FILTER_GROUPS.every((g) => {
      const x = [...(Array.isArray(fa[g]) ? fa[g] : [])].sort();
      const y = [...(Array.isArray(fb[g]) ? fb[g] : [])].sort();
      return x.length === y.length && x.every((v, i) => v === y[i]);
    });
  };
  let activeFilters = emptyFilters();
  let searchTerm = "";
  // Reflects applyFilters' visible-row count so the search "N matches" readout
  // doesn't re-scan the DOM (see updateSearchMatchCount).
  let lastVisibleCount = 0;
  // Autocomplete keyboard state: which suggestion chip is highlighted (-1 = none)
  // and the values currently shown, so Alt/Option+↑↓ + Enter can act on them.
  let searchSuggestHighlight = -1;
  let searchSuggestItems = [];
  // One physical key (Option on Mac, Alt on Windows/Linux) — e.altKey is true for
  // both, so only the *label* differs. Chromium exposes userAgentData.platform.
  const IS_MAC = /mac/i.test(
    (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ""
  );

  // Cache favorites list for performance
  let favoritesCache = [];

  // Cache custom shortcuts for performance
  let customShortcutsCache = [];

  // Configurable filter rows, each cached as an ordered array of
  // { id, label, color, patterns:[] } entries. Edited via the corresponding
  // side-menu config modal; rendered into the toolbar by renderFilterRow.
  let envPatternsCache = [];
  let orgPatternsCache = [];
  let typePatternsCache = [];
  let rolePatternsCache = [];
  // General settings (region, homepage, sensitive-sign-in triggers).
  let awsRegionCache = "us-east-1";
  let homepageUrlCache = "";
  let signinConfirmRoleKeywordsCache = ["admin"];
  let signinConfirmTypeIdsCache = [];
  // Recently signed-in roles (newest first); max length controlled by recentLimit.
  let recentRolesCache = [];
  let recentLimit = 10;
  // User-defined role order (array of roleArns) for drag-and-drop layout.
  // Roles present in this array are placed first in this order; everything
  // else falls to the bottom in its original DOM order.
  let roleOrderCache = [];
  // Optional override for tab-group naming. When non-empty, every Sign In
  // from now on tags its console tab into a group named after this value
  // instead of the default account/role grouping.
  let tabGroupTagCache = "";
  // The inline "Tabs:" grouping choice: "role" | "org" | "off" | "custom".
  // "custom" means group by the tag below (empty tag → no group).
  let tabGroupModeCache = "role";

  // Compact mode setting
  let compactMode = false;
  let signinNewTab = false;

  let currentTheme = "light";

  // === HELPER FUNCTIONS ===
  const showToast = (
    message,
    type = "info",
    duration = CONFIG.TOAST_DURATION
  ) => {
    const toast = $(
      `<div class="tm_toast ${type}">${sanitizeInput(message)}</div>`
    );
    $("body").append(toast);
    setTimeout(() => toast.fadeOut(500, () => toast.remove()), duration);
  };

  const copyTextToClipboard = async (text) => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Clipboard operation failed:", err);
      return false;
    }
  };

  // === PATTERN-ENTRY HELPERS ===
  // Normalises a label to a stable id (lowercase, alphanumeric + dashes).
  // Used when adding a new entry from the modal — the id is what's stored
  // in chrome.storage and rendered as the data-filter attribute.
  const slugifyId = (raw) => {
    const s = (raw || "").toString().toLowerCase().trim();
    const cleaned = s
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return cleaned || `entry-${Math.floor(Math.random() * 1e6).toString(36)}`;
  };

  // Ensures an entry id is unique within an existing list of ids. Appends
  // -2, -3, … until it finds a free slot.
  const uniqueId = (proposed, existingIds) => {
    const taken = new Set(existingIds);
    if (!taken.has(proposed)) return proposed;
    let i = 2;
    while (taken.has(`${proposed}-${i}`)) i++;
    return `${proposed}-${i}`;
  };

  // Coerce arbitrary stored value into the canonical
  //   [{ id, label, color, patterns:[] }, ...]
  // shape. Accepts both the new array shape and the legacy
  //   { [key]: [patterns] }
  // object shape, migrating the latter using `defaults` for label/color hints
  // where the legacy key matches a known default id.
  const PATTERN_DEFAULT_PALETTE = [
    "#0073bb", "#6c757d", "#17a2b8", "#28a745",
    "#ffc107", "#dc3545", "#6610f2", "#e83e8c",
  ];
  const normalizePatternList = (raw, defaults) => {
    const safeDefaults = Array.isArray(defaults) ? defaults : [];
    const defaultById = Object.create(null);
    safeDefaults.forEach((d) => { defaultById[d.id] = d; });
    const fallbackColor = (i) =>
      PATTERN_DEFAULT_PALETTE[i % PATTERN_DEFAULT_PALETTE.length];

    if (Array.isArray(raw)) {
      return raw
        .filter((e) => e && typeof e === "object")
        .map((e, i) => {
          const id = (e.id || slugifyId(e.label) || `entry-${i}`).toString();
          const label = (e.label || id).toString();
          const color = (e.color && /^#[0-9a-fA-F]{3,8}$/.test(e.color))
            ? e.color
            : (defaultById[id] && defaultById[id].color) || fallbackColor(i);
          const patterns = Array.isArray(e.patterns)
            ? e.patterns.map((p) => (p || "").toString().trim()).filter(Boolean)
            : [];
          return { id, label, color, patterns };
        });
    }
    if (raw && typeof raw === "object") {
      // Legacy {key: [patterns]} object shape.
      return Object.keys(raw).map((key, i) => {
        const d = defaultById[key];
        return {
          id: key,
          label: (d && d.label) || key.toString().toUpperCase(),
          color: (d && d.color) || fallbackColor(i),
          patterns: Array.isArray(raw[key])
            ? raw[key].map((p) => (p || "").toString().trim()).filter(Boolean)
            : [],
        };
      });
    }
    return [];
  };

  // === STORAGE MANAGERS (Chrome Extension API) ===
  const StorageManager = {
    async getTheme() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.THEME);
        return result[CONFIG.STORAGE_KEYS.THEME] ?? "light";
      }, "light");
    },

    async saveTheme(theme) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.THEME]: theme });
        return true;
      }, false);
    },

    async getFavorites() {
      const favorites = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.FAVORITES);
        return result[CONFIG.STORAGE_KEYS.FAVORITES] ?? "[]";
      }, "[]");
      try {
        const parsed = typeof favorites === "string" ? JSON.parse(favorites) : favorites;
        // Corrupted/hand-edited storage might return e.g. a number; guard
        // downstream callers that assume array semantics.
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Error parsing favorites:", e);
        return [];
      }
    },

    async saveFavorites(favorites) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.FAVORITES]: JSON.stringify(favorites)
        });
        return true;
      }, false);
    },

    async getCustomShortcuts() {
      const shortcuts = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SHORTCUTS);
        return result[CONFIG.STORAGE_KEYS.SHORTCUTS] ?? "[]";
      }, "[]");
      try {
        const parsed = typeof shortcuts === "string" ? JSON.parse(shortcuts) : shortcuts;
        // Drop any entry without the expected {label, search} shape — guards
        // downstream HTML rendering against corrupted storage.
        return Array.isArray(parsed)
          ? parsed.filter((s) => s && typeof s === "object" && typeof s.label === "string" && typeof s.search === "string")
          : [];
      } catch (e) {
        console.error("Error parsing shortcuts:", e);
        return [];
      }
    },

    async saveCustomShortcuts(shortcuts) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.SHORTCUTS]: JSON.stringify(shortcuts)
        });
        return true;
      }, false);
    },

    async getCompactMode() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.COMPACT_MODE);
        return result[CONFIG.STORAGE_KEYS.COMPACT_MODE] ?? false;
      }, false);
    },

    async saveCompactMode(compact) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.COMPACT_MODE]: compact });
        return true;
      }, false);
    },

    async getSigninNewTab() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SIGNIN_NEW_TAB);
        return result[CONFIG.STORAGE_KEYS.SIGNIN_NEW_TAB] ?? false;
      }, false);
    },

    async saveSigninNewTab(value) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.SIGNIN_NEW_TAB]: value });
        return true;
      }, false);
    },

    async getServices() {
      const services = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SERVICES);
        return result[CONFIG.STORAGE_KEYS.SERVICES] ?? null;
      }, null);
      if (!services) {
        return [...CONFIG.DEFAULT_SERVICES];
      }
      try {
        return typeof services === "string" ? JSON.parse(services) : services;
      } catch (e) {
        console.error("Error parsing services:", e);
        return [...CONFIG.DEFAULT_SERVICES];
      }
    },

    async saveServices(services) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.SERVICES]: JSON.stringify(services)
        });
        return true;
      }, false);
    },

    async _getPatternList(key, defaults) {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(key);
        return result[key] ?? null;
      }, null);
      if (raw == null) {
        return JSON.parse(JSON.stringify(defaults));
      }
      let parsed = raw;
      if (typeof raw === "string") {
        try { parsed = JSON.parse(raw); } catch (e) {
          console.error(`Error parsing ${key}:`, e);
          return JSON.parse(JSON.stringify(defaults));
        }
      }
      return normalizePatternList(parsed, defaults);
    },

    async _savePatternList(key, entries) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [key]: JSON.stringify(entries) });
        return true;
      }, false);
    },

    getEnvPatterns()  { return this._getPatternList(CONFIG.STORAGE_KEYS.ENV_PATTERNS,  CONFIG.DEFAULT_ENV_PATTERNS); },
    saveEnvPatterns(e){ return this._savePatternList(CONFIG.STORAGE_KEYS.ENV_PATTERNS,  e); },
    getOrgPatterns()  { return this._getPatternList(CONFIG.STORAGE_KEYS.ORG_PATTERNS,  CONFIG.DEFAULT_ORG_PATTERNS); },
    saveOrgPatterns(e){ return this._savePatternList(CONFIG.STORAGE_KEYS.ORG_PATTERNS,  e); },
    getTypePatterns() { return this._getPatternList(CONFIG.STORAGE_KEYS.TYPE_PATTERNS, CONFIG.DEFAULT_TYPE_PATTERNS); },
    saveTypePatterns(e){ return this._savePatternList(CONFIG.STORAGE_KEYS.TYPE_PATTERNS, e); },
    getRolePatterns() { return this._getPatternList(CONFIG.STORAGE_KEYS.ROLE_PATTERNS, CONFIG.DEFAULT_ROLE_PATTERNS); },
    saveRolePatterns(e){ return this._savePatternList(CONFIG.STORAGE_KEYS.ROLE_PATTERNS, e); },

    async getAwsRegion() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.AWS_REGION);
        const v = result[CONFIG.STORAGE_KEYS.AWS_REGION];
        return (typeof v === "string" && v.trim()) ? v.trim() : CONFIG.DEFAULT_AWS_REGION;
      }, CONFIG.DEFAULT_AWS_REGION);
    },
    async saveAwsRegion(region) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.AWS_REGION]: region });
        return true;
      }, false);
    },

    async getRegionList() {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.REGION_LIST);
        return result[CONFIG.STORAGE_KEYS.REGION_LIST] ?? null;
      }, null);
      let parsed = raw;
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          console.error("Error parsing region list:", e);
          parsed = null;
        }
      }
      const list = normalizeRegionList(parsed);
      return list.length ? list : normalizeRegionList(CONFIG.DEFAULT_REGION_LIST);
    },
    async getAssumeProfiles() {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.ASSUME_PROFILES);
        return result[CONFIG.STORAGE_KEYS.ASSUME_PROFILES] ?? null;
      }, null);
      let parsed = raw;
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          console.error("Error parsing assume profiles:", e);
          parsed = null;
        }
      }
      return normalizeAssumeProfiles(parsed);
    },
    async saveAssumeProfiles(list) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.ASSUME_PROFILES]: JSON.stringify(list),
        });
        return true;
      }, false);
    },
    async getJumpRecents() {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.JUMP_RECENTS);
        return result[CONFIG.STORAGE_KEYS.JUMP_RECENTS] ?? null;
      }, null);
      let parsed = raw;
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          parsed = null;
        }
      }
      return normalizeJumpRecents(parsed);
    },
    async saveJumpRecents(list) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.JUMP_RECENTS]: JSON.stringify(list),
        });
        return true;
      }, false);
    },
    async getJumpPinned() {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.JUMP_PINNED);
        return result[CONFIG.STORAGE_KEYS.JUMP_PINNED] ?? null;
      }, null);
      let parsed = raw;
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          parsed = null;
        }
      }
      // Pinned jumps are user-curated, so they get a larger cap than recents.
      return normalizeJumpRecents(parsed, 12);
    },
    async saveJumpPinned(list) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.JUMP_PINNED]: JSON.stringify(list),
        });
        return true;
      }, false);
    },
    async saveRegionList(list) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.REGION_LIST]: JSON.stringify(list),
        });
        return true;
      }, false);
    },

    async getAccountNames() {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.ACCOUNT_NAMES);
        return result[CONFIG.STORAGE_KEYS.ACCOUNT_NAMES] ?? null;
      }, null);
      return normalizeAccountNames(raw);
    },
    async saveAccountNames(map) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.ACCOUNT_NAMES]: map });
        return true;
      }, false);
    },

    async getAccountTags() {
      const raw = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.ACCOUNT_TAGS);
        return result[CONFIG.STORAGE_KEYS.ACCOUNT_TAGS] ?? null;
      }, null);
      return normalizeAccountTags(raw);
    },
    async saveAccountTags(map) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.ACCOUNT_TAGS]: map });
        return true;
      }, false);
    },

    async getHomepageUrl() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.HOMEPAGE_URL);
        const v = result[CONFIG.STORAGE_KEYS.HOMEPAGE_URL];
        return typeof v === "string" ? v : CONFIG.SCRIPT_HOMEPAGE_DEFAULT;
      }, CONFIG.SCRIPT_HOMEPAGE_DEFAULT);
    },
    async saveHomepageUrl(url) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.HOMEPAGE_URL]: url });
        return true;
      }, false);
    },

    async getSigninConfirmRoleKeywords() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS);
        const v = result[CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS];
        if (Array.isArray(v)) return v.map((s) => (s || "").toString().trim()).filter(Boolean);
        if (typeof v === "string") {
          try {
            const p = JSON.parse(v);
            if (Array.isArray(p)) return p.map((s) => (s || "").toString().trim()).filter(Boolean);
          } catch (e) { /* ignore */ }
        }
        return [...CONFIG.DEFAULT_SIGNIN_CONFIRM_ROLE_KEYWORDS];
      }, [...CONFIG.DEFAULT_SIGNIN_CONFIRM_ROLE_KEYWORDS]);
    },
    async saveSigninConfirmRoleKeywords(list) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS]: JSON.stringify(list),
        });
        return true;
      }, false);
    },

    async getSigninConfirmTypeIds() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS);
        const v = result[CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS];
        if (Array.isArray(v)) return v.map((s) => (s || "").toString().trim()).filter(Boolean);
        if (typeof v === "string") {
          try {
            const p = JSON.parse(v);
            if (Array.isArray(p)) return p.map((s) => (s || "").toString().trim()).filter(Boolean);
          } catch (e) { /* ignore */ }
        }
        return [...CONFIG.DEFAULT_SIGNIN_CONFIRM_TYPE_IDS];
      }, [...CONFIG.DEFAULT_SIGNIN_CONFIRM_TYPE_IDS]);
    },
    async saveSigninConfirmTypeIds(list) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS]: JSON.stringify(list),
        });
        return true;
      }, false);
    },

    async getWelcomeSeen() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.WELCOME_SEEN);
        return result[CONFIG.STORAGE_KEYS.WELCOME_SEEN] === true;
      }, false);
    },
    async saveWelcomeSeen(seen) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.WELCOME_SEEN]: !!seen });
        return true;
      }, false);
    },

    async getRecentRoles() {
      const value = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.RECENT_ROLES);
        return result[CONFIG.STORAGE_KEYS.RECENT_ROLES] ?? "[]";
      }, "[]");
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Error parsing recent roles:", e);
        return [];
      }
    },

    async saveRecentRoles(recents) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.RECENT_ROLES]: JSON.stringify(recents)
        });
        return true;
      }, false);
    },

    async getRecentLimit() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.RECENT_LIMIT);
        const v = result[CONFIG.STORAGE_KEYS.RECENT_LIMIT];
        if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
          return CONFIG.DEFAULT_RECENT_LIMIT;
        }
        // Clamp to the same bounds as setLimit so a corrupted value can't
        // inflate writes to absurd sizes.
        return Math.min(Math.max(1, Math.floor(v)), 100);
      }, CONFIG.DEFAULT_RECENT_LIMIT);
    },

    async saveRecentLimit(limit) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.RECENT_LIMIT]: limit
        });
        return true;
      }, false);
    },

    async getRoleOrder() {
      const value = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.ROLE_ORDER);
        return result[CONFIG.STORAGE_KEYS.ROLE_ORDER] ?? "[]";
      }, "[]");
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Error parsing role order:", e);
        return [];
      }
    },

    async saveRoleOrder(order) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.ROLE_ORDER]: JSON.stringify(order)
        });
        return true;
      }, false);
    },

    async getTabGroupTag() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.TAB_GROUP_TAG);
        return result[CONFIG.STORAGE_KEYS.TAB_GROUP_TAG] ?? "";
      }, "");
    },

    async saveTabGroupTag(tag) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.TAB_GROUP_TAG]: tag
        });
        return true;
      }, false);
    },

    async getStartView() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.START_VIEW);
        return result[CONFIG.STORAGE_KEYS.START_VIEW] ?? null;
      }, null);
    },

    async saveStartView(view) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.START_VIEW]: view });
        return true;
      }, false);
    },

    async clearStartView() {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.remove(CONFIG.STORAGE_KEYS.START_VIEW);
        return true;
      }, false);
    },

    async getTabGroupMode() {
      return await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.TAB_GROUP_MODE);
        const v = result[CONFIG.STORAGE_KEYS.TAB_GROUP_MODE];
        return CONFIG.TAB_GROUP_MODES.includes(v) ? v : "role";
      }, "role");
    },

    async saveTabGroupMode(mode) {
      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.TAB_GROUP_MODE]: mode
        });
        return true;
      }, false);
    },

    async getLastService(roleArn) {
      const lastServices = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LAST_SERVICE);
        return result[CONFIG.STORAGE_KEYS.LAST_SERVICE] ?? {};
      }, {});
      return typeof lastServices === "object" ? (lastServices[roleArn] || "") : "";
    },

    async saveLastService(roleArn, servicePath) {
      const lastServices = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LAST_SERVICE);
        return result[CONFIG.STORAGE_KEYS.LAST_SERVICE] ?? {};
      }, {});

      const updated = typeof lastServices === "object" ? lastServices : {};
      updated[roleArn] = servicePath;

      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.LAST_SERVICE]: updated
        });
        return true;
      }, false);
    },

    async saveLastRegion(roleArn, region) {
      const lastRegions = await safeStorageOperation(async () => {
        const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LAST_REGION);
        return result[CONFIG.STORAGE_KEYS.LAST_REGION] ?? {};
      }, {});

      const updated = typeof lastRegions === "object" ? lastRegions : {};
      updated[roleArn] = region;

      return await safeStorageOperation(async () => {
        await chrome.storage.local.set({
          [CONFIG.STORAGE_KEYS.LAST_REGION]: updated
        });
        return true;
      }, false);
    },
  };

  // === THEME MANAGEMENT ===
  const ThemeManager = {
    detectSystemTheme() {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
      return "light";
    },

    getEffectiveTheme(theme = currentTheme) {
      return theme === "auto" ? this.detectSystemTheme() : theme;
    },

    // notify=true → show the "Theme: X" toast. Default false so initial
    // load and silent system-theme transitions don't spam toasts; the
    // user-initiated toggleTheme path passes true explicitly.
    async applyTheme(theme, { notify = false } = {}) {
      const effectiveTheme = this.getEffectiveTheme(theme);
      $("body").removeClass("tm_theme_light tm_theme_dark");
      $("body").addClass(`tm_theme_${effectiveTheme}`);

      const themeConfig = CONFIG.THEMES[theme];
      if (themeConfig) {
        getCachedElement(CONFIG.SELECTORS.THEME_TOGGLE).text(
          `Theme: ${themeConfig.name}`
        );
        if (notify) {
          showToast(
            `Theme: ${themeConfig.name}`,
            "info",
            CONFIG.TOAST_DURATION_SHORT
          );
        }
      }
    },

    async toggleTheme() {
      const nextTheme = CONFIG.THEMES[currentTheme]?.next || "light";
      currentTheme = nextTheme;
      const saved = await StorageManager.saveTheme(currentTheme);
      if (saved !== false) {
        await this.applyTheme(currentTheme, { notify: true });
      } else {
        showToast("Failed to save theme preference", "error");
      }
    },
  };

  // Modal cards use inline `background: white !important;` — that beats any
  // stylesheet rule. To theme them we rewrite the inline style directly with
  // setProperty(..., "important"), which is the only thing that wins. Light
  // theme paints original colours back, so toggling theme works mid-session.
  const DARK_MODAL_REMAP = {
    bg:        { from: ["white", "#ffffff", "#fff"], to: "#2d3748" },
    softBox:   { from: ["#f8f9fa", "#fafbfc"],       to: "#3a4252" },
    border:    { from: ["#e1e4e8", "#ccc", "#adb5bd"], to: "#4a5568" },
    text:      { from: ["#16191f", "#000", "#212529"], to: "#e9ecef" },
    muted:     { from: ["#6c757d", "#4a5568"],       to: "#a0aec0" },
  };

  // On first touch, snapshot the entire inline `style` attribute. Restoring
  // to light mode just re-sets that snapshot — which faithfully recovers all
  // original colours, shorthand or not.
  const captureOriginalStyle = (el) => {
    if (el.dataset.tmOrigStyle !== undefined) return;
    el.dataset.tmOrigStyle = el.getAttribute("style") || "";
  };

  const themeOneModalElement = (el, dark) => {
    const inline = (el.getAttribute("style") || "").toLowerCase();
    if (!inline) return;
    captureOriginalStyle(el);
    if (dark) {
      if (/background\s*:\s*(white|#fff|#ffffff)/.test(inline)) {
        el.style.setProperty("background", DARK_MODAL_REMAP.bg.to, "important");
      } else if (/background\s*:\s*#f8f9fa|background\s*:\s*#fafbfc/.test(inline)) {
        el.style.setProperty("background", DARK_MODAL_REMAP.softBox.to, "important");
      }
      if (/color\s*:\s*#16191f|color\s*:\s*#000\b|color\s*:\s*#212529/.test(inline)) {
        el.style.setProperty("color", DARK_MODAL_REMAP.text.to, "important");
      } else if (/color\s*:\s*#6c757d/.test(inline)) {
        el.style.setProperty("color", DARK_MODAL_REMAP.muted.to, "important");
      }
      if (/border\s*:\s*1px solid #e1e4e8|border\s*:\s*1px solid #ccc|border-color\s*:\s*#e1e4e8|border-color\s*:\s*#ccc/.test(inline)) {
        el.style.setProperty("border-color", DARK_MODAL_REMAP.border.to, "important");
      }
    } else {
      // Light: restore the captured inline style verbatim.
      el.setAttribute("style", el.dataset.tmOrigStyle || "");
    }
  };

  const themeModalElements = (modalEl) => {
    if (!modalEl || !modalEl.querySelectorAll) return;
    const dark = document.body.classList.contains("tm_theme_dark");
    themeOneModalElement(modalEl, dark);
    modalEl.querySelectorAll("*").forEach((el) => themeOneModalElement(el, dark));
  };

  // Watch for modals (and content added INTO modals) so re-rendered rows in
  // a manage modal pick up the dark-theme remap immediately. We use a single
  // subtree-wide observer rather than one observer per modal; the per-node
  // closest-ancestor check keeps mutation processing scoped to modal nodes.
  const modalObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        // Whole modal added at the body level.
        if (node.id && /_modal$/.test(node.id)) {
          themeModalElements(node);
          continue;
        }
        // Element added inside an already-open modal.
        const ancestorModal = node.closest && node.closest('[id$="_modal"]');
        if (ancestorModal) themeModalElements(node);
      }
    }
  });

  // Re-theme any currently-open modals when the theme toggle is hit.
  const reThemeOpenModals = () => {
    document.querySelectorAll('[id$="_modal"]').forEach(themeModalElements);
  };
  const _origApplyTheme = ThemeManager.applyTheme.bind(ThemeManager);
  ThemeManager.applyTheme = async function (theme, opts) {
    await _origApplyTheme(theme, opts);
    reThemeOpenModals();
  };

  // === FAVORITES MANAGEMENT ===
  const FavoritesManager = {
    async loadCache() {
      debug("Loading favorites into cache...");
      favoritesCache = await StorageManager.getFavorites();
      debug("Favorites cache loaded:", favoritesCache);
    },

    async saveFavorites(favorites) {
      const saved = await StorageManager.saveFavorites(favorites);
      if (saved !== false) {
        favoritesCache = [...favorites];
        debug("Updated favorites cache:", favoritesCache);
        return true;
      } else {
        showToast("Failed to save favorites", "error");
        return false;
      }
    },

    isFavoriteSync(roleArn) {
      return favoritesCache.includes(roleArn);
    },

    async toggleFavorite(roleArn, accountName, roleName) {
      debug(
        `toggleFavorite called: ${roleArn}, ${accountName}, ${roleName}`
      );
      const favorites = [...favoritesCache];
      const index = favorites.indexOf(roleArn);

      if (index > -1) {
        favorites.splice(index, 1);
        showToast(
          `Removed ${accountName}/${roleName} from favorites`,
          "info",
          CONFIG.TOAST_DURATION_LONG
        );
      } else {
        favorites.push(roleArn);
        showToast(
          `Added ${accountName}/${roleName} to favorites`,
          "success",
          CONFIG.TOAST_DURATION_LONG
        );
      }

      const saved = await this.saveFavorites(favorites);
      if (saved) {
        await this.updateButtons();
      }
    },

    async updateButtons() {
      debug("Updating favorite buttons...");
      debug("Current favorites cache for button update:", favoritesCache);

      getCachedElement(CONFIG.SELECTORS.FAVORITE_BUTTONS).each(function () {
        const $button = $(this);
        const roleArn = $button.data("role-arn");
        const isFav = FavoritesManager.isFavoriteSync(roleArn);

        $button
          .text(isFav ? "★" : "☆")
          .toggleClass("favorited", isFav)
          .attr("title", isFav ? "Remove from favorites" : "Add to favorites");
      });
    },
  };

  // === SHORTCUTS MANAGEMENT ===
  const ShortcutsManager = {
    async loadCache() {
      debug("Loading custom shortcuts into cache...");
      customShortcutsCache = await StorageManager.getCustomShortcuts();
      debug("Custom shortcuts cache loaded:", customShortcutsCache);
    },

    async saveShortcuts(shortcuts) {
      const saved = await StorageManager.saveCustomShortcuts(shortcuts);
      if (saved !== false) {
        customShortcutsCache = [...shortcuts];
        debug("Updated shortcuts cache:", customShortcutsCache);
        return true;
      } else {
        showToast("Failed to save shortcuts", "error");
        return false;
      }
    },

    // Label → chip id. Labels differing only in punctuation ("Prod PA" vs
    // "prod-pa") collapse to the same base, so ids are de-duped via uniqueId
    // and stored on the shortcut — otherwise both chips share one data-filter.
    idOf(label) {
      return sanitizeInput(String(label || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
    },
    uniqueId(label, taken) {
      const base = this.idOf(label) || "shortcut";
      let id = base;
      let n = 2;
      while (taken.has(id)) { id = `${base}${n}`; n += 1; }
      return id;
    },
    idFor(sc) {
      return (sc && sc.id) || this.idOf(sc && sc.label);
    },
    findByFilter(filterValue) {
      const want = String(filterValue || "");
      return customShortcutsCache.find((s) => `custom_${this.idFor(s)}` === want) || null;
    },

    generateHTML() {
      let shortcutsHTML =
        '<a href="#" class="tm_filter_button" data-group="show" data-filter="favorites">Favorites</a>' +
        '<a href="#" class="tm_filter_button" data-group="show" data-filter="recent">Recent</a>';

      customShortcutsCache.forEach((shortcut) => {
        const safeId = sanitizeInput(this.idFor(shortcut));
        const safeSearch = sanitizeInput(shortcut.search || "");
        const safeLabel = sanitizeInput(shortcut.label);
        shortcutsHTML += `<a href="#" class="tm_filter_button tm_custom_shortcut" data-group="show" data-filter="custom_${safeId}" data-search="${safeSearch}">${safeLabel}<span class="tm_shortcut_del" role="button" tabindex="-1" title="Remove shortcut" aria-label="Remove shortcut">✕</span></a>`;
      });

      return shortcutsHTML;
    },

    updateSection() {
      getCachedElement(CONFIG.SELECTORS.SHORTCUTS_SECTION).html(
        this.generateHTML()
      );
    },

    // A shortcut reads as "active" when the live view equals what it stored.
    // Derived rather than tracked, so any manual tweak de-activates it for free.
    isActive(sc) {
      return viewsEqual(sc, StartViewManager.capture());
    },
    refreshActive() {
      // capture() once, not per chip — every chip compares against the same view.
      const cur = StartViewManager.capture();
      $(CONFIG.SELECTORS.CUSTOM_SHORTCUTS).each(function () {
        const sc = ShortcutsManager.findByFilter($(this).data("filter"));
        $(this).toggleClass("active", viewsEqual(sc, cur));
      });
    },

    // Clicking a shortcut restores its whole view; clicking the active one clears.
    applyShortcut(sc) {
      if (!sc) return;
      if (this.isActive(sc)) {
        FilterManager.clearAll();
      } else {
        StartViewManager.apply({ search: sc.search || "", filters: sc.filters || {} }, false);
      }
      this.refreshActive();
    },

    // Save the current search + filter chips as a new named view.
    async addCurrent(label) {
      const name = String(label || "").trim();
      if (!name) return false;
      const cap = StartViewManager.capture();
      // A saved view must never reference another shortcut, or applying it
      // would re-enter this machinery.
      cap.filters.show = cap.filters.show.filter((s) => !String(s).startsWith("custom_"));
      const taken = new Set(customShortcutsCache.map((s) => this.idFor(s)));
      const next = [
        ...customShortcutsCache,
        { id: this.uniqueId(name, taken), label: name, search: cap.search, filters: cap.filters },
      ];
      const ok = await this.saveShortcuts(next);
      if (ok) {
        this.updateSection();
        updateFilterRowVisibility();
        this.refreshActive();
      }
      return ok;
    },

    // Remove a saved view. The current filter/search state is left untouched —
    // deleting the bookmark doesn't undo what it happened to be showing.
    async remove(sc) {
      if (!sc) return false;
      const id = this.idFor(sc);
      const next = customShortcutsCache.filter((s) => this.idFor(s) !== id);
      const ok = await this.saveShortcuts(next);
      if (ok) {
        this.updateSection();
        updateFilterRowVisibility();
        this.refreshActive();
      }
      return ok;
    },
  };

  // === COMPACT MODE MANAGEMENT ===
  const CompactManager = {
    async loadSetting() {
      compactMode = await StorageManager.getCompactMode();
      debug("Loaded compact mode:", compactMode);
    },

    async saveSetting(compact) {
      const saved = await StorageManager.saveCompactMode(compact);
      if (saved !== false) {
        compactMode = compact;
        this.apply();
        return true;
      } else {
        showToast("Failed to save compact mode", "error");
        return false;
      }
    },

    apply() {
      if (compactMode) {
        $("body").addClass("tm_compact_mode");
        debug("Applied compact mode");
      } else {
        $("body").removeClass("tm_compact_mode");
        debug("Removed compact mode");
      }
    },

    updateButton() {
      getCachedElement(CONFIG.SELECTORS.COMPACT_TOGGLE).text(
        `Compact: ${compactMode ? "On" : "Off"}`
      );
    },
  };

  // Default tab behaviour for a plain Sign In click. A modifier (⌘/Ctrl or
  // middle-click) inverts it at sign-in time, so both are always available.
  const SigninTabManager = {
    async loadSetting() {
      signinNewTab = await StorageManager.getSigninNewTab();
      debug("Loaded sign-in new-tab default:", signinNewTab);
    },
    async saveSetting(value) {
      const saved = await StorageManager.saveSigninNewTab(value);
      if (saved !== false) {
        signinNewTab = value;
        return true;
      }
      showToast("Failed to save sign-in tab setting", "error");
      return false;
    },
    updateButton() {
      getCachedElement(CONFIG.SELECTORS.SIGNIN_TAB_TOGGLE).text(
        `Sign-in: ${signinNewTab ? "New tab" : "Same tab"}`
      );
    },
  };

  // === SERVICES MANAGEMENT ===
  let servicesCache = [];
  let lastServicesCache = {};

  const ServicesManager = {
    async loadCache() {
      debug("Loading services into cache...");
      servicesCache = await StorageManager.getServices();
      debug("Services cache loaded:", servicesCache);
    },

    async loadLastServicesCache() {
      const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LAST_SERVICE);
      lastServicesCache = result[CONFIG.STORAGE_KEYS.LAST_SERVICE] ?? {};
      debug("Last services cache loaded:", lastServicesCache);
    },

    async saveServices(services) {
      const saved = await StorageManager.saveServices(services);
      if (saved !== false) {
        servicesCache = [...services];
        debug("Updated services cache:", servicesCache);
        return true;
      } else {
        showToast("Failed to save services", "error");
        return false;
      }
    },

    async saveLastService(roleArn, servicePath) {
      lastServicesCache[roleArn] = servicePath;
      await StorageManager.saveLastService(roleArn, servicePath);
    },

    getLastServiceSync(roleArn) {
      return lastServicesCache[roleArn] || "";
    },

    getServicesSync() {
      return servicesCache;
    },

    generateDropdownHTML(roleArn, accountId) {
      // Store the UNSUBSTITUTED template path in <option value>. The actual
      // region substitution happens at sign-in time in buildDestination, so
      // a per-role saved last-service stays valid when the user changes
      // their AWS region in General Settings.
      const lastService = this.getLastServiceSync(roleArn);
      const safeRoleArn   = escapeHtml(roleArn);
      const safeAccountId = escapeHtml(accountId);
      const optionsHTML = servicesCache.map(s => {
        const path = s && typeof s.path === "string" ? s.path : "";
        const name = s && typeof s.name === "string" ? s.name : "";
        const selected = path === lastService ? "selected" : "";
        return `<option value="${escapeHtml(path)}" ${selected}>${escapeHtml(name)}</option>`;
      }).join("");

      return `
        <select class="tm_service_dropdown" data-role-arn="${safeRoleArn}" data-account-id="${safeAccountId}">
          <option value="">Console only</option>
          ${optionsHTML}
        </select>
      `;
    },
  };

  // === REGIONS ===
  // regionListCache  — the regions offered in each role row's region dropdown.
  // lastRegionsCache — per-role last-picked region (roleArn -> code), mirroring
  //                    the per-role last-service memory. A row defaults to the
  //                    General Settings region until the user picks one for it.
  let regionListCache = [];
  let lastRegionsCache = {};

  const RegionsManager = {
    async loadCache() {
      regionListCache = await StorageManager.getRegionList();
      debug("Region list cache loaded:", regionListCache);
    },
    async loadLastRegionsCache() {
      const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LAST_REGION);
      lastRegionsCache = result[CONFIG.STORAGE_KEYS.LAST_REGION] ?? {};
      debug("Last regions cache loaded:", lastRegionsCache);
    },
    async saveRegions(list) {
      const saved = await StorageManager.saveRegionList(list);
      if (saved !== false) {
        regionListCache = [...list];
        return true;
      }
      showToast("Failed to save regions", "error");
      return false;
    },
    async saveLastRegion(roleArn, region) {
      lastRegionsCache[roleArn] = region;
      await StorageManager.saveLastRegion(roleArn, region);
    },
    getLastRegionSync(roleArn) {
      return lastRegionsCache[roleArn] || "";
    },
    list() {
      return regionListCache;
    },

    // The per-row region <select>: options come from the configured list (order
    // preserved); the selection is this role's last-picked region, else the
    // General Settings region. The selected region is always present even if it
    // isn't in the list, so a sign-in never targets a missing region.
    generateRegionDropdownHTML(roleArn) {
      const def = GeneralSettingsManager.region() || CONFIG.DEFAULT_AWS_REGION;
      const selected = this.getLastRegionSync(roleArn) || def;
      const list = regionListCache.slice();
      if (!list.some((r) => r.id === selected)) {
        list.unshift({ id: selected, label: selected });
      }
      const optionsHTML = list
        .map(
          (r) =>
            `<option value="${escapeHtml(r.id)}"${r.id === selected ? " selected" : ""}>${escapeHtml(r.label)}</option>`
        )
        .join("");
      return `
        <select class="tm_region_dropdown" data-role-arn="${escapeHtml(roleArn)}" title="AWS region for this sign-in">
          ${optionsHTML}
        </select>
      `;
    },
  };

  // Optional per-account display names: { accountId -> custom name }. When set,
  // the custom name fully replaces the AWS account name in the list — and since
  // filters / search / grouping / tab titles all read the displayed name, it
  // applies everywhere. Edit via Account Names.
  let assumeProfilesCache = [];
  let jumpRecentsCache = [];
  let jumpPinnedCache = [];
  let jumpPopoverOpen = false;

  const AssumeProfilesManager = {
    async loadCache() {
      assumeProfilesCache = await StorageManager.getAssumeProfiles();
      debug("Assume profiles cache loaded:", assumeProfilesCache);
    },
    async save(list) {
      const saved = await StorageManager.saveAssumeProfiles(list);
      if (saved !== false) {
        assumeProfilesCache = [...list];
        return true;
      }
      showToast("Failed to save assume profiles", "error");
      return false;
    },
    all() {
      return assumeProfilesCache;
    },
    byName(name) {
      return assumeProfilesCache.find((p) => p.name === name) || null;
    },
  };

  let accountNamesCache = {};
  let accountTagsCache = {};

  const AccountNamesManager = {
    async loadCache() {
      accountNamesCache = await StorageManager.getAccountNames();
      debug("Account names cache loaded:", accountNamesCache);
    },
    async save(map) {
      const saved = await StorageManager.saveAccountNames(map);
      if (saved !== false) {
        accountNamesCache = { ...map };
        return true;
      }
      showToast("Failed to save account names", "error");
      return false;
    },
    nameFor(id) {
      return (id && accountNamesCache[id]) || "";
    },
    all() {
      return accountNamesCache;
    },
  };

  // Account tags: free-text labels attached to an account id so it can be found
  // by concept (e.g. "palo alto"), not just by name. Keyed by account id, so a
  // tag shows on — and edits from — every role row of that account.
  const AccountTagsManager = {
    async loadCache() {
      accountTagsCache = await StorageManager.getAccountTags();
      debug("Account tags cache loaded:", accountTagsCache);
    },
    async save(map) {
      const clean = normalizeAccountTags(map);
      const saved = await StorageManager.saveAccountTags(clean);
      if (saved !== false) {
        accountTagsCache = clean;
        return true;
      }
      showToast("Failed to save account tags", "error");
      return false;
    },
    all() {
      return accountTagsCache;
    },
    tagsFor(id) {
      return (id && accountTagsCache[id]) || [];
    },
    // Unique tag vocabulary across all accounts (canonical casing), sorted —
    // powers the filter-row chips and the inline add-autocomplete.
    allTags() {
      const seen = new Map();
      for (const tags of Object.values(accountTagsCache)) {
        for (const t of tags) {
          const k = t.toLowerCase();
          if (!seen.has(k)) seen.set(k, t);
        }
      }
      return [...seen.values()].sort((a, b) => a.localeCompare(b));
    },
    // Persist a whole account's tag list (inline add/remove + bulk). Emptying it
    // drops the account key so allTags() stays clean.
    async setTags(id, tags) {
      if (!/^\d{12}$/.test(id || "")) return false;
      const clean = normalizeTagList(tags);
      const next = { ...accountTagsCache };
      if (clean.length) next[id] = clean;
      else delete next[id];
      return this.save(next);
    },
    async addTag(id, tag) {
      return this.setTags(id, [...this.tagsFor(id), tag]);
    },
    async removeTag(id, tag) {
      const low = String(tag || "").toLowerCase();
      return this.setTags(id, this.tagsFor(id).filter((t) => t.toLowerCase() !== low));
    },
  };

  // ---- Account-tag row UI (on-demand chip + inline editor) ----
  const TAG_SVG =
    '<svg class="tm_tag_ico" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">' +
    '<path d="M2 2h5.2a1 1 0 0 1 .7.3l6 6a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4 0l-6-6A1 1 0 0 1 2 7.2V2z" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
    '<circle cx="5.2" cy="5.2" r="1.1" fill="currentColor"/></svg>';

  const tagChipInner = (id) => {
    const n = AccountTagsManager.tagsFor(id).length;
    return n
      ? `${TAG_SVG}<span class="tm_tag_n">${n}</span>`
      : `<span class="tm_tag_plus">+</span>tag`;
  };

  // Chip in the account-name cell: tag glyph + count when tagged, a dashed
  // "+ tag" prompt otherwise (always shown, per the chosen design).
  const tagChipHTML = (id) => {
    if (!/^\d{12}$/.test(id || "")) return "";
    const n = AccountTagsManager.tagsFor(id).length;
    const cls = n ? "tm_tag_chip" : "tm_tag_chip tm_no_tags";
    const title = n ? `${n} tag${n === 1 ? "" : "s"} — click to edit` : "Add a tag";
    return `<button type="button" class="${cls}" data-account-id="${escapeHtml(id)}" aria-expanded="false" title="${title}">${tagChipInner(id)}</button>`;
  };

  const tagPillsHTML = (id) =>
    AccountTagsManager.tagsFor(id)
      .map((t) => {
        const e = escapeHtml(t);
        return `<span class="tm_tag_pill">${e}<button type="button" class="tm_tag_del" data-account-id="${escapeHtml(id)}" data-tag="${e}" aria-label="Remove ${e}">✕</button></span>`;
      })
      .join("");

  // Editor body revealed under an open row: removable pills + an add affordance
  // (the pills area re-renders on edit; the add area holds the button/input).
  const tagEditorHTML = (id) => {
    if (!/^\d{12}$/.test(id || "")) return "";
    return (
      `<div class="tm_tag_pills">${tagPillsHTML(id)}</div>` +
      `<div class="tm_tag_addwrap"><button type="button" class="tm_tag_add" data-account-id="${escapeHtml(id)}"><span class="tm_tag_plus">+</span> tag</button></div>`
    );
  };

  // Tags are per-account, so refresh the chip + pills on EVERY role row of the
  // account, and re-run the filter so an active tag/text search stays accurate.
  // Repaint one account-tag chip / editor-pills node in place. Shared by the
  // inline-edit path (one account) and the bulk-edit path (every account).
  const paintTagChip = (chip) => {
    const id = chip.getAttribute("data-account-id");
    chip.classList.toggle("tm_no_tags", AccountTagsManager.tagsFor(id).length === 0);
    chip.innerHTML = tagChipInner(id);
  };
  const paintTagPills = (pillsEl) => {
    const editor = pillsEl.closest(".tm_tag_editor");
    if (editor) pillsEl.innerHTML = tagPillsHTML(editor.getAttribute("data-account-id"));
  };
  const updateTagUIForAccount = (id) => {
    if (!/^\d{12}$/.test(id || "")) return;
    document.querySelectorAll(`.tm_tag_chip[data-account-id="${id}"]`).forEach(paintTagChip);
    document.querySelectorAll(`.tm_tag_editor[data-account-id="${id}"] .tm_tag_pills`).forEach(paintTagPills);
    renderTagFilterRow();
    FilterManager.applyFilters(true);
  };

  // The "Tags" toolbar row mirrors the org/env chips; its options are the whole
  // tag vocabulary in use. Re-assert active chips after each rebuild.
  const renderTagFilterRow = () => {
    renderFilterRow("tag", AccountTagsManager.allTags().map((t) => ({ id: t, label: t })));
    document.querySelectorAll('.tm_filter_button[data-group="tag"]').forEach((btn) => {
      if ((activeFilters.tag || []).includes(btn.getAttribute("data-filter"))) btn.classList.add("active");
    });
  };

  // Keep one shared datalist for add-tag autocomplete, repopulated from the
  // current vocabulary each time an input opens.
  const populateTagVocab = () => {
    let dl = document.getElementById("tm_tag_vocab");
    if (!dl) {
      dl = document.createElement("datalist");
      dl.id = "tm_tag_vocab";
      document.body.appendChild(dl);
    }
    dl.innerHTML = AccountTagsManager.allTags()
      .map((t) => `<option value="${escapeHtml(t)}"></option>`)
      .join("");
  };
  const makeTagInput = (id) => {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "tm_tag_input";
    input.setAttribute("list", "tm_tag_vocab");
    input.setAttribute("data-account-id", id);
    input.setAttribute("placeholder", "tag…");
    input.setAttribute("aria-label", "Add a tag");
    return input;
  };
  const makeTagAddButton = (id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tm_tag_add";
    b.setAttribute("data-account-id", id);
    b.innerHTML = '<span class="tm_tag_plus">+</span> tag';
    return b;
  };
  // Turn an "+ tag" button into a focused, autocompleted input (one action).
  const openTagInput = (addBtn) => {
    populateTagVocab();
    const input = makeTagInput(addBtn.getAttribute("data-account-id"));
    addBtn.replaceWith(input);
    input.focus();
    return input;
  };

  // Generic factory: each manager backs a configurable filter row in the
  // toolbar. Entries shape is [{id, label, color, patterns:[]}] (see
  // normalizePatternList). save() writes the whole list at once; lookups
  // operate over the cached array.
  const makeEntryManager = ({ cacheGet, cacheSet, storageGet, storageSave, label }) => ({
    async loadCache() {
      cacheSet(await storageGet());
      debug(`${label} cache loaded:`, cacheGet());
    },
    async save(entries) {
      const saved = await storageSave(entries);
      if (saved !== false) {
        cacheSet(entries);
        return true;
      }
      showToast(`Failed to save ${label}`, "error");
      return false;
    },
    entries() {
      return cacheGet();
    },
    findEntry(id) {
      return cacheGet().find((e) => e.id === id) || null;
    },
    matches(id, accountName, accountId) {
      const entry = this.findEntry(id);
      return entry ? matchesAnyPattern(entry.patterns, accountName, accountId) : false;
    },
  });

  // === ENVIRONMENTS MANAGEMENT ===
  // classify() returns the id of the first matching env entry, or "default".
  // Pass 1 (exact account-ID) wins across all entries so explicit user
  // overrides beat substring matches from inherited defaults.
  const EnvironmentsManager = {
    ...makeEntryManager({
      cacheGet: () => envPatternsCache,
      cacheSet: (v) => { envPatternsCache = v; },
      storageGet: () => StorageManager.getEnvPatterns(),
      storageSave: (v) => StorageManager.saveEnvPatterns(v),
      label: "environments",
    }),
    classify(accountName, accountId) {
      const name = (accountName || "").toLowerCase();
      const id = (accountId || "").toString().trim();
      const entries = envPatternsCache || [];
      if (id) {
        for (const e of entries) {
          for (const raw of (e.patterns || [])) {
            const p = (raw || "").toString().trim();
            if (p && p === id) return e.id;
          }
        }
      }
      for (const e of entries) {
        for (const raw of (e.patterns || [])) {
          const p = (raw || "").toString().trim().toLowerCase();
          if (p && name.includes(p)) return e.id;
        }
      }
      return "default";
    },
    colorFor(envId) {
      const e = (envPatternsCache || []).find((x) => x.id === envId);
      return e ? e.color : "#6c757d";
    },
    letterFor(envId) {
      const e = (envPatternsCache || []).find((x) => x.id === envId);
      const label = e && e.label ? e.label : "";
      return label ? label.charAt(0).toUpperCase() : "?";
    },
  };

  const getEnvironmentType = ($role) => {
    const accountName = $role.find(".tm_account_name").text();
    const accountId = $role.find(".tm_account_id").text();
    return EnvironmentsManager.classify(accountName, accountId);
  };

  // === ORGANIZATIONS MANAGEMENT ===
  const OrganizationsManager = {
    ...makeEntryManager({
      cacheGet: () => orgPatternsCache,
      cacheSet: (v) => { orgPatternsCache = v; },
      storageGet: () => StorageManager.getOrgPatterns(),
      storageSave: (v) => StorageManager.saveOrgPatterns(v),
      label: "organizations",
    }),
    classify(accountName, accountId) {
      for (const e of (orgPatternsCache || [])) {
        if (matchesAnyPattern(e.patterns, accountName, accountId)) return e.id;
      }
      return "";
    },
  };

  // === ACCOUNT TYPES MANAGEMENT ===
  const AccountTypesManager = makeEntryManager({
    cacheGet: () => typePatternsCache,
    cacheSet: (v) => { typePatternsCache = v; },
    storageGet: () => StorageManager.getTypePatterns(),
    storageSave: (v) => StorageManager.saveTypePatterns(v),
    label: "account types",
  });

  // === ROLE-NAME FILTER MANAGEMENT ===
  // Same entry shape as the other managers, but patterns are matched against
  // the role name only (not account name/id).
  const RolesManager = {
    ...makeEntryManager({
      cacheGet: () => rolePatternsCache,
      cacheSet: (v) => { rolePatternsCache = v; },
      storageGet: () => StorageManager.getRolePatterns(),
      storageSave: (v) => StorageManager.saveRolePatterns(v),
      label: "role names",
    }),
    matches(id, roleName) {
      const entry = this.findEntry(id);
      return entry ? matchesRolePatterns(entry.patterns, roleName) : false;
    },
  };

  // === GENERAL SETTINGS (region / homepage / sensitive sign-in) ===
  const GeneralSettingsManager = {
    async loadCache() {
      awsRegionCache = await StorageManager.getAwsRegion();
      homepageUrlCache = await StorageManager.getHomepageUrl();
      signinConfirmRoleKeywordsCache = await StorageManager.getSigninConfirmRoleKeywords();
      signinConfirmTypeIdsCache = await StorageManager.getSigninConfirmTypeIds();
      debug("General settings cache loaded:", {
        region: awsRegionCache,
        homepage: homepageUrlCache,
        signinRoleKeywords: signinConfirmRoleKeywordsCache,
        signinTypeIds: signinConfirmTypeIdsCache,
      });
    },
    region()              { return awsRegionCache; },
    homepage()            { return homepageUrlCache; },
    signinRoleKeywords()  { return signinConfirmRoleKeywordsCache; },
    signinTypeIds()       { return signinConfirmTypeIdsCache; },
    async save({ region, homepage, signinRoleKeywords, signinTypeIds }) {
      const r = (region || "").trim();
      awsRegionCache = r || CONFIG.DEFAULT_AWS_REGION;
      homepageUrlCache = (homepage || "").trim();
      signinConfirmRoleKeywordsCache = Array.isArray(signinRoleKeywords)
        ? signinRoleKeywords.map((s) => (s || "").trim()).filter(Boolean)
        : [];
      signinConfirmTypeIdsCache = Array.isArray(signinTypeIds)
        ? signinTypeIds.map((s) => (s || "").trim()).filter(Boolean)
        : [];
      await Promise.all([
        StorageManager.saveAwsRegion(awsRegionCache),
        StorageManager.saveHomepageUrl(homepageUrlCache),
        StorageManager.saveSigninConfirmRoleKeywords(signinConfirmRoleKeywordsCache),
        StorageManager.saveSigninConfirmTypeIds(signinConfirmTypeIdsCache),
      ]);
      return true;
    },
  };

  // === RECENT ROLES MANAGEMENT ===
  // Tracks the last N roles the user signed in to. Backs the "Recent" shortcut
  // filter so users get fast access to roles they actually use, without
  // manually starring them.
  const RecentRolesManager = {
    async loadCache() {
      recentRolesCache = await StorageManager.getRecentRoles();
      recentLimit = await StorageManager.getRecentLimit();
      debug("Recent roles cache loaded:", recentRolesCache, "limit:", recentLimit);
    },

    async recordSignIn(roleArn) {
      if (!roleArn) return;
      const now = Date.now();
      // Dedupe and prepend.
      const next = [{ roleArn, ts: now }, ...recentRolesCache.filter((r) => r.roleArn !== roleArn)];
      // Trim to current limit.
      recentRolesCache = next.slice(0, Math.max(0, recentLimit));
      await StorageManager.saveRecentRoles(recentRolesCache);
    },

    async setLimit(limit) {
      const n = parseInt(limit, 10);
      if (!Number.isFinite(n) || n < 1 || n > 100) {
        showToast("Please enter a number between 1 and 100", "error");
        return false;
      }
      recentLimit = n;
      // Trim cache to new limit if it's smaller.
      if (recentRolesCache.length > n) {
        recentRolesCache = recentRolesCache.slice(0, n);
        await StorageManager.saveRecentRoles(recentRolesCache);
      }
      await StorageManager.saveRecentLimit(n);
      return true;
    },

    isRecent(roleArn) {
      if (!roleArn) return false;
      return recentRolesCache.some((r) => r.roleArn === roleArn);
    },

    getLimit() {
      return recentLimit;
    },
  };

  // === ROLE ORDER MANAGEMENT ===
  // Stores a user-defined ordering of roleArns (built via drag-and-drop) and
  // applies it to the DOM. Roles in the saved order go first; roles not in
  // the saved order fall through to the bottom keeping their original
  // relative order. The saved order can reference roles the user no longer
  // has access to — those entries are silently ignored.
  const RoleOrderManager = {
    LIST_ID: "tm_role_list",

    async loadCache() {
      roleOrderCache = await StorageManager.getRoleOrder();
      debug("Role order cache loaded:", roleOrderCache.length, "entries");
    },

    // Move every .saml-role into a single ordered container so drag-and-drop
    // is a simple sibling-reorder problem (instead of moving rows between
    // nested .saml-account parents).
    ensureList() {
      let $list = $("#" + this.LIST_ID);
      if ($list.length === 0) {
        $list = $(`<div id="${this.LIST_ID}"></div>`);
        const $form = $("#saml_form");
        const $anchor = $form.find("#tm_interface_wrapper");
        if ($anchor.length) {
          $anchor.after($list);
        } else {
          $form.append($list);
        }
      }
      $(".saml-role").each(function () {
        if (this.parentNode !== $list[0]) $list[0].appendChild(this);
      });
      return $list;
    },

    applySavedOrder() {
      const $list = $("#" + this.LIST_ID);
      if (!$list.length || !roleOrderCache || roleOrderCache.length === 0) return;
      const indexOf = Object.create(null);
      roleOrderCache.forEach((arn, idx) => { indexOf[arn] = idx; });
      const TAIL = Number.MAX_SAFE_INTEGER;
      const rows = $list.find(".saml-role").get();
      // Stable sort: rows whose arn is in the saved order get its index;
      // unknown rows tie at TAIL and remain in original relative order.
      rows
        .map((el, i) => {
          const arn = $(el).find(".tm_signin_button").data("role-arn") || "";
          return { el, originalIdx: i, sortKey: indexOf[arn] !== undefined ? indexOf[arn] : TAIL };
        })
        .sort((a, b) => a.sortKey - b.sortKey || a.originalIdx - b.originalIdx)
        .forEach(({ el }) => $list[0].appendChild(el));
    },

    async saveCurrentOrder() {
      const order = [];
      $("#" + this.LIST_ID + " .saml-role").each(function () {
        const arn = $(this).find(".tm_signin_button").data("role-arn");
        if (arn) order.push(arn);
      });
      roleOrderCache = order;
      await StorageManager.saveRoleOrder(order);
    },
  };

  // Hide a filter row that offers fewer than two choices: a lone option can't
  // narrow the list to anything the user couldn't already see, so the whole row
  // (label included) is just clutter. If a row we hide still carries an active
  // filter — e.g. its only sibling option was just deleted — drop that filter
  // too, so nothing stays constrained by a chip no one can see. Every caller
  // re-runs applyFilters after rendering, so the visible list stays in sync.
  // (Toggled via a class, not .hide(): the row's display:flex is !important,
  // which a plain inline display:none from .hide() would not override.)
  const updateFilterRowVisibility = (group) => {
    const groups = group ? [group] : ["org", "env", "type", "role", "tag"];
    for (const g of groups) {
      const $group = $(`.tm_button_group[data-filter-group="${g}"]`);
      if (!$group.length) continue;
      const $row = $group.closest(".tm_frow");
      if (!$row.length) continue;
      // Derived classifiers (org/env/type/role) need 2+ options to be a useful
      // filter — with one value every row matches. Tags are explicit user
      // intent, so a single tag is already a meaningful filter: show it from 1.
      const minChips = g === "tag" ? 1 : 2;
      if ($group.find(".tm_filter_button").length >= minChips) {
        $row.removeClass("tm_frow_hidden");
      } else {
        $row.addClass("tm_frow_hidden");
        if (activeFilters[g] && activeFilters[g].length) {
          activeFilters[g] = [];
          $group.find(".tm_filter_button").removeClass("active");
        }
      }
    }
    // With no filter rows visible above it, the Shortcuts row's top divider
    // separates nothing — drop it so it doesn't float as a stray rule.
    const anyVisible = ["org", "env", "type", "role", "tag"].some((g) => {
      const bg = document.querySelector(`.tm_button_group[data-filter-group="${g}"]`);
      const row = bg && bg.closest(".tm_frow");
      return row && !row.classList.contains("tm_frow_hidden");
    });
    $(".tm_frow_shortcuts").toggleClass("tm_frow_bare", !anyVisible);
  };

  // Render the filter buttons for a single toolbar row from a list of
  // { id, label, color, patterns } entries. Buttons get inline CSS variable
  // --tm-fb-color so the per-entry colour shows on both idle and .active
  // states. Existing non-button children in the container are preserved.
  const renderFilterRow = (groupKey, entries) => {
    const $container = $(`.tm_button_group[data-filter-group="${groupKey}"]`);
    if (!$container.length) return;
    $container.find(".tm_filter_button").remove();
    const buttons = (entries || []).map((e) => {
      const safeLabel = escapeHtml(e.label || e.id);
      const safeId    = escapeHtml(e.id);
      const safeColor = (e.color && /^#[0-9a-fA-F]{3,8}$/.test(e.color)) ? e.color : "#adb5bd";
      return $(
        `<a href="#" class="tm_filter_button" data-group="${groupKey}" data-filter="${safeId}" data-color="1" style="--tm-fb-color: ${safeColor};">${safeLabel}</a>`
      );
    });
    if (buttons.length) {
      // Buttons go before any non-button (e.g. the tag input on types row).
      const firstNonButton = $container.children().not(".tm_filter_button").first();
      if (firstNonButton.length) {
        firstNonButton.before(buttons);
      } else {
        $container.append(buttons);
      }
    }
    refreshCachedElements();
    updateFilterRowVisibility(groupKey);
  };

  // Re-render every configurable filter row from its current cache.
  const renderAllFilterRows = () => {
    renderFilterRow("org",  OrganizationsManager.entries());
    renderFilterRow("env",  EnvironmentsManager.entries());
    renderFilterRow("type", AccountTypesManager.entries());
    renderFilterRow("role", RolesManager.entries());
    renderTagFilterRow();
  };

  // Paint each role card's left stripe with the matched env color. Inline
  // style is used because the env list is dynamic — we can't ship a static
  // CSS rule per env id. data-env-id is set so themes/CSS can still target.
  const applyEnvironmentStyling = () => {
    $(".saml-role").each(function () {
      const $role = $(this);
      const envId = getEnvironmentType($role);
      if (envId === "default") {
        $role.removeAttr("data-env-id");
        this.style.removeProperty("border-left-color");
        this.style.removeProperty("border-left-width");
        this.style.removeProperty("border-left-style");
        return;
      }
      const color = EnvironmentsManager.colorFor(envId);
      $role.attr("data-env-id", envId);
      this.style.setProperty("border-left-color", color, "important");
      this.style.setProperty("border-left-width", "4px", "important");
      this.style.setProperty("border-left-style", "solid", "important");
    });
  };

  // Fields the search box understands as `field:value` qualifiers: text fields
  // (tag/role/name/account/id) + classifier fields (env/type/org) resolved via
  // the same managers that back the filter chips.
  const KNOWN_QUERY_FIELDS = new Set([
    "tag", "tags", "role", "name", "account", "acct", "id",
    "env", "environment", "type", "org", "organization", "organisation",
  ]);
  // Parse the query once per applyFilters pass (all rows share searchTerm), and
  // note which fields it references so rows only resolve the classifiers used.
  let _queryCache = { raw: null, terms: [], used: new Set() };
  const getQuery = () => {
    if (_queryCache.raw !== searchTerm) {
      const terms = searchTerm ? parseQuery(searchTerm, KNOWN_QUERY_FIELDS) : [];
      _queryCache = {
        raw: searchTerm,
        terms,
        used: new Set(terms.map((t) => t.field).filter(Boolean)),
      };
    }
    return _queryCache;
  };

  // Saved Shortcuts run their search string through the same query engine, so a
  // Shortcut like `tag:pci -role:readonly` becomes a boolean favourite. Parsed
  // results are cached by string.
  const _shortcutQueryCache = new Map();
  const getShortcutQuery = (str) => {
    if (!_shortcutQueryCache.has(str)) {
      const terms = parseQuery(str, KNOWN_QUERY_FIELDS);
      _shortcutQueryCache.set(str, {
        terms,
        used: new Set(terms.map((t) => t.field).filter(Boolean)),
      });
    }
    return _shortcutQueryCache.get(str);
  };

  // Optimized filter matching function
  const matchesFilters = ($role) => {
    const accountName = $role.find(".tm_account_name").text().toLowerCase();
    const accountId = $role.find(".tm_account_id").text().toLowerCase();
    const roleName = $role.find(".tm_role_name").text().toLowerCase();
    // Account tags join the searchable text, so "palo alto" finds a tagged
    // account even when the name/id/role don't contain it.
    const tags = AccountTagsManager.tagsFor(accountId).join(" ").toLowerCase();
    const fullText = `${accountName} ${accountId} ${roleName} ${tags}`;
    const roleArn = $role.find(".tm_signin_button").data("role-arn");

    // Scoped search: bare words hit everything; `field:value` scopes to a field;
    // space = AND, comma = OR within a field, `-` excludes, "..." = exact.
    const query = getQuery();
    const terms = query.terms;

    // Highlight the tag chip when a positive bare/tag term matched a tag.
    const tagMatched = !!tags && terms.some((term) =>
      !term.negate &&
      (term.field === "" || term.field === "tag" || term.field === "tags") &&
      term.values.some((v) =>
        v.quoted ? tags.includes(v.text.toLowerCase()) : searchMatches(v.text, tags))
    );
    $role.find(".tm_tag_chip").toggleClass("tm_tag_matched", tagMatched);

    // Build the field map for a query, resolving classifier fields (env/type/
    // org) only for the fields actually referenced, so env:prod matches the env
    // id or its chip label. Reused by the search box and by saved Shortcuts.
    const acctBoth = `${accountName} ${accountId}`;
    const fieldsFor = (used) => {
      const qf = {
        _all: fullText, tag: tags, tags: tags, role: roleName,
        name: accountName, id: accountId, account: acctBoth, acct: acctBoth,
      };
      if (used.has("env") || used.has("environment")) {
        const detected = EnvironmentsManager.classify(accountName, accountId);
        const e = EnvironmentsManager.entries().find((x) => x.id === detected);
        qf.env = qf.environment = `${detected || ""} ${e ? e.label : ""}`.toLowerCase();
      }
      if (used.has("type")) {
        qf.type = AccountTypesManager.entries()
          .filter((t) => AccountTypesManager.matches(t.id, accountName, accountId))
          .map((t) => `${t.id} ${t.label}`).join(" ").toLowerCase();
      }
      if (used.has("org") || used.has("organization") || used.has("organisation")) {
        qf.org = qf.organization = qf.organisation = OrganizationsManager.entries()
          .filter((o) => OrganizationsManager.matches(o.id, accountName, accountId))
          .map((o) => `${o.id} ${o.label}`).join(" ").toLowerCase();
      }
      return qf;
    };

    if (terms.length && !matchesQuery(terms, fieldsFor(query.used))) {
      return false;
    }

    // Organization filters — uses user-configurable patterns via OrganizationsManager.
    if (activeFilters.org.length > 0) {
      const accountIdRaw = $role.find(".tm_account_id").text();
      const accountNameRaw = $role.find(".tm_account_name").text();
      const orgMatch = activeFilters.org.some((org) =>
        OrganizationsManager.matches(org, accountNameRaw, accountIdRaw)
      );
      if (!orgMatch) return false;
    }

    // Environment filters — use the user-configured patterns via EnvironmentsManager
    // so PROD/TEST/DEV filter buttons stay in sync with the Environments modal.
    if (activeFilters.env.length > 0) {
      const accountId = $role.find(".tm_account_id").text();
      const detected = EnvironmentsManager.classify(accountName, accountId);
      if (!activeFilters.env.includes(detected)) return false;
    }

    // Account type filters — uses user-configurable patterns via AccountTypesManager.
    if (activeFilters.type.length > 0) {
      const accountIdRaw = $role.find(".tm_account_id").text();
      const accountNameRaw = $role.find(".tm_account_name").text();
      const typeMatch = activeFilters.type.some((type) =>
        AccountTypesManager.matches(type, accountNameRaw, accountIdRaw)
      );
      if (!typeMatch) return false;
    }

    // Role name filters — configurable via Role Names. Each active
    // entry's patterns are case-insensitive substrings of the role text.
    if (activeFilters.role.length > 0) {
      const roleMatch = activeFilters.role.some((id) =>
        RolesManager.matches(id, roleName)
      );
      if (!roleMatch) return false;
    }

    // Account-tag filters — the row's account must carry at least one active tag.
    if (activeFilters.tag.length > 0) {
      const rowTags = AccountTagsManager.tagsFor(accountId);
      if (!activeFilters.tag.some((t) => rowTags.includes(t))) return false;
    }

    // Special "show" filters: built-in Favorites/Recent + any user-defined
    // search shortcut (Shortcuts) where the shortcut's `search` string
    // must appear in the role text.
    if (activeFilters.show.length > 0) {
      for (const show of activeFilters.show) {
        if (show === "favorites") {
          if (!FavoritesManager.isFavoriteSync(roleArn)) return false;
        } else if (show === "recent") {
          if (!RecentRolesManager.isRecent(roleArn)) return false;
        } else if (show.startsWith("custom_")) {
          const $button = getCachedElement(
            CONFIG.SELECTORS.CUSTOM_SHORTCUTS
          ).filter(`[data-filter="${show}"]`);
          if ($button.length > 0) {
            const sc = getShortcutQuery(String($button.data("search") || ""));
            if (sc.terms.length && !matchesQuery(sc.terms, fieldsFor(sc.used))) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return true;
  };

  // === OPTIMIZED FILTERING ===
  const FilterManager = {
    debouncedApplyFilters: debounce(() => {
      FilterManager.applyFilters();
    }, CONFIG.SEARCH_DEBOUNCE_DELAY),

    applyFilters(silent = false) {
      let visibleCount = 0;
      let totalCount = 0;

      debug("Applying filters:", activeFilters, "Search:", searchTerm);

      getCachedElement(CONFIG.SELECTORS.SAML_ROLES).each(function () {
        const $role = $(this);
        totalCount++;

        if (matchesFilters($role)) {
          $role.css("display", "").show();
          visibleCount++;
        } else {
          $role.css("display", "none").hide();
        }
      });

      debug(`Visible: ${visibleCount}, Total: ${totalCount}`);
      lastVisibleCount = visibleCount; // reused by the search "N matches" readout

      applyEnvironmentStyling();

      const filterCount = Object.values(activeFilters).flat().length;
      const hasSearch = searchTerm.length > 0;
      const filtersActive = filterCount > 0 || hasSearch;

      // Toggle a global flag so the drag-and-drop layer can refuse to start
      // a reorder while the view is filtered (avoids unintuitive ordering of
      // hidden rows).
      document.body.classList.toggle("tm_filters_active", filtersActive);

      // A saved-view chip lights up only while the live view still matches it.
      ShortcutsManager.refreshActive();

      if (filtersActive && !silent) {
        showToast(
          `Showing ${visibleCount} of ${totalCount} roles`,
          "info",
          CONFIG.TOAST_DURATION_LONG
        );
      }
    },

    clearAll() {
      activeFilters = emptyFilters();
      searchTerm = "";

      getCachedElement(CONFIG.SELECTORS.FILTER_BUTTONS).removeClass("active");
      getCachedElement(CONFIG.SELECTORS.SEARCH_INPUT).val("");

      getCachedElement(CONFIG.SELECTORS.SAML_ROLES).each(function () {
        $(this).css("display", "").show();
      });

      // Filters are off again: drop the body marker drag-and-drop watches.
      document.body.classList.remove("tm_filters_active");
      applyEnvironmentStyling();

      showToast("All filters cleared", "info", CONFIG.TOAST_DURATION_SHORT);
    },
  };

  // --- Start View: save the current filter/search selection as the view the
  // role picker opens with, and re-apply it automatically on every page load.
  let startViewCache = null;

  const StartViewManager = {
    capture() {
      return { filters: cloneFilters(activeFilters), search: searchTerm };
    },
    hasCurrent() {
      return Object.values(activeFilters).flat().length > 0 || searchTerm.length > 0;
    },
    apply(view, silent) {
      if (!view || !view.filters) return false;
      activeFilters = cloneFilters(view.filters, true);
      searchTerm = typeof view.search === "string" ? view.search : "";
      // Re-sync the visible chip + search-box state to match the restored data.
      $(".tm_filter_button").removeClass("active");
      Object.keys(activeFilters).forEach((group) => {
        activeFilters[group].forEach((filter) => {
          $(`.tm_filter_button[data-group="${group}"][data-filter="${filter}"]`).addClass("active");
        });
      });
      getCachedElement(CONFIG.SELECTORS.SEARCH_INPUT).val(searchTerm);
      // A saved view may name a group that now has only one option (its row is
      // hidden); drop those so the view can't reinstate an invisible filter.
      updateFilterRowVisibility();
      FilterManager.applyFilters(!!silent);
      return true;
    },
  };

  const updateStartViewButton = () => {
    $("#tm_start_view").text(`Start View: ${startViewCache ? "On" : "Off"}`);
  };

  const showStartViewModal = () => {
    $("#tm_start_view_modal").remove();
    const hasSaved = !!startViewCache;
    const hasCurrent = StartViewManager.hasCurrent();
    const favCount = favoritesCache.length;
    // Every pick chip is one {group, label, view, …} candidate. Building the
    // list once means render, active-state, the "custom view" note, and the
    // click handler all read one source — no per-kind branching. svFromShortcut
    // deep-copies so storage never holds a live reference to a cached shortcut.
    const svFromShortcut = (sc) => ({
      search: typeof sc.search === "string" ? sc.search : "",
      filters: cloneFilters(sc.filters),
    });
    const withShow = (s) => ({ search: "", filters: { ...emptyFilters(), show: [s] } });
    const withTag = (t) => ({ search: "", filters: { ...emptyFilters(), tag: [t] } });
    const candidates = [
      { group: "Views", label: `★ Favorites${favCount ? ` (${favCount})` : ""}`, view: withShow("favorites"),
        disabled: !favCount, title: favCount ? "Open showing only starred roles" : "Star some roles first — the ☆ on each row",
        msg: "Start view set to your Favorites." },
      { group: "Views", label: "↻ Recent", view: withShow("recent"),
        title: "Open showing recently used roles", msg: "Start view set to Recent." },
      ...customShortcutsCache.map((sc) => ({ group: "Shortcuts", label: escapeHtml(sc.label), view: svFromShortcut(sc),
        title: "Open with this shortcut's search and filters", msg: `Start view set to "${sc.label}".` })),
      ...AccountTagsManager.allTags().map((t) => ({ group: "Tags", label: escapeHtml(t), view: withTag(t),
        title: "Open filtered to this tag", msg: `Start view set to tag "${t}".` })),
    ];

    // Render one label+chips row per group present (fixed order); each chip
    // carries its candidate index, so the click handler needs no per-kind switch.
    const isOn = (view) => hasSaved && viewsEqual(startViewCache, view);
    const chipHTML = (c, i) => {
      const on = isOn(c.view);
      return `<button type="button" class="tm_sv_pick${on ? " tm_sv_active" : ""}"${c.disabled ? " disabled" : ""} title="${escapeHtml(c.title)}" data-sv-idx="${i}">${c.label}${on ? " ✓" : ""}</button>`;
    };
    const gridHTML = ["Views", "Shortcuts", "Tags"].map((g) => {
      const chips = candidates.map((c, i) => (c.group === g ? chipHTML(c, i) : "")).join("");
      return chips ? `<span class="tm_sv_rowlabel">${g}</span><div class="tm_sv_chips">${chips}</div>` : "";
    }).join("");

    // A start view set but matching no chip is a saved-filters snapshot — flag it.
    const customActive = hasSaved && !candidates.some((c) => viewsEqual(startViewCache, c.view));
    const customNote = customActive
      ? `<div style="margin: 0 0 16px 0 !important; padding: 8px 10px !important; background: #e7f2fb !important; border-radius: 5px !important; color: #0073bb !important; font-size: 12.5px !important; line-height: 1.4 !important;">A custom start view (your saved filters) is active. Pick one below to replace it, or Clear.</div>`
      : "";

    const modalHTML = `
            <div id="tm_start_view_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10001 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 22px 24px !important;
                    max-width: 470px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">Start View</h3>
                    <p style="margin: 0 0 16px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.5 !important;">
                        Choose the view the role picker opens with — it's re-applied automatically every time this page loads.
                    </p>
                    ${customNote}
                    <div class="tm_sv_grid">${gridHTML}</div>
                    <div class="tm_sv_footer">
                        <div class="tm_sv_footer_left">
                            <button id="tm_start_view_save" type="button" class="tm_sv_btn" ${hasCurrent ? "" : "disabled"} title="Save whatever filters and search you have active right now">Save current filters</button>
                            <button id="tm_start_view_clear" type="button" class="tm_sv_btn" ${hasSaved ? "" : "disabled"} title="Remove the start view (favorites untouched)">Clear</button>
                        </div>
                        <button id="tm_start_view_cancel" type="button" class="tm_sv_btn">Close</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    const persistStartView = async (view, msg) => {
      const saved = await StorageManager.saveStartView(view);
      if (saved === false) return;
      startViewCache = view;
      updateStartViewButton();
      StartViewManager.apply(view, true); // apply now so the effect is visible
      $("#tm_start_view_modal").remove();
      showToast(msg, "success", CONFIG.TOAST_DURATION);
    };

    $("#tm_start_view_cancel, #tm_start_view_modal").on("click", function (e) {
      if (e.target === this) $("#tm_start_view_modal").remove();
    });

    // One handler: the chip's index picks its candidate — no per-kind switch.
    $("#tm_start_view_modal").on("click", ".tm_sv_pick", async function () {
      if (this.disabled) return;
      const c = candidates[Number(this.getAttribute("data-sv-idx"))];
      if (c) await persistStartView(c.view, c.msg);
    });

    $("#tm_start_view_save").on("click", async function () {
      if (!StartViewManager.hasCurrent()) return;
      await persistStartView(StartViewManager.capture(), "Start view saved — the picker will open with these filters.");
    });

    $("#tm_start_view_clear").on("click", async function () {
      if (!startViewCache) return;
      await StorageManager.clearStartView();
      startViewCache = null;
      updateStartViewButton();
      $("#tm_start_view_modal").remove();
      showToast("Start view cleared (your favorites are untouched).", "info", CONFIG.TOAST_DURATION);
    });
  };

  // Build the AWS Console deep-link AWS will redirect to after SAML sign-in.
  // Uses the regional console host so AWS doesn't have to redirect from the
  // global one, and so multi-session routing (when enabled) kicks in directly.
  // Appends a URL fragment payload (env/account/role) so the console-side
  // decorator script can color and label the resulting tab.
  const buildDestination = (servicePath, labelPayload, region) => {
    const r = region || GeneralSettingsManager.region() || CONFIG.DEFAULT_AWS_REGION;
    const host = `https://${r}.console.aws.amazon.com`;
    const path = (servicePath || "").replace(/\{region\}/g, r);
    const base = path ? `${host}/${path}` : `${host}/`;
    if (!labelPayload) return base;
    try {
      // UTF-8-safe base64: a session label / tag / account name with an emoji
      // or non-Latin1 character would make a plain btoa(JSON) throw, silently
      // dropping the whole payload (no tab colour/label, and no chain jump).
      const bytes = new TextEncoder().encode(JSON.stringify(labelPayload));
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      const encoded = btoa(bin);
      const sep = base.includes("#") ? "&" : "#";
      return `${base}${sep}hop=${encoded}`;
    } catch (e) {
      console.warn("Failed to encode tab label payload:", e);
      return base;
    }
  };

  // Sign in to AWS role. Overrides the role-picker form's RelayState so AWS
  // redirects into the chosen service after validating the SAML response.
  const signInToRole = (roleArn, destinationUrl, { newTab = false } = {}) => {
    // .filter() rather than an attribute-selector template — roleArn may
    // legitimately contain characters that need CSS-selector escaping.
    const $radio = $('input[type="radio"][name="roleIndex"]').filter(function () {
      return this.value === roleArn;
    });
    if ($radio.length === 0) {
      console.error("Could not find radio button for role:", roleArn);
      showToast("Error: Could not find role to select", "error");
      return;
    }

    $('input[type="radio"][name="roleIndex"]').prop("checked", false);
    $radio.prop("checked", true);

    const $form = $("#saml_form");
    if ($form.length === 0) {
      console.error("Could not find SAML form");
      showToast("Error: Could not find form to submit", "error");
      return;
    }

    let $relay = $form.find('input[name="RelayState"]');
    if ($relay.length === 0) {
      $relay = $('<input type="hidden" name="RelayState">').appendTo($form);
    }
    $relay.val(destinationUrl);

    // Re-use the existing hidden signin input on a retry so we don't pile up
    // duplicates if the user double-clicks before navigation kicks in.
    const $signinButton = $("#signin_button");
    if ($signinButton.length > 0) {
      const name = $signinButton.attr("name") || "signin";
      const value = $signinButton.val() || "Sign In";
      let $hidden = $form.find(`input[type="hidden"][name="${name}"]`).first();
      if (!$hidden.length) {
        $hidden = $('<input type="hidden">').attr("name", name).appendTo($form);
      }
      $hidden.val(value);
    }

    // For "open in new tab" we flip the form's target just for this submit.
    // The unique name avoids reusing a stale window from a prior new-tab
    // signin (each click gets its own console tab).
    const prevTarget = $form.attr("target");
    if (newTab) {
      $form.attr("target", `_blank_hop_${Date.now()}`);
    }

    $form.submit();

    if (newTab) {
      // Restore on next tick so the submission has dispatched. The role
      // picker stays on the current tab and remains usable for the next
      // sign-in.
      setTimeout(() => {
        if (prevTarget) $form.attr("target", prevTarget);
        else $form.removeAttr("target");
      }, 0);
    }
  };

  // --- Clean up original UI ---
  $("h1.background").remove();
  $("form p").each(function () {
    if (this.textContent.includes("Select a role:")) this.remove();
  });
  $("#signin_button").parent().hide();

  // --- Add UI Components ---
  // Filter rows are containers; their buttons are rendered by renderFilterRow
  // from the corresponding manager's cached entries. This means the toolbar
  // automatically reflects whatever the user configures via the side-menu config modals.
  const mainPanelHTML = `
        <div id="tm_interface_wrapper">
            <div class="tm_main_layout">
                <div class="tm_left_column">
                    <div class="tm_frow">
                        <span class="tm_frow_label">Organizations</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="org"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Environments</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="env"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Account types</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="type"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Roles</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="role"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Tags</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="tag"></div></div>
                    </div>
                    <div class="tm_frow tm_frow_shortcuts">
                        <span class="tm_frow_label">Shortcuts</span>
                        <div class="tm_frow_body tm_shortcuts_section">
                            <div class="tm_button_group">
                                <a href="#" class="tm_filter_button" data-group="show" data-filter="favorites">Favorites</a>
                                <a href="#" class="tm_filter_button" data-group="show" data-filter="recent">Recent</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tm_right_column">
                    <div id="tm_search_container">
                        <div id="tm_search_pop">
                            <div id="tm_search_field">
                                <input type="text" id="tm_search_input" placeholder="Find account..." autocomplete="off">
                                <button type="button" id="tm_search_clear" class="tm_field_clear" aria-label="Clear search" title="Clear" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                            </div>
                            <div id="tm_search_suggest"></div>
                            <div id="tm_search_foot">
                                <div id="tm_search_save">
                                    <button type="button" id="tm_search_save_btn" title="Save this search and its filters as a reusable Shortcut">☆ save as shortcut</button>
                                    <span id="tm_search_save_form">
                                        <input type="text" id="tm_search_save_name" placeholder="shortcut name" autocomplete="off" maxlength="40">
                                        <button type="button" id="tm_search_save_go">save</button>
                                    </span>
                                </div>
                                <div id="tm_search_matchcount"></div>
                            </div>
                        </div>
                    </div>
                    <div id="tm_jump_section" style="display: none;">
                        <div class="tm_col_divider"></div>
                        <div id="tm_jump_bar" style="position: relative;">
                        <button type="button" id="tm_jump_pill" title="Sign into a hub, then switch into an account you can only reach by assuming a role" style="
                            display: flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important;
                            width: 100% !important; box-sizing: border-box !important; padding: 7px 12px !important;
                            border: 1px solid #0073bb !important; border-radius: 6px !important;
                            background: white !important; color: #0073bb !important; cursor: pointer !important; font-size: 13px !important;
                        ">⤳ Jump to account</button>
                        <div id="tm_jump_popover" style="
                            display: none; position: absolute !important; top: calc(100% + 6px) !important; right: 0 !important; left: auto !important;
                            z-index: 10000 !important; width: 300px !important; background: white !important;
                            border: 1px solid #ccc !important; border-radius: 8px !important;
                            box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important; padding: 12px !important; text-align: left !important;
                        ">
                            <div style="display: flex !important; gap: 6px !important; margin-bottom: 8px !important;">
                                <select id="tm_jump_org" title="Org / assume profile" style="
                                    flex: 0 0 42% !important; padding: 6px 6px !important; border: 1px solid #ccc !important;
                                    border-radius: 4px !important; font-size: 12px !important; background: white !important; color: #16191f !important;
                                "></select>
                                <div id="tm_jump_account_wrap" style="position: relative !important; flex: 1 !important; min-width: 0 !important;">
                                    <input id="tm_jump_account" type="text" placeholder="destination account id" autocomplete="off" style="
                                        width: 100% !important; padding: 6px 28px 6px 8px !important; border: 1px solid #ccc !important;
                                        border-radius: 4px !important; font-size: 12px !important; box-sizing: border-box !important; min-width: 0 !important;
                                    " />
                                    <button type="button" id="tm_jump_account_clear" class="tm_field_clear" aria-label="Clear account id" title="Clear" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                                </div>
                            </div>
                            <div id="tm_jump_label_wrap" style="position: relative !important; margin-bottom: 8px !important;">
                                <input id="tm_jump_label" type="text" placeholder="session label (optional)" autocomplete="off" style="
                                    width: 100% !important; padding: 6px 28px 6px 8px !important; border: 1px solid #ccc !important;
                                    border-radius: 4px !important; font-size: 12px !important; box-sizing: border-box !important;
                                " />
                                <button type="button" id="tm_jump_label_clear" class="tm_field_clear" aria-label="Clear label" title="Clear" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                            </div>
                            <button type="button" id="tm_jump_go" style="
                                width: 100% !important; padding: 7px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                                color: white !important; border-radius: 4px !important; cursor: pointer !important; font-size: 12px !important;
                            ">Jump →</button>
                            <div id="tm_jump_recents"></div>
                        </div>
                        </div>
                    </div>
                    <div class="tm_col_divider"></div>
                    <select id="tm_group_mode_select" class="tm_group_mode_select" title="How the console tabs you open are grouped in Chrome">
                        <option value="role">Tabs: By role</option>
                        <option value="org">Tabs: By org</option>
                        <option value="custom">Tabs: Custom tag</option>
                        <option value="off">Tabs: Off</option>
                    </select>
                    <div id="tm_group_tag_field" class="tm_group_tag_field" style="display: none;">
                        <input id="tm_group_tag_input" class="tm_group_tag_input" type="text" placeholder="INC-4821" autocomplete="off" />
                        <button type="button" id="tm_group_tag_clear" class="tm_field_clear" aria-label="Clear tag" title="Clear tag" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const floatingActionsHTML = `
        <div id="tm_actions_container">
            <div id="tm_actions_scroll">
                <div class="tm_menu_header">View</div>
                <a href="#" class="tm_action_button" id="tm_theme_toggle">Theme: Light</a>
                <a href="#" class="tm_action_button" id="tm_compact_toggle">Compact: Off</a>
                <a href="#" class="tm_action_button" id="tm_signin_tab_toggle">Sign-in: Same tab</a>
                <a href="#" class="tm_action_button" id="tm_recent_limit">Recent: 10</a>
                <a href="#" class="tm_action_button" id="tm_tab_group_mode">Tab Groups: By role</a>
                <a href="#" class="tm_action_button" id="tm_start_view">Start View: Off</a>
                <div class="tm_menu_header">Configure</div>
                <a href="#" class="tm_action_button" id="tm_manage_shortcuts">Shortcuts</a>
                <a href="#" class="tm_action_button" id="tm_manage_organizations">Organizations</a>
                <a href="#" class="tm_action_button" id="tm_manage_environments">Environments</a>
                <a href="#" class="tm_action_button" id="tm_manage_types">Account Types</a>
                <a href="#" class="tm_action_button" id="tm_manage_role_names">Role Names</a>
                <a href="#" class="tm_action_button" id="tm_manage_services">Services</a>
                <a href="#" class="tm_action_button" id="tm_manage_regions">Regions</a>
                <a href="#" class="tm_action_button" id="tm_manage_account_names">Account Names</a>
                <a href="#" class="tm_action_button" id="tm_manage_account_tags">Account Tags</a>
                <a href="#" class="tm_action_button" id="tm_manage_assume_profiles">Assume Profiles</a>
                <a href="#" class="tm_action_button" id="tm_general_settings">General Settings</a>
                <div class="tm_menu_header">Data</div>
                <a href="#" class="tm_action_button" id="tm_export_settings">Export Settings</a>
                <a href="#" class="tm_action_button" id="tm_import_settings">Import Settings</a>
                <a href="#" class="tm_action_button" id="tm_reset_order">Reset Order</a>
                <a href="#" class="tm_action_button" id="tm_reset_recent">Reset Recent</a>
                <a href="#" class="tm_action_button" id="tm_clear_sessions">Clear AWS Sessions</a>
                <div class="tm_menu_header">Help</div>
                <a href="#" class="tm_action_button" id="tm_keyboard_help">Keyboard Shortcuts</a>
                <a href="#" class="tm_action_button" id="tm_about">Help / About</a>
            </div>
        </div>
    `;

  const footerHTML = `
        <div id="tm_footer">
            <span id="tm_footer_text">Console Hopper v${CONFIG.SCRIPT_VERSION}</span><span id="tm_footer_homepage_wrap" style="display:none !important;"> | <a id="tm_footer_homepage" href="#" target="_blank" rel="noopener">Homepage</a></span> | <a id="tm_footer_privacy" href="https://github.com/tomekklas/console-hopper/blob/main/PRIVACY.md" target="_blank" rel="noopener">Privacy</a>
        </div>
    `;

  // Show/hide the homepage link in the footer based on the configured URL.
  // Called after init and whenever General Settings is saved.
  const updateHomepageFooter = () => {
    const url = (homepageUrlCache || "").trim();
    const $wrap = $("#tm_footer_homepage_wrap");
    const $a = $("#tm_footer_homepage");
    if (!$wrap.length || !$a.length) return;
    if (url) {
      $a.attr("href", url);
      $wrap[0].style.setProperty("display", "inline", "important");
    } else {
      $wrap[0].style.setProperty("display", "none", "important");
    }
  };

  // Add components to the page
  const samlForm = $("#saml_form");
  if (samlForm.length) {
    samlForm.prepend(mainPanelHTML);
    $("body").append(floatingActionsHTML);

    const amazonFooter = $("#smallprint");
    if (amazonFooter.length) {
      amazonFooter.prepend(footerHTML);
    }
  }

  // --- Add CSS with Theme Support ---
  const css = `
        body {
            font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif !important;
            transition: background-color 0.3s ease, color 0.3s ease !important;
        }

        #saml_form {
            max-width: 1100px !important;
            margin: 20px auto 20px auto !important;
            padding: 0 20px !important;
        }

        body.tm_theme_light {
            background-color: #f8f9fa !important;
            color: #16191f !important;
        }

        body.tm_theme_dark {
            background-color: #1a1d23 !important;
            color: #e9ecef !important;
        }

        body.tm_theme_dark #tm_interface_wrapper {
            background-color: #2d3748 !important;
            border-color: #4a5568 !important;
            color: #e9ecef !important;
        }

        body.tm_theme_dark .tm_frow_label {
            color: #a0aec0 !important;
        }

        body.tm_theme_dark .tm_filter_button {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_filter_button:hover {
            background-color: #5a6578 !important;
        }

        body.tm_theme_dark .tm_filter_button.active {
            background-color: #3182ce !important;
            border-color: #3182ce !important;
        }

        /* The generic dark rule above sets a uniform border, which would
           otherwise clobber the per-entry env/org/type color (lower specificity
           in the light-mode [data-color] rule). Restore the colored border in
           dark mode with a more specific selector. */
        body.tm_theme_dark .tm_filter_button[data-color] {
            border-color: var(--tm-fb-color, #6b7280) !important;
        }
        body.tm_theme_dark .tm_filter_button[data-color].active {
            background-color: var(--tm-fb-color, #3182ce) !important;
            border-color: var(--tm-fb-color, #3182ce) !important;
        }

        body.tm_theme_dark #tm_search_input {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark #tm_search_input::placeholder {
            color: #a0aec0 !important;
        }

        body.tm_theme_dark .saml-role {
            background-color: #2d3748 !important;
            border-color: #4a5568 !important;
            color: #e9ecef !important;
        }

        body.tm_theme_dark .saml-role:hover {
            border-color: #3182ce !important;
            background-color: #374151 !important;
        }

        body.tm_theme_dark .tm_account_name {
            color: #e9ecef !important;
        }

        body.tm_theme_dark .tm_account_id {
            color: #a0aec0 !important;
        }

        body.tm_theme_dark .tm_role_name {
            color: #e9ecef !important;
        }

        body.tm_theme_dark .tm_role_button {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_role_button:hover {
            background-color: #5a6578 !important;
        }

        body.tm_theme_dark .tm_role_button.primary {
            background-color: #3182ce !important;
            border-color: #3182ce !important;
        }

        body.tm_theme_dark .tm_role_button.primary:hover {
            background-color: #2c5aa0 !important;
        }

        body.tm_theme_dark .tm_favorite_button {
            background-color: #4a5568 !important;
            color: #d69e2e !important;
            border-color: #d69e2e !important;
        }

        body.tm_theme_dark .tm_favorite_button:hover {
            background-color: #553c0a !important;
        }

        body.tm_theme_dark .tm_favorite_button.favorited {
            background-color: #d69e2e !important;
            color: #1a202c !important;
            border-color: #d69e2e !important;
        }

        body.tm_theme_dark .tm_favorite_button.favorited:hover {
            background-color: #b7791f !important;
            border-color: #b7791f !important;
        }

        body.tm_theme_dark .tm_action_button {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_action_button:hover {
            background-color: #5a6578 !important;
        }

        #tm_interface_wrapper {
            background-color: #fafafa !important;
            border: 1px solid #e7e7e7 !important;
            border-radius: 4px !important;
            padding: 15px !important;
            margin-bottom: 0px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease !important;
        }

        .tm_main_layout {
            display: flex !important;
            gap: 0px !important;
            align-items: stretch !important;
        }

        .tm_left_column {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 9px !important;
            padding-right: 15px !important;
        }

        .tm_right_column {
            flex: 0 0 200px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 9px !important;
            padding-left: 15px !important;
            border-left: 1px solid #f0f0f0 !important;
        }

        body.tm_theme_dark .tm_right_column {
            border-left-color: #3a4148 !important;
        }

        /* Dedicated "Tab group" area between the filters and the search / jump
           rail: one dropdown (By role / By org / Custom tag / Off) with a tag
           field that appears only when Custom tag is chosen. */
        /* Find / Jump / Tabs stack vertically in one column, each fenced off by
           a hairline. Divider margin is 0 — the column's flex gap (and the jump
           section's) provides even 9px space on both sides of each rule. Every
           control self-labels, so there are no headings. */
        .tm_col_divider {
            border-top: 1px solid #ededed !important;
            margin: 0 !important;
        }
        body.tm_theme_dark .tm_col_divider {
            border-top-color: #3a4148 !important;
        }
        /* Flex so the divider inside it gets the same 9px gap as the top-level
           column. display is intentionally NOT !important so the inline
           display:none toggle (refreshJumpBar) can still hide the whole block. */
        #tm_jump_section {
            display: flex;
            flex-direction: column !important;
            gap: 9px !important;
        }
        .tm_group_mode_select {
            width: 100% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 8px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 4px !important;
            background-color: #fff !important;
            color: #16191f !important;
            font-size: 14px !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        .tm_group_mode_select:focus {
            outline: none !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0,115,187,0.15) !important;
        }
        body.tm_theme_dark .tm_group_mode_select {
            background-color: #2d3748 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        /* One filter category per row: a fixed right-aligned label seam on the
           left, wrapping chips on the right. Baseline-aligned so the label sits
           with the first row of chips even when the group wraps to two lines. */
        .tm_frow {
            display: flex !important;
            align-items: baseline !important;
            gap: 11px !important;
        }

        /* A filter row with fewer than two options is hidden (see
           updateFilterRowVisibility). Higher specificity than the rule above so
           the !important display:none wins regardless of source order. */
        .tm_frow.tm_frow_hidden {
            display: none !important;
        }

        /* When no filter rows are visible above it, the Shortcuts row's top
           divider separates nothing — drop it. */
        .tm_frow.tm_frow_bare {
            border-top: none !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
        }

        .tm_frow_label {
            flex: 0 0 96px !important;
            text-align: right !important;
            font-size: 12px !important;
            color: #687078 !important;
            line-height: 1.6 !important;
        }

        .tm_frow_body {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 8px !important;
        }

        /* Favorites / Recent live in their own footer row, fenced off from the
           filters above with a hairline. */
        .tm_frow_shortcuts {
            align-items: center !important;
            border-top: 1px solid #f0f0f0 !important;
            padding-top: 9px !important;
            margin-top: 1px !important;
        }

        body.tm_theme_dark .tm_frow_shortcuts {
            border-top-color: #3a4148 !important;
        }

        .tm_button_group {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
        }

        .tm_filter_button {
            padding: 4px 12px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 15px !important;
            text-decoration: none !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            background-color: #fff !important;
            transition: all 0.2s ease !important;
        }

        /* Inline "remove shortcut" ✕ on saved-view chips. Subtle by default,
           brighter on hover; a first click arms .tm_confirm_del (whole chip goes
           red = "click again to remove"), so deletion always takes two clicks. */
        .tm_shortcut_del {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 15px !important;
            height: 15px !important;
            margin-left: 6px !important;
            margin-right: -3px !important;
            border-radius: 50% !important;
            font-size: 10px !important;
            line-height: 1 !important;
            color: #99a0a8 !important;
            vertical-align: middle !important;
            transition: color 0.12s ease, background-color 0.12s ease !important;
        }
        .tm_shortcut_del:hover { color: #c0392b !important; background-color: #fbeae8 !important; }
        .tm_custom_shortcut.tm_confirm_del {
            border-color: #c0392b !important;
            background-color: #fbeae8 !important;
            color: #c0392b !important;
        }
        .tm_custom_shortcut.tm_confirm_del .tm_shortcut_del {
            color: #fff !important;
            background-color: #c0392b !important;
        }
        body.tm_theme_dark .tm_shortcut_del { color: #8a94a0 !important; }
        body.tm_theme_dark .tm_shortcut_del:hover { color: #f0a0a0 !important; background-color: #4a2222 !important; }
        body.tm_theme_dark .tm_custom_shortcut.tm_confirm_del {
            border-color: #e06060 !important;
            background-color: #4a2222 !important;
            color: #f0a0a0 !important;
        }
        body.tm_theme_dark .tm_custom_shortcut.tm_confirm_del .tm_shortcut_del {
            color: #4a2222 !important;
            background-color: #f0a0a0 !important;
        }

        /* Tag field for the "Custom tag" grouping choice — shown only when the
           dropdown above is set to Custom tag. Its value groups every Sign In
           under that tag until another grouping option is picked. */
        .tm_group_tag_input {
            width: 100% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 30px 0 8px !important;
            border: 1px solid #0073bb !important;
            border-radius: 4px !important;
            color: #16191f !important;
            font-size: 14px !important;
            background-color: #fff !important;
            outline: none !important;
            font-family: inherit !important;
        }
        .tm_group_tag_input::placeholder { color: #8a9199 !important; font-style: italic !important; }
        .tm_group_tag_input:focus {
            box-shadow: 0 0 0 2px rgba(0,115,187,0.15) !important;
        }
        body.tm_theme_dark .tm_group_tag_input {
            background-color: #2d3748 !important;
            color: #e9ecef !important;
            border-color: #0073bb !important;
        }

        /* Clearable field: an ✕ button overlaid at the right that empties the
           field and refocuses it — shown only when the wrapping element carries
           .tm_has_value. Shared by the custom-tag field and the Jump account-id
           field so both clear the same way. */
        .tm_group_tag_field {
            position: relative !important;
            width: 100% !important;
        }
        .tm_field_clear {
            position: absolute !important;
            top: 50% !important;
            right: 5px !important;
            transform: translateY(-50%) !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            width: 22px !important;
            height: 22px !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
            color: #8a9199 !important;
            cursor: pointer !important;
            border-radius: 4px !important;
            transition: background-color 0.12s ease, color 0.12s ease !important;
        }
        .tm_has_value > .tm_field_clear {
            display: flex !important;
        }
        .tm_field_clear:hover {
            color: #16191f !important;
            background: #eef2f6 !important;
        }
        /* Dark treatment applies to the main-panel fields (custom tag + search),
           which sit on the dark panel; the Jump popover is always white, so its
           clear buttons keep the light styling above. */
        body.tm_theme_dark #tm_group_tag_field .tm_field_clear,
        body.tm_theme_dark #tm_search_container .tm_field_clear {
            color: #9aa0a6 !important;
        }
        body.tm_theme_dark #tm_group_tag_field .tm_field_clear:hover,
        body.tm_theme_dark #tm_search_container .tm_field_clear:hover {
            color: #e9ecef !important;
            background: #3a4148 !important;
        }

        .tm_filter_button:hover {
            background-color: #e9ecef !important;
        }

        .tm_filter_button.active {
            background-color: #0073bb !important;
            color: #fff !important;
            border-color: #0073bb !important;
        }

        /* Active chips otherwise have no hover affordance — the .active
           background wins over :hover at the same specificity. Use a
           brightness filter so the same rule covers every active state
           (built-in blue, per-entry --tm-fb-color, and the dark-theme
           variants) without per-colour overrides. */
        .tm_filter_button.active:hover {
            filter: brightness(0.9) !important;
        }

        /* Per-entry color (env/org/type/role) is applied inline at render
           time. .tm_filter_button[style*=...] CSS would be unmaintainable, so
           we just override .active with a tinted state via JS-set CSS vars. */
        .tm_filter_button[data-color] {
            border-color: var(--tm-fb-color, #adb5bd) !important;
        }
        .tm_filter_button[data-color].active {
            background-color: var(--tm-fb-color, #0073bb) !important;
            border-color: var(--tm-fb-color, #0073bb) !important;
            color: #fff !important;
        }

        /* --- Search: a compact box in the 200px rail that pops out into a wide
           floating card on focus (mirrors the Jump popover). The container
           reserves a fixed 32px slot; #tm_search_pop is an absolute child that
           fills that slot when collapsed and grows into a card while the input
           is focused (:focus-within). There is no second input — the same
           #tm_search_input is simply restyled, so search state stays single-
           source. Suggest + match count are in-flow inside the card and hidden
           when collapsed, so the rail slot stays clean. */
        #tm_search_container {
            width: 100% !important;
            position: relative !important;
            height: 32px !important;
        }
        #tm_search_pop {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 1002 !important;
            box-sizing: border-box !important;
            border: 1px solid transparent !important;
            border-radius: 8px !important;
            transition: box-shadow 0.12s ease, border-color 0.12s ease !important;
        }
        #tm_search_field { position: relative !important; }

        #tm_search_input {
            width: 100% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 32px 0 10px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
        }

        /* Expanded: the box is focused → float a wide card leftward over the list. */
        #tm_search_container:focus-within #tm_search_pop {
            left: auto !important;
            width: 400px !important;
            max-width: calc(100vw - 60px) !important;
            top: -7px !important;
            padding: 6px !important;
            background: #fff !important;
            border-color: #0073bb !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        #tm_search_container:focus-within #tm_search_input {
            height: 36px !important;
            border-color: #0073bb !important;
        }

        /* Autocomplete + legend + live match count: in-flow inside the card,
           revealed only while the box is focused. */
        #tm_search_suggest { display: none !important; margin-top: 8px !important; }
        #tm_search_container:focus-within #tm_search_suggest { display: block !important; }
        /* Footer: "save as shortcut" on the left, live match count on the right.
           Only shown when there is actually something to save or count (JS adds
           .tm_foot_on), so an empty box stays clean. */
        #tm_search_foot { display: none !important; }
        #tm_search_container:focus-within #tm_search_foot.tm_foot_on {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            margin-top: 8px !important;
            padding-top: 7px !important;
            border-top: 1px solid #ededed !important;
        }
        #tm_search_matchcount {
            font-size: 12px !important;
            color: #0073bb !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
        }
        #tm_search_save_btn {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            border: 1px solid #d5d9de !important;
            background: transparent !important;
            color: #57606a !important;
            border-radius: 4px !important;
            padding: 3px 8px !important;
            font-size: 11.5px !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        #tm_search_save_btn:hover { border-color: #0073bb !important; color: #0073bb !important; }
        #tm_search_save_form { display: none !important; align-items: center !important; gap: 5px !important; }
        #tm_search_save.tm_saving #tm_search_save_btn { display: none !important; }
        #tm_search_save.tm_saving #tm_search_save_form { display: flex !important; }
        #tm_search_save_name {
            height: 26px !important;
            width: 150px !important;
            box-sizing: border-box !important;
            padding: 0 7px !important;
            border: 1px solid #0073bb !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-family: inherit !important;
        }
        #tm_search_save_go {
            border: none !important;
            background: #0073bb !important;
            color: #fff !important;
            border-radius: 4px !important;
            padding: 4px 10px !important;
            font-size: 11.5px !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        body.tm_theme_dark #tm_search_save_btn { border-color: #55606e !important; color: #adb5bd !important; }
        body.tm_theme_dark #tm_search_save_name { background: #3a4453 !important; color: #e9ecef !important; }
        body.tm_theme_dark #tm_search_container:focus-within #tm_search_foot.tm_foot_on { border-top-color: #3a4148 !important; }
        .tm_suggest_chips { display: flex !important; flex-wrap: wrap !important; gap: 5px !important; }
        .tm_suggest_chip {
            border: 1px solid #d5d9de !important;
            background: #f6f8fa !important;
            color: #24292f !important;
            border-radius: 999px !important;
            padding: 2px 9px !important;
            font-size: 12px !important;
            line-height: 1.5 !important;
            cursor: pointer !important;
            font-family: inherit !important;
        }
        .tm_suggest_chip:hover { border-color: #0073bb !important; color: #0073bb !important; }
        /* Keyboard highlight (Alt/Option+↑↓) — a filled chip so it reads even
           among the row of outline chips. */
        .tm_suggest_chip.tm_suggest_active {
            background: #0073bb !important;
            border-color: #0073bb !important;
            color: #fff !important;
        }
        .tm_suggest_none { font-size: 12px !important; color: #8a9099 !important; }
        .tm_suggest_legend { font-size: 11px !important; color: #8a9099 !important; margin-top: 8px !important; }
        .tm_suggest_legend b { color: #57606a !important; font-weight: 600 !important; }
        .tm_suggest_keys { font-size: 11px !important; color: #99a0a8 !important; margin-top: 4px !important; }
        body.tm_theme_dark #tm_search_container:focus-within #tm_search_pop { background: #2d3542 !important; border-color: #55606e !important; }
        body.tm_theme_dark .tm_suggest_chip { background: #3a4453 !important; border-color: #55606e !important; color: #e9ecef !important; }
        body.tm_theme_dark .tm_suggest_chip.tm_suggest_active { background: #0073bb !important; border-color: #0073bb !important; color: #fff !important; }
        body.tm_theme_dark .tm_suggest_none,
        body.tm_theme_dark .tm_suggest_legend { color: #8a94a0 !important; }
        body.tm_theme_dark .tm_suggest_legend b { color: #adb5bd !important; }
        body.tm_theme_dark .tm_suggest_keys { color: #7d858f !important; }
        body.tm_theme_dark #tm_search_container:focus-within #tm_search_matchcount:not(:empty) { color: #4aa3e0 !important; }

        #tm_actions_container {
            position: fixed !important;
            top: 20px !important;
            /* Width is fixed so the hidden offset is predictable — the
               container's natural width follows the longest button label
               and was leaving ~80px of body sticking out at -120px. */
            width: 236px !important;
            right: -236px !important;
            box-sizing: border-box !important;
            z-index: 1000 !important;
            transition: right 0.3s ease !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 8px 0 0 8px !important;
            padding: 10px 12px !important;
            border: 1px solid #e1e4e8 !important;
            border-right: none !important;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.1) !important;
        }

        /* Inner scroller so a long menu can't clip off-screen. Kept separate
           from the container so the container's ::before pull-tab (which sits
           outside its left edge) isn't clipped by the overflow. */
        #tm_actions_scroll {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            max-height: calc(100vh - 48px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
        }

        /* Section labels grouping the menu (View / Configure / Data / Help). */
        .tm_menu_header {
            font-size: 11px !important;
            color: #8a9099 !important;
            text-align: left !important;
            margin: 5px 2px 0 !important;
            padding-top: 6px !important;
            border-top: 1px solid #ededed !important;
        }
        #tm_actions_scroll .tm_menu_header:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
            border-top: none !important;
        }
        body.tm_theme_dark .tm_menu_header {
            color: #a0aec0 !important;
            border-top-color: #4a5568 !important;
        }

        #tm_actions_container::before {
            content: "..." !important;
            position: absolute !important;
            left: -24px !important;
            top: var(--tm-handle-top, 50%) !important;
            transform: translateY(-50%) !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid #e1e4e8 !important;
            border-right: none !important;
            border-radius: 6px 0 0 6px !important;
            padding: 8px 6px !important;
            font-size: 14px !important;
            color: #6c757d !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }

        #tm_actions_container:hover {
            right: 0px !important;
        }

        #tm_actions_container:hover::before {
            left: -30px !important;
            background: rgba(0, 115, 187, 0.95) !important;
            color: white !important;
            border-color: #0073bb !important;
        }

        .tm_action_button {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            text-decoration: none !important;
            color: #16191f !important;
            font-size: 13px !important;
            text-align: center !important;
            transition: all 0.2s ease !important;
            min-width: 100px !important;
            white-space: nowrap !important;
        }

        /* No translateX on hover: the inner scroller is overflow-x: hidden, so a
           leftward nudge clipped the hovered button's left edge. */
        .tm_action_button:hover {
            background: #f8f9fa !important;
        }

        body.tm_theme_dark #tm_actions_container {
            background: rgba(45, 55, 72, 0.95) !important;
            border-color: #4a5568 !important;
        }

        body.tm_theme_dark #tm_actions_container::before {
            background: rgba(45, 55, 72, 0.95) !important;
            border-color: #4a5568 !important;
            color: #a0aec0 !important;
        }

        body.tm_theme_dark #tm_actions_container:hover::before {
            background: rgba(49, 130, 206, 0.95) !important;
            border-color: #3182ce !important;
            color: white !important;
        }

        img[id^="image"] {
            display: none !important;
        }

        .expandable-container,
        .saml-account-name {
            display: none !important;
        }

        hr {
            display: none !important;
        }

        .saml-account {
            padding: 0 !important;
            border: none !important;
            margin: 0 !important;
        }

        .saml-role input[type="radio"] {
            position: absolute !important;
            left: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        .saml-role label,
        .saml-role .saml-role-description {
            display: none !important;
        }

        .saml-role {
            background-color: #fff !important;
            border: 1px solid #e1e4e8 !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            margin-bottom: 6px !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.08) !important;
            display: grid !important;
            /* fav | account name | tags | role name | account id | service | region | sign in
               The two name columns flex (1fr) so long names get room and ellipsis;
               the fixed tag column keeps every tag chip aligned in one vertical strip. */
            grid-template-columns: auto minmax(0, 1fr) 56px minmax(0, 1fr) auto auto auto auto !important;
            align-items: center !important;
            column-gap: 12px !important;
            transition: all 0.2s ease !important;
            min-height: 36px !important;
        }

        .saml-role[style*="display: none"] {
            display: none !important;
        }

        .saml-role:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            border-color: #0073bb !important;
        }

        /* Jump-history rows mirror the main role list: a ★ favourite/pin toggle
           FIRST, then the click-to-rejump body, then a ✕ delete. Pinned rows
           (gold ★) sort to the top — no "Pinned" header, the star says it — and
           can be dragged to reorder; recent rows (outline ☆, revealed on hover)
           follow. The list scrolls past a cap so the popover can't run off-screen. */
        #tm_jump_recents {
            max-height: 220px !important;
            overflow-y: auto !important;
            margin-top: 8px !important;
        }
        .tm_jump_recent {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 6px 4px !important;
            border-top: 1px solid #eee !important;
            font-size: 12px !important;
            cursor: pointer !important;
            transition: background-color 0.12s ease !important;
        }
        .tm_jump_recent:hover {
            background-color: #eef5fc !important;
        }
        .tm_jump_recent_body {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
        }
        .tm_jump_recent_l1 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
        }
        .tm_jump_recent_lbl {
            color: #16191f !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        .tm_jump_recent_acct {
            color: #6c757d !important;
            font-family: monospace !important;
            flex: none !important;
        }
        .tm_jump_recent_meta {
            color: #8a9099 !important;
            font-size: 11px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        .tm_jump_action {
            flex: none !important;
            width: 20px !important;
            height: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            line-height: 1 !important;
            opacity: 0 !important;
            transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease !important;
        }
        .tm_jump_recent:hover .tm_jump_action {
            opacity: 1 !important;
        }
        .tm_jump_pin { color: #c7ccd1 !important; }
        .tm_jump_pin:hover { color: #e0a800 !important; background-color: #fbf3d6 !important; }
        /* A pinned row always shows its filled gold star, and drags to reorder. */
        .tm_jump_recent[data-pinned="1"] .tm_jump_pin {
            color: #e0a800 !important;
            opacity: 1 !important;
        }
        /* Pinned rows reorder with the same FLIP pointer-drag as the main list:
           a transform transition so siblings glide as the dragged row passes. */
        .tm_jump_recent[data-pinned="1"] {
            cursor: grab !important;
            touch-action: none !important;
            will-change: transform !important;
            transition: transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1), background-color 0.12s ease !important;
        }
        .tm_jump_recent.tm_dragging {
            cursor: grabbing !important;
            opacity: 0.98 !important;
            background: #ffffff !important;
            border-top-color: transparent !important;
            border-radius: 6px !important;
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(0, 115, 187, 0.55) !important;
            position: relative !important;
            z-index: 30 !important;
        }
        body.tm_jump_dragging_active #tm_jump_recents .tm_jump_recent[data-pinned="1"]:not(.tm_dragging) {
            opacity: 0.85 !important;
        }
        .tm_jump_del { color: #8a9199 !important; }
        .tm_jump_del:hover { color: #c0392b !important; background-color: #fbeae8 !important; }
        /* Armed (first ✕ click): red-filled "click again to remove". opacity:1
           overrides the hover-reveal so it stays put after the pointer leaves. */
        .tm_jump_del.tm_confirm_del {
            opacity: 1 !important;
            color: #fff !important;
            background-color: #c0392b !important;
        }

        .saml-role.tm_kb_selected {
            outline: 2px solid #0073bb !important;
            outline-offset: -2px !important;
            box-shadow: 0 2px 12px rgba(0,115,187,0.35) !important;
        }

        /* The result list is a flex column, so the space between rows is a
           single container gap — exactly like the filter columns — instead of
           per-row margins. Per-row margins collapse with AWS's own row margins,
           which is why shrinking them in compact had no visible effect. */
        #tm_role_list {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            margin-top: 12px !important;
        }
        body.tm_compact_mode #tm_role_list {
            gap: 2px !important;
            margin-top: 6px !important;
        }
        #tm_role_list .saml-role {
            margin: 0 !important;
        }

        /* Drag-and-drop reorder.
           Driven by pointer events: dragged row follows cursor via translateY,
           siblings shift out of the way with a smooth CSS transition. */
        #tm_role_list .saml-role {
            cursor: grab !important;
            transition: transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1),
                        opacity 200ms ease,
                        box-shadow 180ms ease !important;
            touch-action: none;
            will-change: transform;
        }
        /* When any filter or search is active, drag-to-reorder is disabled
           (would only affect visible rows). Show the default cursor as a hint. */
        body.tm_filters_active #tm_role_list .saml-role {
            cursor: default !important;
        }
        .saml-role.tm_dragging {
            cursor: grabbing !important;
            /* transition is controlled inline via setProperty(...,"important")
               so we can guarantee it wins over base .saml-role rules. */
            opacity: 0.96 !important;
            box-shadow: 0 18px 38px rgba(0,0,0,0.30),
                        0 0 0 2px rgba(0,115,187,0.65) !important;
            z-index: 100 !important;
            position: relative !important;
            background: #ffffff !important;
            transform-origin: center center !important;
        }
        body.tm_theme_dark .saml-role.tm_dragging {
            background: #2d3748 !important;
        }
        /* Slight dim on the other rows so the dragged one really pops. */
        body.tm_role_dragging_active #tm_role_list .saml-role:not(.tm_dragging) {
            opacity: 0.88 !important;
        }
        /* The action controls keep their clickable cursor. */
        .saml-role .tm_role_buttons,
        .saml-role .tm_role_buttons * { cursor: default !important; }
        .saml-role .tm_role_buttons button,
        .saml-role .tm_role_buttons select { cursor: pointer !important; }

        .saml-role:last-child {
            margin-bottom: 0 !important;
        }

        /* Env color is painted as a left-stripe inline (via applyEnvironmentStyling)
           so the colour comes from the user's Environments config, not
           hardcoded CSS. */
        .saml-role[data-env-id]:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }

        /* Flatten this wrapper so its children (fav, account name, role name)
           become direct grid items of .saml-role and share its columns. */
        .tm_role_info {
            display: contents !important;
        }

        .tm_account_name {
            font-size: 14px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            flex: 0 1 auto !important;
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            position: relative !important;
            cursor: default !important;
        }

        .tm_account_id {
            font-size: 12px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            font-family: monospace !important;
            background: #fff !important;
            border: 1px solid #ccc !important;
            padding: 6px 10px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            min-width: 116px !important;
            text-align: center !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
        }

        .tm_account_id:hover {
            border-color: #0073bb !important;
            background: #f8f9fa !important;
        }

        .tm_role_name {
            font-size: 14px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            flex: 0 1 auto !important;
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }

        /* Account tags: on-demand chip in the name cell + an expandable inline
           editor that spans the whole row (grid-column: 1 / -1). */
        .tm_tag_cell {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            min-width: 0 !important;
        }
        .tm_tag_chip {
            flex: none !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
            border: 1px solid #d5d9de !important;
            background: #fff !important;
            color: #6c757d !important;
            border-radius: 999px !important;
            padding: 0 7px !important;
            height: 18px !important;
            font-size: 11px !important;
            line-height: 1 !important;
            cursor: pointer !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
        }
        .tm_tag_chip.tm_no_tags { border-style: dashed !important; color: #aab1b8 !important; }
        .tm_tag_chip:hover { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_tag_chip.tm_tag_matched {
            border-color: #0073bb !important;
            color: #0073bb !important;
            background: #e6f1fb !important;
        }
        body.tm_theme_dark .tm_tag_chip.tm_tag_matched {
            border-color: #3182ce !important;
            color: #cfe4fb !important;
            background: #24405c !important;
        }
        .tm_tag_ico { display: block !important; }
        .tm_tag_plus { font-weight: 700 !important; }
        .tm_tag_editor {
            grid-column: 1 / -1 !important;
            display: none !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 6px !important;
            margin-top: 8px !important;
            padding-top: 8px !important;
            border-top: 1px solid #eef0f2 !important;
        }
        .saml-role.tm_tags_open .tm_tag_editor { display: flex !important; }
        .tm_tag_pills { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
        .tm_tag_addwrap { display: inline-flex !important; }
        .tm_tag_pill {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            border: 1px solid #d5d9de !important;
            background: #f6f8fa !important;
            color: #444 !important;
            border-radius: 999px !important;
            padding: 2px 4px 2px 10px !important;
            font-size: 12px !important;
        }
        .tm_tag_del {
            border: none !important;
            background: transparent !important;
            color: #adb5bd !important;
            cursor: pointer !important;
            font-size: 11px !important;
            line-height: 1 !important;
            padding: 0 3px !important;
        }
        .tm_tag_del:hover { color: #c0392b !important; }
        .tm_tag_add {
            border: 1px dashed #c7ccd1 !important;
            background: transparent !important;
            color: #6c757d !important;
            border-radius: 999px !important;
            padding: 2px 10px !important;
            font-size: 12px !important;
            cursor: pointer !important;
        }
        .tm_tag_add:hover { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_tag_input {
            border: 1px solid #0073bb !important;
            border-radius: 999px !important;
            padding: 2px 10px !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            min-width: 130px !important;
            outline: none !important;
            background: #fff !important;
            color: #16191f !important;
        }
        /* The native datalist ▼ sits misaligned inside the pill-shaped input and
           inflates its height; hide it. Autocomplete still works on type / ↓. */
        .tm_tag_input::-webkit-calendar-picker-indicator { display: none !important; }
        body.tm_theme_dark .tm_tag_chip { background: #3a4453 !important; border-color: #55606e !important; color: #c7ccd1 !important; }
        body.tm_theme_dark .tm_tag_chip.tm_no_tags { color: #8a94a0 !important; }
        body.tm_theme_dark .tm_tag_pill { background: #3a4453 !important; border-color: #55606e !important; color: #e9ecef !important; }
        body.tm_theme_dark .tm_tag_editor { border-top-color: #3a4453 !important; }
        body.tm_theme_dark .tm_tag_add { border-color: #55606e !important; color: #adb5bd !important; }
        body.tm_theme_dark .tm_tag_input { background: #2d3542 !important; color: #e9ecef !important; }
        /* Armed (first ✕ click) tag pill — red "click again to remove", matching
           the shortcut chips (whole chip reddens, ✕ becomes white-on-red). */
        .tm_tag_pill.tm_confirm_del {
            border-color: #c0392b !important;
            background-color: #fbeae8 !important;
            color: #c0392b !important;
        }
        .tm_tag_pill.tm_confirm_del .tm_tag_del {
            color: #fff !important;
            background-color: #c0392b !important;
            border-radius: 999px !important;
        }
        body.tm_theme_dark .tm_tag_pill.tm_confirm_del {
            border-color: #e06060 !important;
            background-color: #4a2222 !important;
            color: #f0a0a0 !important;
        }
        body.tm_theme_dark .tm_tag_pill.tm_confirm_del .tm_tag_del {
            color: #4a2222 !important;
            background-color: #f0a0a0 !important;
        }

        /* Start View modal — every choice is one pick chip, grouped by a right-
           aligned label (Views / Shortcuts / Tags), mirroring the main filter
           panel. The active start view is highlighted with a ✓. The modal card
           is always white, so no dark-theme variants are needed. */
        .tm_sv_grid {
            display: grid !important;
            grid-template-columns: auto 1fr !important;
            gap: 11px 12px !important;
            align-items: baseline !important;
            margin: 2px 0 18px 0 !important;
        }
        .tm_sv_rowlabel {
            text-align: right !important;
            color: #6c757d !important;
            font-size: 12px !important;
            white-space: nowrap !important;
        }
        .tm_sv_chips { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
        .tm_sv_pick {
            border: 1px solid #d5d9de !important;
            background: #f6f8fa !important;
            color: #24292f !important;
            border-radius: 15px !important;
            padding: 3px 12px !important;
            font-size: 13px !important;
            cursor: pointer !important;
            font-family: inherit !important;
        }
        .tm_sv_pick:hover:not(:disabled) { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_sv_pick:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }
        .tm_sv_pick.tm_sv_active {
            border-color: #0073bb !important;
            background: #e7f2fb !important;
            color: #0073bb !important;
            font-weight: 600 !important;
        }
        .tm_sv_footer {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-top: 1px solid #eee !important;
            padding-top: 14px !important;
        }
        .tm_sv_footer_left { display: flex !important; gap: 8px !important; }
        .tm_sv_btn {
            padding: 7px 14px !important;
            border: 1px solid #ccc !important;
            background: white !important;
            color: #16191f !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-family: inherit !important;
        }
        .tm_sv_btn:hover:not(:disabled) { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_sv_btn:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }

        body.tm_theme_dark .tm_account_id {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_account_id:hover {
            border-color: #3182ce !important;
            background-color: #5a6678 !important;
        }

        .saml-role span[style*="clear"] {
            display: none !important;
        }

        /* Flatten this wrapper too, so account id / service / region / sign in
           become direct grid items of .saml-role. */
        .tm_role_buttons {
            display: contents !important;
        }

        .tm_role_button {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            white-space: nowrap !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
        }

        .tm_role_button.primary {
            background: #0073bb !important;
            color: #fff !important;
            border-color: #0073bb !important;
        }

        .tm_role_button:hover {
            background: #f8f9fa !important;
            transform: translateY(-1px) !important;
        }

        .tm_role_button.primary:hover {
            background: #005a94 !important;
        }

        .tm_service_dropdown {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            width: 150px !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
        }

        .tm_service_dropdown:hover {
            border-color: #0073bb !important;
        }

        .tm_service_dropdown:focus {
            outline: none !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0, 115, 187, 0.2) !important;
        }

        body.tm_theme_dark .tm_service_dropdown {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_service_dropdown:hover {
            border-color: #3182ce !important;
        }

        .tm_region_dropdown {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            width: 190px !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
        }
        .tm_region_dropdown:hover { border-color: #0073bb !important; }
        .tm_region_dropdown:focus {
            outline: none !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0, 115, 187, 0.2) !important;
        }
        body.tm_theme_dark .tm_region_dropdown {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }
        body.tm_theme_dark .tm_region_dropdown:hover { border-color: #3182ce !important; }

        .tm_favorite_button {
            padding: 4px 8px !important;
            border: 1px solid #ffc107 !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #ffc107 !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: normal !important;
            transition: all 0.2s ease !important;
            min-width: 32px !important;
            text-align: center !important;
            flex-shrink: 0 !important;
        }

        .tm_favorite_button:hover {
            background: #fff3cd !important;
            transform: scale(1.1) !important;
        }

        .tm_favorite_button.favorited {
            background: #ffc107 !important;
            color: #fff !important;
            border-color: #ffc107 !important;
        }

        .tm_favorite_button.favorited:hover {
            background: #e0a800 !important;
            border-color: #d39e00 !important;
        }

        .tm_toast {
            position: fixed !important;
            bottom: 40px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 10px 20px !important;
            border-radius: 4px !important;
            color: #fff !important;
            z-index: 10000 !important;
            font-size: 14px !important;
        }

        .tm_toast.success { background-color: #28a745 !important; }
        .tm_toast.error { background-color: #dc3545 !important; }
        .tm_toast.info { background-color: #17a2b8 !important; }

        /* Tighten AWS's default 20px form margin so the footer doesn't float in
           a large void below the role list. */
        #saml_form {
            margin-bottom: 8px !important;
        }

        #tm_footer {
            text-align: center !important;
            color: #6c757d !important;
            font-size: 12px !important;
            padding: 10px 20px !important;
            background-color: #f8f9fa !important;
            margin-top: 0px !important;
            margin-bottom: 6px !important;
            transition: background-color 0.3s ease !important;
        }

        #tm_footer a {
            color: #0073bb !important;
            text-decoration: none !important;
        }

        body.tm_theme_dark #tm_footer {
            background-color: #2d3748 !important;
            color: #a0aec0 !important;
        }

        body.tm_theme_dark #tm_footer a {
            color: #63b3ed !important;
        }

        /* Keyboard-shortcut keys inside any modal: render as actual key chips
           so they're readable in both themes. The browser default <kbd> style
           is invisible on a white card. */
        [id$="_modal"] kbd {
            display: inline-block !important;
            padding: 1px 6px !important;
            margin: 0 2px !important;
            border: 1px solid #ccc !important;
            border-bottom-width: 2px !important;
            border-radius: 4px !important;
            background: #f6f8fa !important;
            color: #24292e !important;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
        }
        body.tm_theme_dark [id$="_modal"] kbd {
            border-color: #4a5568 !important;
            background: #1a202c !important;
            color: #cbd5e0 !important;
        }

        /* Inputs / textareas / selects inside any modal: in dark mode use a
           dark surface and light text. Inline background:white styles on
           inputs/textareas are caught separately by the modal MutationObserver
           remap; this rule handles the much commoner case where the element
           has no inline background/color (so the CSS isn't fighting
           !important shorthand) and yet still needs a dark surface. */
        body.tm_theme_dark [id$="_modal"] input[type="text"],
        body.tm_theme_dark [id$="_modal"] input[type="search"],
        body.tm_theme_dark [id$="_modal"] input[type="number"],
        body.tm_theme_dark [id$="_modal"] input[type="email"],
        body.tm_theme_dark [id$="_modal"] input[type="url"],
        body.tm_theme_dark [id$="_modal"] textarea,
        body.tm_theme_dark [id$="_modal"] select {
            background-color: #1a202c !important;
            color: #e9ecef !important;
            border-color: #4a5568 !important;
        }
        body.tm_theme_dark [id$="_modal"] input::placeholder,
        body.tm_theme_dark [id$="_modal"] textarea::placeholder {
            color: #718096 !important;
        }

        /* Compact mode tightens the vertical rhythm without shrinking the rows
           themselves: the panel's own padding, the gap between filter rows, and
           the gap between result rows. Each result row keeps its full internal
           padding, height and control sizes — only the space BETWEEN rows
           shrinks — so nothing ever looks cramped. */
        body.tm_compact_mode #tm_interface_wrapper {
            padding: 8px !important;
        }

        body.tm_compact_mode .tm_left_column,
        body.tm_compact_mode .tm_right_column,
        body.tm_compact_mode #tm_jump_section {
            gap: 5px !important;
        }

        body.tm_compact_mode .tm_frow_shortcuts {
            padding-top: 5px !important;
        }

        /* The result-row gap is a flex gap on #tm_role_list; compact shrinks
           it there (8px to 2px) — see the #tm_role_list rules above. Rows keep
           their full padding/height/controls, so nothing looks cramped. */

        #smallprint {
            background-color: #f8f9fa !important;
            border-top: 1px solid #e7e7e7 !important;
            padding: 8px 20px !important;
            margin-top: 0px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease !important;
        }

        body.tm_theme_dark #smallprint {
            background-color: #2d3748 !important;
            border-color: #4a5568 !important;
            color: #e9ecef !important;
        }

        .language-dropdown {
            display: none !important;
        }

        #smallprint .textinput {
            font-size: 12px !important;
            color: #6c757d !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            text-align: center !important;
        }

        body.tm_theme_dark #smallprint .textinput {
            color: #a0aec0 !important;
        }

        #smallprint .termsandprivacy {
            color: #0073bb !important;
            text-decoration: none !important;
            font-size: 12px !important;
            margin: 0 8px !important;
            display: inline !important;
        }

        #smallprint .termsandprivacy:hover {
            text-decoration: underline !important;
        }

        body.tm_theme_dark #smallprint .termsandprivacy {
            color: #63b3ed !important;
        }

        #smallprint .textinput br {
            line-height: 1.2 !important;
        }
    `;

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Load services and last selections before transforming roles (needed for dropdown generation)
  await ServicesManager.loadCache();
  await ServicesManager.loadLastServicesCache();
  await RegionsManager.loadCache();
  await RegionsManager.loadLastRegionsCache();
  await AccountNamesManager.loadCache();
  await AccountTagsManager.loadCache();
  await AssumeProfilesManager.loadCache();
  jumpRecentsCache = await StorageManager.getJumpRecents();
  jumpPinnedCache = await StorageManager.getJumpPinned();
  // Pattern caches must be loaded before filtering / styling kicks in.
  await EnvironmentsManager.loadCache();
  await OrganizationsManager.loadCache();
  await AccountTypesManager.loadCache();
  await RolesManager.loadCache();
  await GeneralSettingsManager.loadCache();
  await RecentRolesManager.loadCache();
  await RoleOrderManager.loadCache();
  // Now that all caches are populated, paint the configurable filter rows
  // and reflect the configured homepage URL in the footer.
  renderAllFilterRows();
  updateHomepageFooter();

  // --- Transform each role to add buttons and account info ---
  $(".saml-role").each(function () {
    const $role = $(this);
    const $radio = $role.find('input[type="radio"]');
    const $label = $role.find("label, .saml-role-description");

    if ($radio.length && $label.length) {
      const roleArn = $radio.val();
      const roleName = $label.text().trim();

      const $account = $role.closest(".saml-account");
      const accountText =
        $account.prev().find(".saml-account-name").text().trim() ||
        $account
          .prevAll(".expandable-container")
          .first()
          .find(".saml-account-name")
          .text()
          .trim();

      const accountInfo = parseAccountInfo(accountText);

      // Account name / role name / role ARN are echoed from the SAML
      // page, which itself reflects IdP-supplied strings. Escape them on
      // the way back into HTML so a maliciously-crafted role label can't
      // execute script in the role picker.
      const displayName = AccountNamesManager.nameFor(accountInfo.id) || accountInfo.name;
      const safeAccountName = escapeHtml(displayName);
      const safeAwsName     = escapeHtml(accountInfo.name);
      const safeAccountId   = escapeHtml(accountInfo.id);
      const safeRoleName    = escapeHtml(roleName);
      const safeRoleArn     = escapeHtml(roleArn);

      const roleInfoHTML = `
                <div class="tm_role_info">
                    <button type="button" class="tm_favorite_button" data-role-arn="${safeRoleArn}" title="Add to favorites">☆</button>
                    <div class="tm_account_name" data-account-id="${safeAccountId}" data-aws-name="${safeAwsName}">${safeAccountName}</div>
                    <div class="tm_tag_cell">${tagChipHTML(accountInfo.id)}</div>
                    <div class="tm_role_name">${safeRoleName}</div>
                </div>
                <div class="tm_role_buttons">
                    <button type="button" class="tm_account_id" data-account-id="${safeAccountId}" title="Click to copy account ID">${safeAccountId}</button>
                    ${ServicesManager.generateDropdownHTML(roleArn, accountInfo.id)}
                    ${RegionsManager.generateRegionDropdownHTML(roleArn)}
                    <button type="button" class="tm_role_button primary tm_signin_button" data-role-arn="${safeRoleArn}" title="Sign in — ⌘/Ctrl-click or middle-click toggles new tab">Sign In</button>
                </div>
                <div class="tm_tag_editor" data-account-id="${safeAccountId}">${tagEditorHTML(accountInfo.id)}</div>
            `;

      $role.append(roleInfoHTML);
    }
  });

  // Flatten roles into a single container and apply the user's saved order.
  // Must come after the transform so .tm_signin_button (and its data-role-arn)
  // exist on every row.
  RoleOrderManager.ensureList();
  RoleOrderManager.applySavedOrder();

  // --- Handle Copy Account ID button ---
  // Click the account-id pill to copy it (replaces the old Copy Account ID button).
  $("body").on("click", ".tm_account_id", async function (e) {
    e.preventDefault();
    const accountId = (this.textContent || "").trim();
    if (!accountId) return;
    const ok = await copyTextToClipboard(accountId);
    showToast(
      ok ? `Account ID ${accountId} copied!` : `Failed to copy ${accountId}`,
      ok ? "success" : "error",
      CONFIG.TOAST_DURATION_LONG
    );
  });

  // --- Handle Sign In button ---
  // Hold ⌘ (Mac) / Ctrl, or middle-click, to open the AWS console in a new
  // tab. Without a modifier the SAML form submits in the current tab as
  // before (since AWS treats this as a fresh navigation).
  $("body").on("click auxclick", ".tm_signin_button", async function (e) {
    if (e.type === "auxclick" && e.button !== 1) return; // only middle-click counts
    e.preventDefault();
    // The toggle sets the default for a plain click; a modifier (⌘/Ctrl or
    // middle-click) inverts it, so both behaviours stay one click away.
    const modifier = !!(e.metaKey || e.ctrlKey || (e.type === "auxclick" && e.button === 1));
    const newTab = signinNewTab !== modifier;
    const $button = $(this);
    const roleArn = $button.data("role-arn");
    const $role = $button.closest(".saml-role");
    const servicePath = $role.find(".tm_service_dropdown").val();
    const region = $role.find(".tm_region_dropdown").val();
    const roleName = $role.find(".tm_role_name").text().trim();
    const accountName = $role.find(".tm_account_name").text().trim();
    const accountId = $role.find(".tm_account_id").text().trim();
    const env = getEnvironmentType($role);

    // Gate sensitive sign-ins behind a confirmation modal.
    const reasons = sensitiveSignInReasons(roleName, accountName, accountId);
    if (reasons.length > 0) {
      const ok = await confirmSensitiveSignIn(accountName, accountId, roleName, reasons);
      if (!ok) return;
    }

    if (region) await RegionsManager.saveLastRegion(roleArn, region);

    if (servicePath) {
      await ServicesManager.saveLastService(roleArn, servicePath);
      showToast(`Signing in to ${roleName}${newTab ? " (new tab)" : ""}…`, "info", 2000);
    } else {
      showToast(`Signing in to ${roleName} (console${newTab ? ", new tab" : ""})…`, "info", 2000);
    }

    const labelPayload = {
      account: accountName,
      role: roleName,
      env,
      // Pass the env color + letter so console-decorator.js doesn't need
      // hardcoded knowledge of which env ids exist or how they look.
      envColor: env !== "default" ? EnvironmentsManager.colorFor(env) : "",
      envLetter: env !== "default" ? EnvironmentsManager.letterFor(env) : "",
    };
    // Tab-group hints passed through to the service worker via the URL
    // fragment payload:
    //   - tag (toolbar override) wins if non-empty
    //   - otherwise SW honours `groupMode`: "role" / "org" / "off"
    //   - for "org" mode we send the classified org id as well
    if (tabGroupTagCache) labelPayload.tag = tabGroupTagCache;
    labelPayload.groupMode = tabGroupModeCache;
    if (tabGroupModeCache === "org") {
      const orgId = OrganizationsManager.classify(accountName, accountId);
      if (orgId) {
        // Send the user's display label (e.g. "ACME Corp") rather than the
        // slug id (e.g. "acme-corp") so the Chrome tab group title matches
        // what the user typed in Organizations.
        const entry = OrganizationsManager.findEntry(orgId);
        labelPayload.org = (entry && entry.label) ? entry.label : orgId;
      }
    }
    await RecentRolesManager.recordSignIn(roleArn);
    signInToRole(roleArn, buildDestination(servicePath, labelPayload, region), {
      newTab,
    });
  });

  // --- Handle region dropdown change (just remember, don't sign in) ---
  $("body").on("change", ".tm_region_dropdown", async function () {
    const $dropdown = $(this);
    const region = $dropdown.val();
    const roleArn = $dropdown.data("role-arn");
    if (region) await RegionsManager.saveLastRegion(roleArn, region);
  });

  // --- Handle service dropdown change (just remember, don't sign in) ---
  $("body").on("change", ".tm_service_dropdown", async function () {
    const $dropdown = $(this);
    const servicePath = $dropdown.val();
    const roleArn = $dropdown.data("role-arn");

    // Save selection for this role
    await ServicesManager.saveLastService(roleArn, servicePath);

    if (servicePath) {
      const serviceName = $dropdown.find("option:selected").text();
      showToast(`${serviceName} selected - click Sign In`, "info", CONFIG.TOAST_DURATION_SHORT);
    }
  });

  // --- Handle favorite button clicks ---
  $("body").on("click", ".tm_favorite_button", async function (e) {
    e.preventDefault();
    const $button = $(this);
    const roleArn = $button.data("role-arn");
    const $role = $button.closest(".saml-role");
    const accountName = $role.find(".tm_account_name").text().trim();
    const roleName = $role.find(".tm_role_name").text().trim();

    debug("Favorite button clicked:", roleArn, accountName, roleName);
    await FavoritesManager.toggleFavorite(roleArn, accountName, roleName);
  });

  // --- Account tags: chip toggles the row's inline editor; ✕ removes a tag;
  //     "+ tag" opens an autocompleted input (Enter/comma commit, Esc cancels,
  //     focusout commits any pending value). Tags are per-account, so edits
  //     refresh every role row of that account via updateTagUIForAccount. ---
  $("body").on("click", ".tm_tag_chip", function (e) {
    e.preventDefault();
    const row = this.closest(".saml-role");
    if (!row) return;
    const open = row.classList.toggle("tm_tags_open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      // Opening a row drops straight into a ready input — no second click.
      const addBtn = row.querySelector(".tm_tag_add");
      if (addBtn) openTagInput(addBtn);
    } else {
      // Collapsing commits any pending text and restores the button.
      const input = row.querySelector(".tm_tag_input");
      if (input) input.blur();
    }
  });

  // ✕ on a tag pill — two-step confirm, matching the shortcut chips and jump
  // rows: first click arms the pill (red), a second click removes the tag.
  $("body").on("click", ".tm_tag_del", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const del = this;
    twoStepDelete($(this).closest(".tm_tag_pill"), this, async () => {
      const id = del.getAttribute("data-account-id");
      await AccountTagsManager.removeTag(id, del.getAttribute("data-tag"));
      updateTagUIForAccount(id);
    });
  });

  $("body").on("click", ".tm_tag_add", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openTagInput(this);
  });

  $("body").on("keydown", ".tm_tag_input", async function (e) {
    const id = this.getAttribute("data-account-id");
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = this.value.trim();
      this.value = "";
      if (val) {
        await AccountTagsManager.addTag(id, val);
        updateTagUIForAccount(id);
        populateTagVocab();
        this.focus();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.value = "";
      this.replaceWith(makeTagAddButton(id));
    }
  });

  $("body").on("focusout", ".tm_tag_input", async function () {
    if (!this.isConnected) return; // already removed by Enter/Escape
    const id = this.getAttribute("data-account-id");
    const val = this.value.trim();
    this.replaceWith(makeTagAddButton(id));
    if (val) {
      await AccountTagsManager.addTag(id, val);
      updateTagUIForAccount(id);
    }
  });

  // --- Handle theme toggle ---
  $("body").on("click", CONFIG.SELECTORS.THEME_TOGGLE, async function (e) {
    e.preventDefault();
    await ThemeManager.toggleTheme();
  });

  // --- Handle compact toggle ---
  $("body").on("click", CONFIG.SELECTORS.COMPACT_TOGGLE, async function (e) {
    e.preventDefault();
    const newCompactMode = !compactMode;
    const saved = await CompactManager.saveSetting(newCompactMode);
    if (saved) {
      CompactManager.updateButton();
      showToast(
        `Compact mode ${newCompactMode ? "enabled" : "disabled"}!`,
        "info",
        CONFIG.TOAST_DURATION_LONG
      );
    }
  });

  // --- Handle sign-in tab option (opens a modal, like Tab Groups) ---
  $("body").on("click", CONFIG.SELECTORS.SIGNIN_TAB_TOGGLE, function (e) {
    e.preventDefault();
    showSigninTabModal();
  });

  // --- Handle manage shortcuts ---
  $("body").on("click", "#tm_manage_shortcuts", function (e) {
    e.preventDefault();
    showShortcutsModal();
  });

  // --- Handle manage services ---
  $("body").on("click", "#tm_manage_services", function (e) {
    e.preventDefault();
    showServicesModal();
  });

  $("body").on("click", "#tm_manage_regions", function (e) {
    e.preventDefault();
    showRegionsModal();
  });

  $("body").on("click", "#tm_manage_account_names", function (e) {
    e.preventDefault();
    showAccountNamesModal();
  });

  $("body").on("click", "#tm_manage_account_tags", function (e) {
    e.preventDefault();
    showAccountTagsModal();
  });

  $("body").on("click", "#tm_manage_assume_profiles", function (e) {
    e.preventDefault();
    showAssumeProfilesModal();
  });

  const doJump = () =>
    jumpToAccount($("#tm_jump_org").val(), $("#tm_jump_account").val(), $("#tm_jump_label").val());

  $("body").on("click", "#tm_jump_pill", function (e) {
    e.preventDefault();
    if (jumpPopoverOpen) closeJumpPopover();
    else openJumpPopover();
  });

  $("body").on("click", "#tm_jump_go", function (e) {
    e.preventDefault();
    doJump();
  });

  $("body").on("keydown", "#tm_jump_account, #tm_jump_label", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      doJump();
    }
  });

  // Clearable account-id field — same ✕ affordance as the custom-tag field.
  $("body").on("input", "#tm_jump_account", function () {
    syncFieldClear("tm_jump_account", "tm_jump_account_wrap");
  });
  $("body").on("click", "#tm_jump_account_clear", function (e) {
    e.preventDefault();
    const inp = document.getElementById("tm_jump_account");
    if (inp) {
      inp.value = "";
      inp.focus();
    }
    syncFieldClear("tm_jump_account", "tm_jump_account_wrap");
  });

  // Clearable session-label field — same ✕ affordance.
  $("body").on("input", "#tm_jump_label", function () {
    syncFieldClear("tm_jump_label", "tm_jump_label_wrap");
  });
  $("body").on("click", "#tm_jump_label_clear", function (e) {
    e.preventDefault();
    const inp = document.getElementById("tm_jump_label");
    if (inp) {
      inp.value = "";
      inp.focus();
    }
    syncFieldClear("tm_jump_label", "tm_jump_label_wrap");
  });

  $("body").on("click", ".tm_jump_recent", function (e) {
    // The ★/✕ actions sit inside the row; leave those clicks to their handlers.
    if (e.target.closest && e.target.closest(".tm_jump_action")) return;
    e.preventDefault();
    jumpToAccount(
      $(this).attr("data-org"),
      $(this).attr("data-account"),
      $(this).attr("data-label")
    );
  });

  // ★ toggles pin/unpin on a jump row.
  $("body").on("click", ".tm_jump_pin", function (e) {
    e.preventDefault();
    const $row = $(this).closest(".tm_jump_recent");
    const org = $row.attr("data-org");
    const account = $row.attr("data-account");
    if ($row.attr("data-pinned") === "1") unpinJump(org, account);
    else pinJump(org, account);
  });

  // --- Two-step confirm delete, shared by saved-view chips and jump rows.
  // First click on a ✕ arms its element (.tm_confirm_del → red "click again");
  // a second click deletes. Auto-cancels after a few seconds, or on any click
  // that isn't inside the armed element. delEl is the ✕ whose tooltip we flip.
  let confirmDelArmTimer = null;
  const disarmConfirmDelete = () => {
    if (!confirmDelArmTimer) return; // nothing armed → the class can't be present
    clearTimeout(confirmDelArmTimer);
    confirmDelArmTimer = null;
    $(".tm_confirm_del").removeClass("tm_confirm_del");
  };
  const armConfirmDelete = ($el, delEl) => {
    disarmConfirmDelete();
    $el.addClass("tm_confirm_del");
    if (delEl && delEl.setAttribute) delEl.setAttribute("title", "Click again to remove");
    confirmDelArmTimer = setTimeout(disarmConfirmDelete, 3500);
  };
  // Drive a ✕ click's two-step: first click arms $armEl (red "click again"),
  // second confirms. Shared by the shortcut chips, jump rows, and tag pills.
  const twoStepDelete = ($armEl, delEl, onConfirm) => {
    if ($armEl.hasClass("tm_confirm_del")) {
      disarmConfirmDelete();
      onConfirm();
    } else {
      armConfirmDelete($armEl, delEl);
    }
  };
  // Any click not inside the armed element cancels the pending delete.
  $("body").on("click", function (e) {
    const t = e.target;
    if (t && t.closest && t.closest(".tm_confirm_del")) return;
    disarmConfirmDelete();
  });

  // ✕ deletes a jump row (from recents or pinned) — two-step confirm, matching
  // the saved-view chips: first click arms the ✕ (red), second click deletes.
  $("body").on("click", ".tm_jump_del", function (e) {
    e.preventDefault();
    const $del = $(this);
    twoStepDelete($del, this, () => {
      const $row = $del.closest(".tm_jump_recent");
      deleteJump($row.attr("data-org"), $row.attr("data-account"));
    });
  });

  // Close the jump popover on any click outside it (and outside its pill).
  $("body").on("click", function (e) {
    if (!jumpPopoverOpen) return;
    const t = e.target;
    if (t && t.closest && (t.closest("#tm_jump_popover") || t.closest("#tm_jump_pill"))) return;
    closeJumpPopover();
  });

  $("body").on("click", "#tm_start_view", function (e) {
    e.preventDefault();
    showStartViewModal();
  });

  $("body").on("click", "#tm_clear_sessions", function (e) {
    e.preventDefault();
    showClearSessionsModal();
  });

  // Show shortcuts management modal
  const showShortcutsModal = () => {
    const currentShortcuts = customShortcutsCache
      .map((s) => `${s.label}: "${s.search}"`)
      .join("\n");

    const modalHTML = `
            <div id="tm_shortcuts_modal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important;
                z-index: 10000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            ">
                <div style="
                    background: white !important;
                    border-radius: 8px !important;
                    padding: 20px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Custom Shortcuts</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        Create shortcuts with a label and search string. Each line: <code>Label: "search text"</code>.
                        Shortcuts saved from the search box also remember their filter chips — those are kept as long as you don't rename the label.
                    </p>
                    <textarea id="tm_shortcuts_input" style="
                        width: 100% !important;
                        height: 200px !important;
                        border: 1px solid #ccc !important;
                        border-radius: 4px !important;
                        padding: 10px !important;
                        font-family: monospace !important;
                        font-size: 13px !important;
                        resize: vertical !important;
                        box-sizing: border-box !important;
                    " placeholder="My Sandbox: &quot;sandbox&quot;
Prod Account: &quot;prod&quot;
Account 123456789012: &quot;123456789012&quot;">${currentShortcuts}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_shortcuts_cancel" style="
                            padding: 8px 16px !important;
                            margin-right: 10px !important;
                            border: 1px solid #ccc !important;
                            background: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_shortcuts_save" style="
                            padding: 8px 16px !important;
                            border: 1px solid #0073bb !important;
                            background: #0073bb !important;
                            color: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_shortcuts_cancel, #tm_shortcuts_modal").on("click", function (e) {
      if (e.target === this) {
        $("#tm_shortcuts_modal").remove();
      }
    });

    $("#tm_shortcuts_save").on("click", async function () {
      const input = $("#tm_shortcuts_input").val().trim();
      const shortcuts = [];

      if (input) {
        const lines = input.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          // .*? (not .+?) so a filters-only view, which renders as Label: "",
          // survives a round-trip through this editor instead of being dropped.
          const match = line.match(/^(.+?):\s*["'](.*?)["']\s*$/);
          if (match) {
            const label = match[1].trim();
            // Views saved from the search box also carry filter chips, which
            // this text format can't express — keep them while the label matches.
            const prev = customShortcutsCache.find((s) => s.label === label);
            shortcuts.push({
              label,
              search: match[2].trim(),
              filters: prev ? prev.filters : undefined,
            });
          }
        }
      }
      // Re-issue ids so two labels that normalise the same don't share a chip.
      const takenIds = new Set();
      shortcuts.forEach((s) => {
        s.id = ShortcutsManager.uniqueId(s.label, takenIds);
        takenIds.add(s.id);
      });

      const saved = await ShortcutsManager.saveShortcuts(shortcuts);
      if (saved) {
        ShortcutsManager.updateSection();
        $("#tm_shortcuts_modal").remove();
        showToast("Shortcuts saved!", "success", CONFIG.TOAST_DURATION_LONG);
      }
    });
  };

  // Show services management modal
  const showServicesModal = () => {
    const currentServices = servicesCache
      .map((s) => `${s.name}: "${s.path}"`)
      .join("\n");

    const modalHTML = `
            <div id="tm_services_modal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important;
                z-index: 10000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            ">
                <div style="
                    background: white !important;
                    border-radius: 8px !important;
                    padding: 20px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">AWS Services</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        Configure quick-access services. Each line: <code>Service Name: "console/path"</code>.
                        Use <code>{region}</code> as a placeholder for the region from General Settings.
                    </p>
                    <textarea id="tm_services_input" style="
                        width: 100% !important;
                        height: 250px !important;
                        border: 1px solid #ccc !important;
                        border-radius: 4px !important;
                        padding: 10px !important;
                        font-family: monospace !important;
                        font-size: 13px !important;
                        resize: vertical !important;
                        box-sizing: border-box !important;
                    " placeholder="CloudWatch: &quot;cloudwatch/home?region={region}&quot;
S3: &quot;s3/home?region={region}&quot;
EC2: &quot;ec2/home?region={region}&quot;
IAM: &quot;iam/home&quot;">${currentServices}</textarea>
                    <div style="margin-top: 10px !important;">
                        <button id="tm_services_reset" style="
                            padding: 6px 12px !important;
                            border: 1px solid #dc3545 !important;
                            background: white !important;
                            color: #dc3545 !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                            font-size: 12px !important;
                        ">Reset to Defaults</button>
                    </div>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_services_cancel" style="
                            padding: 8px 16px !important;
                            margin-right: 10px !important;
                            border: 1px solid #ccc !important;
                            background: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_services_save" style="
                            padding: 8px 16px !important;
                            border: 1px solid #0073bb !important;
                            background: #0073bb !important;
                            color: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_services_cancel, #tm_services_modal").on("click", function (e) {
      if (e.target === this) {
        $("#tm_services_modal").remove();
      }
    });

    $("#tm_services_reset").on("click", function () {
      const defaultServices = CONFIG.DEFAULT_SERVICES
        .map((s) => `${s.name}: "${s.path}"`)
        .join("\n");
      $("#tm_services_input").val(defaultServices);
      showToast("Reset to defaults - click Save to apply", "info", CONFIG.TOAST_DURATION_LONG);
    });

    $("#tm_services_save").on("click", async function () {
      const input = $("#tm_services_input").val().trim();
      const services = [];

      if (input) {
        const lines = input.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          const match = line.match(/^(.+?):\s*["'](.+?)["']\s*$/);
          if (match) {
            const name = match[1].trim();
            const path = match[2].trim();
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
            services.push({ id, name, path });
          }
        }
      }

      if (services.length === 0) {
        showToast("Please add at least one service", "error");
        return;
      }

      const saved = await ServicesManager.saveServices(services);
      if (saved) {
        $("#tm_services_modal").remove();
        showToast("Services saved! Refresh page to see changes in dropdowns.", "success", CONFIG.TOAST_DURATION);
      }
    });
  };

  // Re-apply custom account names to the already-rendered rows in place, so a
  // Save reflects immediately without a full page reload (reloading the SAML
  // POST page is fragile). Each name cell carries its account id and original
  // AWS name as data-* attributes, so we can both apply and clear renames.
  const refreshAccountNames = () => {
    $(".tm_account_name").each(function () {
      const id = this.getAttribute("data-account-id") || "";
      const awsName = this.getAttribute("data-aws-name") || "";
      this.textContent = AccountNamesManager.nameFor(id) || awsName;
    });
    // Re-filter (this also re-runs environment styling) so a rename that
    // changes which env / org / type a row matches is reflected at once.
    FilterManager.applyFilters();
  };

  const showAccountNamesModal = () => {
    const current = formatAccountNameLines(accountNamesCache);
    const modalHTML = `
            <div id="tm_account_names_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 520px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Account Names</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.45 !important;">
                        Give specific accounts a friendlier name. One per line:
                        <code>123456789012: My Friendly Name</code>. The custom name
                        <strong>replaces</strong> the AWS account name in the list and is
                        used for filtering, grouping and tab titles. Leave the box empty
                        to clear all custom names.
                    </p>
                    <textarea id="tm_account_names_input" style="
                        width: 100% !important; height: 220px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="123456789012: Prod Logging&#10;999999999999: Security Audit">${escapeHtml(current)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_account_names_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_account_names_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_account_names_cancel, #tm_account_names_modal").on("click", function (e) {
      if (e.target === this) $("#tm_account_names_modal").remove();
    });

    $("#tm_account_names_save").on("click", async function () {
      const map = parseAccountNameLines($("#tm_account_names_input").val());
      const saved = await AccountNamesManager.save(map);
      if (saved) {
        $("#tm_account_names_modal").remove();
        refreshAccountNames();
        showToast("Account names updated.", "success", CONFIG.TOAST_DURATION);
      }
    });
  };

  // Re-render every row's tag chip + pills after a bulk edit, then re-filter.
  const refreshAllTagUI = () => {
    document.querySelectorAll(".tm_tag_chip[data-account-id]").forEach(paintTagChip);
    document.querySelectorAll(".tm_tag_editor[data-account-id] .tm_tag_pills").forEach(paintTagPills);
    renderTagFilterRow();
    FilterManager.applyFilters(true);
  };

  const showAccountTagsModal = () => {
    const current = formatAccountTagLines(accountTagsCache);
    const modalHTML = `
            <div id="tm_account_tags_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 520px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Account Tags</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.45 !important;">
                        Attach free-text tags to accounts so you can find them by concept,
                        not just by name. One account per line:
                        <code>123456789012: palo alto, firewall, pci</code>. Tags may contain
                        spaces, and searching any tag surfaces the account. Leave the box empty
                        to clear all tags.
                    </p>
                    <textarea id="tm_account_tags_input" style="
                        width: 100% !important; height: 220px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="123456789012: palo alto, firewall&#10;999999999999: splunk, siem">${escapeHtml(current)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_account_tags_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_account_tags_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_account_tags_cancel, #tm_account_tags_modal").on("click", function (e) {
      if (e.target === this) $("#tm_account_tags_modal").remove();
    });

    $("#tm_account_tags_save").on("click", async function () {
      const map = parseAccountTagLines($("#tm_account_tags_input").val());
      const saved = await AccountTagsManager.save(map);
      if (saved) {
        $("#tm_account_tags_modal").remove();
        refreshAllTagUI();
        showToast("Account tags updated.", "success", CONFIG.TOAST_DURATION);
      }
    });
  };

  // --- Jump to account: sign into an org's hub, then chain (Switch Role) into
  // a destination account the hub is trusted to assume. Config lives in the
  // Assume Profiles panel; the target rides the #hop payload and the
  // console-side decorator completes the switch on the hub console.
  const findRoleArnForAccount = (accountId) => {
    let arn = "";
    $(".saml-role").each(function () {
      if (arn) return;
      if ($(this).find(".tm_account_id").text().trim() === accountId) {
        arn = $(this).find(".tm_signin_button").attr("data-role-arn") || "";
      }
    });
    return arn;
  };

  const computeDestEnv = (accountId) => {
    const env = EnvironmentsManager.classify("", accountId);
    if (!env || env === "default") return { envColor: "", envLetter: "" };
    return { envColor: EnvironmentsManager.colorFor(env), envLetter: EnvironmentsManager.letterFor(env) };
  };

  const closeJumpPopover = () => {
    $("#tm_jump_popover").css("display", "none");
    jumpPopoverOpen = false;
  };

  const recordJump = async (org, account, label, role) => {
    const entry = { org, account, label: (label || "").trim(), role: role || "", ts: Date.now() };
    // If the destination is pinned, refresh that pinned entry (keep it pinned)
    // instead of also spawning a recent for it.
    const pi = jumpPinnedCache.findIndex((r) => r.org === org && r.account === account);
    if (pi !== -1) {
      jumpPinnedCache[pi] = { ...jumpPinnedCache[pi], label: entry.label, role: entry.role, ts: entry.ts };
      await StorageManager.saveJumpPinned(jumpPinnedCache);
      return;
    }
    const rest = jumpRecentsCache.filter((r) => !(r.org === org && r.account === account));
    jumpRecentsCache = [entry, ...rest].slice(0, 6);
    await StorageManager.saveJumpRecents(jumpRecentsCache);
  };

  // Star a recent → move it into the pinned list (survives the 6-recents cap).
  const pinJump = async (org, account) => {
    const idx = jumpRecentsCache.findIndex((r) => r.org === org && r.account === account);
    if (idx === -1) return;
    const entry = jumpRecentsCache[idx];
    jumpRecentsCache = jumpRecentsCache.filter((_, i) => i !== idx);
    const rest = jumpPinnedCache.filter((r) => !(r.org === org && r.account === account));
    jumpPinnedCache = [entry, ...rest].slice(0, 12);
    await StorageManager.saveJumpRecents(jumpRecentsCache);
    await StorageManager.saveJumpPinned(jumpPinnedCache);
    refreshJumpRecents();
  };

  // Unpin → move it back to the top of recents so it doesn't just disappear.
  const unpinJump = async (org, account) => {
    const idx = jumpPinnedCache.findIndex((r) => r.org === org && r.account === account);
    if (idx === -1) return;
    const entry = jumpPinnedCache[idx];
    jumpPinnedCache = jumpPinnedCache.filter((_, i) => i !== idx);
    const rest = jumpRecentsCache.filter((r) => !(r.org === org && r.account === account));
    jumpRecentsCache = [entry, ...rest].slice(0, 6);
    await StorageManager.saveJumpPinned(jumpPinnedCache);
    await StorageManager.saveJumpRecents(jumpRecentsCache);
    refreshJumpRecents();
  };

  // Delete → drop the jump from whichever list holds it.
  const deleteJump = async (org, account) => {
    const match = (r) => r.org === org && r.account === account;
    const inR = jumpRecentsCache.some(match);
    const inP = jumpPinnedCache.some(match);
    if (!inR && !inP) return;
    if (inR) {
      jumpRecentsCache = jumpRecentsCache.filter((r) => !match(r));
      await StorageManager.saveJumpRecents(jumpRecentsCache);
    }
    if (inP) {
      jumpPinnedCache = jumpPinnedCache.filter((r) => !match(r));
      await StorageManager.saveJumpPinned(jumpPinnedCache);
    }
    refreshJumpRecents();
  };

  const jumpToAccount = (profileName, accountRaw, labelRaw) => {
    const profile = AssumeProfilesManager.byName(profileName);
    if (!profile) {
      showToast("Pick an org first.", "error", CONFIG.TOAST_DURATION);
      return;
    }
    const dest = String(accountRaw || "").trim();
    if (!/^\d{12}$/.test(dest)) {
      showToast("Enter a 12-digit destination account ID.", "error", CONFIG.TOAST_DURATION);
      return;
    }
    const hubArn = findRoleArnForAccount(profile.hub);
    if (!hubArn) {
      showToast(
        `Hub account ${profile.hub} isn't in this role list — you can only jump ` +
          `from an org whose hub you can sign into here.`,
        "error",
        CONFIG.TOAST_DURATION_LONG
      );
      return;
    }
    // Cap the label at the source so an oversized value can't reach the tab
    // title, the pending-jump entry, or the recents list (normalizeJumpRecents
    // caps reads at the same 120).
    const label = String(labelRaw || "").trim().slice(0, 120);
    const displayName = label || `${profile.name} · ${dest}`;
    const { envColor, envLetter } = computeDestEnv(dest);

    // Hand-off for the console side: the jumped-into tab lands on a different
    // subdomain, so sessionStorage can't carry the label/colour across. Stash
    // it in the extension's own storage keyed by the destination account; the
    // decorator picks it up on the target console and clears it.
    safeStorageOperation(async () => {
      const cur =
        (await chrome.storage.local.get("hop_pending_jumps"))["hop_pending_jumps"] || {};
      // Prune anything past the decorator's 5-min TTL so an abandoned jump
      // (cancelled at Switch Role, trust failure) can't grow the map unbounded.
      const now = Date.now();
      for (const k of Object.keys(cur)) {
        if (!cur[k] || !cur[k].ts || now - cur[k].ts > 5 * 60 * 1000) delete cur[k];
      }
      cur[dest] = { label: displayName, envColor, envLetter, ts: now };
      await chrome.storage.local.set({ hop_pending_jumps: cur });
    });
    recordJump(profileName, dest, label, profile.role);

    const labelPayload = { chain: { account: dest, role: profile.role, displayName } };
    const region = GeneralSettingsManager.region() || CONFIG.DEFAULT_AWS_REGION;

    // Group this tab up-front, keyed by the DESTINATION account + assumed role
    // and the current grouping settings. A tab keeps its group across
    // navigations, so the group persists through the hub sign-in, the Switch
    // Role page, and the destination console — the jumped session is grouped
    // just like a normal sign-in (the SW ignores this when mode is "off").
    try {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "hop_group_tab",
          account: dest,
          role: profile.role,
          tag: tabGroupTagCache || "",
          mode: tabGroupModeCache || "role",
          org: profile.name || "",
        });
      }
    } catch (e) {
      /* service worker unavailable; grouping is best-effort */
    }

    closeJumpPopover();
    showToast(
      `Signing in to the ${profile.name} hub, then switching into ${dest}…`,
      "info",
      CONFIG.TOAST_DURATION
    );
    signInToRole(hubArn, buildDestination("", labelPayload, region), { newTab: false });
  };

  const refreshJumpOrgs = () => {
    const $sel = $("#tm_jump_org");
    if (!$sel.length) return;
    const profiles = AssumeProfilesManager.all();
    const prev = $sel.val();
    $sel.html(
      profiles
        .map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
        .join("")
    );
    if (prev && profiles.some((p) => p.name === prev)) $sel.val(prev);
  };

  // Rebuild jumpPinnedCache from the current DOM order of the pinned rows —
  // the shared pointer-drag engine calls this (via dragState.onReorder) once a
  // pinned-row reorder settles, mirroring RoleOrderManager.saveCurrentOrder().
  const saveJumpPinnedFromDom = async () => {
    const rows = Array.from(
      document.querySelectorAll('#tm_jump_recents .tm_jump_recent[data-pinned="1"]')
    );
    const keyed = rows
      .map((el) =>
        jumpPinnedCache.find(
          (r) => r.org === el.getAttribute("data-org") && r.account === el.getAttribute("data-account")
        )
      )
      .filter(Boolean);
    for (const e of jumpPinnedCache) if (!keyed.includes(e)) keyed.push(e);
    jumpPinnedCache = keyed;
    await StorageManager.saveJumpPinned(jumpPinnedCache);
  };

  const refreshJumpRecents = () => {
    const $r = $("#tm_jump_recents");
    if (!$r.length) return;
    if (!jumpPinnedCache.length && !jumpRecentsCache.length) {
      $r.html("");
      return;
    }
    // One row, styled like the main role list: ★ toggle first, then the
    // click-to-rejump body (label + account, then org · role), then ✕ delete.
    const renderRow = (r, pinned) => {
      const primary = escapeHtml(r.label || AccountNamesManager.nameFor(r.account) || r.account);
      const acct = escapeHtml(r.account);
      const meta = [r.org, r.role].filter(Boolean).map(escapeHtml).join(" · ");
      const pinLabel = pinned ? "Unpin" : "Pin";
      return (
        `<div class="tm_jump_recent" data-org="${escapeHtml(r.org)}" data-account="${acct}" data-label="${escapeHtml(r.label || "")}" data-pinned="${pinned ? "1" : "0"}" title="${pinned ? "Drag to reorder · click to jump" : "Jump again"}">` +
          `<span class="tm_jump_action tm_jump_pin" role="button" tabindex="-1" title="${pinLabel}" aria-label="${pinLabel}">${pinned ? "★" : "☆"}</span>` +
          `<div class="tm_jump_recent_body">` +
            `<div class="tm_jump_recent_l1"><span class="tm_jump_recent_lbl">${primary}</span><span class="tm_jump_recent_acct">${acct}</span></div>` +
            (meta ? `<div class="tm_jump_recent_meta">${meta}</div>` : "") +
          `</div>` +
          `<span class="tm_jump_action tm_jump_del" role="button" tabindex="-1" title="Delete" aria-label="Delete">✕</span>` +
        `</div>`
      );
    };
    // Pinned first (they always sort to the top — the gold star says it, no
    // header needed), then recents. One flat list like the main role listing.
    $r.html(
      jumpPinnedCache.map((r) => renderRow(r, true)).join("") +
      jumpRecentsCache.map((r) => renderRow(r, false)).join("")
    );
  };

  const openJumpPopover = () => {
    if (!$("#tm_jump_popover").length) return;
    refreshJumpOrgs();
    refreshJumpRecents();
    $("#tm_jump_popover").css("display", "block");
    jumpPopoverOpen = true;
    const acc = document.getElementById("tm_jump_account");
    if (acc) {
      acc.value = "";
      acc.focus();
    }
    syncFieldClear("tm_jump_account", "tm_jump_account_wrap");
    syncFieldClear("tm_jump_label", "tm_jump_label_wrap");
  };

  const refreshJumpBar = () => {
    // Show/hide the whole Jump section (divider + heading + bar) as a unit, so
    // the heading and rule never linger when there are no assume profiles.
    const $section = $("#tm_jump_section");
    if (!$section.length) return;
    if (!AssumeProfilesManager.all().length) {
      closeJumpPopover();
      $section.hide();
      return;
    }
    $section.show();
    if (jumpPopoverOpen) {
      refreshJumpOrgs();
      refreshJumpRecents();
    }
  };

  const showAssumeProfilesModal = () => {
    const current = formatAssumeProfileLines(assumeProfilesCache);
    const modalHTML = `
            <div id="tm_assume_profiles_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 560px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Assume Profiles</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.45 !important;">
                        For accounts you reach by <strong>assuming a role from a hub</strong>
                        (role chaining). One org per line:
                        <code>Org name | 111111111111 | RoleName</code> — the 12-digit
                        <strong>hub</strong> account you sign into, and the <strong>role</strong>
                        to assume in the target. These feed the <em>Jump to account</em> bar.
                        The trust between hub and target must already exist in AWS.
                    </p>
                    <textarea id="tm_assume_profiles_input" style="
                        width: 100% !important; height: 200px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="Acme Prod | 111111111111 | OrgAdmin&#10;Acme Dev | 222222222222 | OrgAdmin">${escapeHtml(current)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_assume_profiles_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_assume_profiles_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_assume_profiles_cancel, #tm_assume_profiles_modal").on("click", function (e) {
      if (e.target === this) $("#tm_assume_profiles_modal").remove();
    });

    $("#tm_assume_profiles_save").on("click", async function () {
      const list = parseAssumeProfileLines($("#tm_assume_profiles_input").val());
      const saved = await AssumeProfilesManager.save(list);
      if (saved) {
        $("#tm_assume_profiles_modal").remove();
        refreshJumpBar();
        showToast("Assume profiles saved.", "success", CONFIG.TOAST_DURATION);
      }
    });
  };

  const showRegionsModal = () => {
    const current = formatRegionLines(regionListCache);
    const modalHTML = `
            <div id="tm_regions_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 500px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Regions</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        One region per line, in the order they should appear in the toolbar switcher.
                        Use <code>code</code> or <code>code: Friendly Label</code>
                        (e.g. <code>eu-west-1: Ireland</code>). The default selection stays whatever
                        you set in <em>General Settings</em>.
                    </p>
                    <textarea id="tm_regions_input" style="
                        width: 100% !important; height: 250px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="us-east-1: US East (N. Virginia)&#10;eu-west-1: Ireland&#10;ap-southeast-2: Sydney">${escapeHtml(current)}</textarea>
                    <div style="margin-top: 10px !important;">
                        <button id="tm_regions_reset" style="
                            padding: 6px 12px !important; border: 1px solid #dc3545 !important; background: white !important;
                            color: #dc3545 !important; border-radius: 4px !important; cursor: pointer !important; font-size: 12px !important;
                        ">Reset to Defaults</button>
                    </div>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_regions_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_regions_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_regions_cancel, #tm_regions_modal").on("click", function (e) {
      if (e.target === this) $("#tm_regions_modal").remove();
    });

    $("#tm_regions_reset").on("click", function () {
      $("#tm_regions_input").val(formatRegionLines(CONFIG.DEFAULT_REGION_LIST));
      showToast("Reset to defaults - click Save to apply", "info", CONFIG.TOAST_DURATION_LONG);
    });

    $("#tm_regions_save").on("click", async function () {
      const list = parseRegionLines($("#tm_regions_input").val());
      if (list.length === 0) {
        showToast("Add at least one valid region", "error");
        return;
      }
      const saved = await RegionsManager.saveRegions(list);
      if (saved) {
        $("#tm_regions_modal").remove();
        showToast(
          "Regions saved! Refresh page to see changes in the dropdowns.",
          "success",
          CONFIG.TOAST_DURATION
        );
      }
    });
  };

  // Confirm-gated "Clear AWS Sessions": asks the service worker to delete AWS
  // auth cookies (cookies only — favorites / console settings are untouched).
  const showClearSessionsModal = () => {
    const modalHTML = `
            <div id="tm_clear_sessions_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 460px !important; width: 90% !important;
                ">
                    <h3 style="margin: 0 0 12px 0 !important; color: #16191f !important;">Clear all AWS sessions?</h3>
                    <p style="margin: 0 0 18px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.5 !important;">
                        This signs you out of every open AWS console by clearing AWS
                        authentication cookies. Your console favorites and settings are
                        kept — you'll just need to pick a role and sign in again.
                    </p>
                    <div style="text-align: right !important;">
                        <button id="tm_clear_sessions_cancel" type="button" style="
                            padding: 8px 16px !important; margin-right: 10px !important;
                            border: 1px solid #ccc !important; background: white !important;
                            border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_clear_sessions_confirm" type="button" style="
                            padding: 8px 16px !important; border: 1px solid #dc3545 !important;
                            background: #dc3545 !important; color: white !important;
                            border-radius: 4px !important; cursor: pointer !important;
                        ">Clear sessions</button>
                    </div>
                </div>
            </div>
        `;

    $("body").append(modalHTML);

    $("#tm_clear_sessions_cancel, #tm_clear_sessions_modal").on("click", function (e) {
      if (e.target === this) $("#tm_clear_sessions_modal").remove();
    });

    $("#tm_clear_sessions_confirm").on("click", function () {
      $("#tm_clear_sessions_modal").remove();
      try {
        chrome.runtime.sendMessage({ type: "hop_clear_sessions" }, (resp) => {
          if (chrome.runtime.lastError || !resp || !resp.ok) {
            showToast("Couldn't clear AWS sessions", "error", CONFIG.TOAST_DURATION);
            return;
          }
          const n = resp.count;
          showToast(
            `Cleared ${n} AWS cookie${n === 1 ? "" : "s"} — you're signed out`,
            "success",
            CONFIG.TOAST_DURATION
          );
        });
      } catch {
        showToast("Couldn't clear AWS sessions", "error", CONFIG.TOAST_DURATION);
      }
    });
  };

  // --- Sensitive sign-in confirmation ---
  // Returns a list of user-friendly reason labels explaining why a sign-in is
  // flagged sensitive. Empty array => normal flow. Triggers (role-name
  // keywords + flagged account-type ids) are configured via General Settings.
  const sensitiveSignInReasons = (roleName, accountName, accountId) => {
    const reasons = [];
    const rn = (roleName || "").toLowerCase();
    for (const kw of GeneralSettingsManager.signinRoleKeywords()) {
      if (kw && rn.includes(kw.toLowerCase())) {
        // Capitalise the keyword for the badge label.
        reasons.push(kw.charAt(0).toUpperCase() + kw.slice(1) + " role");
        break;
      }
    }
    for (const typeId of GeneralSettingsManager.signinTypeIds()) {
      const entry = AccountTypesManager.findEntry(typeId);
      if (entry && AccountTypesManager.matches(typeId, accountName, accountId)) {
        reasons.push(`${entry.label} account`);
      }
    }
    return reasons;
  };

  // Show a blocking confirmation modal. Resolves true if user confirms.
  const confirmSensitiveSignIn = (accountName, accountId, roleName, reasons) =>
    new Promise((resolve) => {
      const badgesHTML = reasons.map((r) => `
        <div style="
            background: #dc3545 !important;
            color: #fff !important;
            padding: 14px 20px !important;
            border-radius: 6px !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            line-height: 1.2 !important;
            letter-spacing: 0.2px !important;
            text-align: center !important;
            box-shadow: 0 2px 6px rgba(220,53,69,0.25) !important;
        ">${sanitizeInput(r)}</div>
      `).join("");

      const modalHTML = `
        <div id="tm_signin_confirm_modal" style="
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            background: rgba(0,0,0,0.55) !important;
            z-index: 10001 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        ">
          <div style="
              background: white !important;
              border-radius: 8px !important;
              padding: 22px 24px !important;
              max-width: 520px !important;
              width: 90% !important;
              border-top: 6px solid #dc3545 !important;
              box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
          ">
            <div style="
                font-size: 12px !important;
                font-weight: 600 !important;
                letter-spacing: 1px !important;
                text-transform: uppercase !important;
                color: #dc3545 !important;
                margin-bottom: 8px !important;
            ">Sensitive sign-in</div>
            <div style="display: grid !important; gap: 8px !important; margin-bottom: 18px !important;">
              ${badgesHTML}
            </div>
            <div style="
                background: #f8f9fa !important;
                border: 1px solid #e1e4e8 !important;
                border-radius: 4px !important;
                padding: 10px 12px !important;
                margin: 0 0 18px 0 !important;
                font-size: 13px !important;
                color: #16191f !important;
            ">
              <div style="margin-bottom: 2px !important;"><span style="color:#6c757d !important;">Account:</span> <strong>${sanitizeInput(accountName)}</strong> <span style="color:#6c757d !important;">(${sanitizeInput(accountId)})</span></div>
              <div><span style="color:#6c757d !important;">Role:</span> <strong>${sanitizeInput(roleName)}</strong></div>
            </div>
            <div style="text-align: right !important;">
              <button data-action="cancel" style="
                  padding: 8px 16px !important;
                  margin-right: 10px !important;
                  border: 1px solid #ccc !important;
                  background: white !important;
                  border-radius: 4px !important;
                  cursor: pointer !important;
              ">Cancel</button>
              <button data-action="confirm" style="
                  padding: 8px 16px !important;
                  border: 1px solid #dc3545 !important;
                  background: #dc3545 !important;
                  color: white !important;
                  border-radius: 4px !important;
                  cursor: pointer !important;
                  font-weight: 600 !important;
              ">Yes, sign in</button>
            </div>
          </div>
        </div>
      `;
      $("body").append(modalHTML);
      const $m = $("#tm_signin_confirm_modal");
      const close = (result) => { $m.remove(); resolve(result); };
      $m.on("click", function (e) { if (e.target === this) close(false); });
      $m.find('[data-action="cancel"]').on("click", () => close(false));
      $m.find('[data-action="confirm"]').on("click", () => close(true));
    });

  // --- Generic "manage entries" modal used by Environments / Organizations /
  //     Account Types / Role Names. Each entry is an editable row:
  //       [color picker] [label input] [patterns textarea] [remove]
  //     Plus an "Add" button at the bottom. Saving normalises labels into
  //     stable ids, dedupes ids, and hands the whole array to opts.onSave.
  const PATTERN_PALETTE_FOR_NEW = [
    "#0073bb", "#dc3545", "#28a745", "#ffc107",
    "#17a2b8", "#6610f2", "#e83e8c", "#6c757d",
  ];
  const showPatternsModal = (opts) => {
    const {
      modalId,
      title,
      description,
      patternHelp = "One pattern per line — substring of account name or full account ID.",
      addButtonLabel = "Add entry",
      labelPlaceholder = "Label (shown on the toolbar)",
      defaults,
      current,
      onSave,
      onAfterSave,
      toastOnSave,
      onChangeIds, // called after save with the prev/new ID map so callers can fix up dependent state
    } = opts;

    const entries = JSON.parse(JSON.stringify(current || []));

    const escapeAttr = (s) => sanitizeInput(s).replace(/"/g, "&quot;");

    const rowHTML = (entry, idx) => `
      <div class="tm_entry_row" data-orig-id="${escapeAttr(entry.id)}" data-idx="${idx}" style="
          display: grid !important;
          grid-template-columns: 36px 1fr auto !important;
          gap: 10px !important;
          align-items: start !important;
          padding: 10px !important;
          border: 1px solid #e1e4e8 !important;
          border-radius: 6px !important;
          margin-bottom: 10px !important;
          background: #fafbfc !important;
      ">
        <input type="color" class="tm_entry_color" value="${escapeAttr(entry.color || '#0073bb')}" style="
            width: 36px !important; height: 36px !important;
            border: 1px solid #ccc !important; border-radius: 4px !important;
            padding: 0 !important; background: white !important; cursor: pointer !important;
        " />
        <div style="display: flex !important; flex-direction: column !important; gap: 6px !important; min-width: 0 !important;">
          <input type="text" class="tm_entry_label" value="${escapeAttr(entry.label || '')}" placeholder="${escapeAttr(labelPlaceholder)}" style="
              width: 100% !important;
              height: 30px !important;
              padding: 4px 8px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              font-size: 13px !important;
              font-weight: 600 !important;
              box-sizing: border-box !important;
          " />
          <textarea class="tm_entry_patterns" placeholder="${escapeAttr(patternHelp)}" style="
              width: 100% !important;
              height: 70px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 6px 8px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              resize: vertical !important;
              box-sizing: border-box !important;
          ">${sanitizeInput((entry.patterns || []).join("\n"))}</textarea>
        </div>
        <button class="tm_entry_remove" type="button" title="Remove entry" style="
            width: 28px !important; height: 28px !important;
            border: 1px solid #dc3545 !important;
            background: white !important; color: #dc3545 !important;
            border-radius: 4px !important; cursor: pointer !important;
            font-size: 16px !important; line-height: 1 !important; padding: 0 !important;
        ">×</button>
      </div>
    `;

    const renderRows = ($modal, list) => {
      $modal.find(".tm_entries_list").html(list.map(rowHTML).join("")
        || `<div style="color:#6c757d !important; font-size: 13px !important; padding: 10px 0 !important;">No entries yet. Click "${escapeAttr(addButtonLabel)}" to create one.</div>`);
    };

    const modalHTML = `
      <div id="${modalId}" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 640px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">${title}</h3>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 13px !important;">${description}</p>
          <div class="tm_entries_list"></div>
          <div style="display: flex !important; gap: 10px !important; margin-top: 8px !important;">
            <button data-action="add" type="button" style="
                padding: 6px 12px !important;
                border: 1px solid #0073bb !important;
                background: white !important;
                color: #0073bb !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 12px !important;
            ">+ ${escapeAttr(addButtonLabel)}</button>
            <button data-action="reset" type="button" style="
                padding: 6px 12px !important;
                border: 1px solid #dc3545 !important;
                background: white !important;
                color: #dc3545 !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 12px !important;
            ">Reset to Defaults</button>
          </div>
          <div style="margin-top: 16px !important; text-align: right !important;">
            <button data-action="cancel" type="button" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" type="button" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);
    const $modal = $(`#${modalId}`);
    const close = () => $modal.remove();

    renderRows($modal, entries);

    $modal.on("click", function (e) { if (e.target === this) close(); });
    $modal.find('[data-action="cancel"]').on("click", close);

    $modal.on("click", ".tm_entry_remove", function () {
      $(this).closest(".tm_entry_row").remove();
    });

    $modal.find('[data-action="add"]').on("click", function () {
      const $list = $modal.find(".tm_entries_list");
      // Drop the empty-state placeholder if present.
      if ($list.find(".tm_entry_row").length === 0) $list.empty();
      const nextColor = PATTERN_PALETTE_FOR_NEW[$list.find(".tm_entry_row").length % PATTERN_PALETTE_FOR_NEW.length];
      $list.append(rowHTML({ id: "", label: "", color: nextColor, patterns: [] }, $list.find(".tm_entry_row").length));
      $list.find(".tm_entry_row").last().find(".tm_entry_label").trigger("focus");
    });

    $modal.find('[data-action="reset"]').on("click", function () {
      renderRows($modal, JSON.parse(JSON.stringify(defaults || [])));
      showToast("Reset to defaults — click Save to apply", "info", CONFIG.TOAST_DURATION_LONG);
    });

    $modal.find('[data-action="save"]').on("click", async function () {
      const collected = [];
      const idMap = {}; // origId -> newId, for callers tracking renames
      const usedIds = [];
      $modal.find(".tm_entry_row").each(function () {
        const $row = $(this);
        const label = ($row.find(".tm_entry_label").val() || "").trim();
        const color = ($row.find(".tm_entry_color").val() || "").trim() || "#0073bb";
        const patterns = ($row.find(".tm_entry_patterns").val() || "")
          .split("\n").map((l) => l.trim()).filter(Boolean);
        if (!label) return; // skip rows with no label
        const origId = ($row.attr("data-orig-id") || "").trim();
        const proposed = origId || slugifyId(label);
        const finalId = uniqueId(proposed, usedIds);
        usedIds.push(finalId);
        if (origId && origId !== finalId) idMap[origId] = finalId;
        collected.push({ id: finalId, label, color, patterns });
      });

      const saved = await onSave(collected);
      if (saved) {
        if (onChangeIds) await onChangeIds(idMap);
        if (onAfterSave) await onAfterSave();
        close();
        showToast(toastOnSave || "Saved!", "success", CONFIG.TOAST_DURATION);
      }
    });
  };

  // --- Drag-and-drop role reordering (pointer events) ---
  // Smooth, framework-free reorder built directly on pointer events. The
  // dragged row follows the cursor via translateY; siblings shift up or down
  // by the row's height with a CSS transition, so they slide aside in real
  // time. On release the dragged row eases into its final slot and the DOM
  // is reordered (transforms cleared in the same frame -> no visual jump).
  const DRAG_THRESHOLD_PX = 5;
  const DRAG_SETTLE_MS = 220;
  let dragState = null;
  // A pointer-drag ends with the browser synthesising a `click` on the row it
  // was released over. For the jump list that click would re-jump; suppress the
  // one click that immediately follows an *activated* drag.
  let dragSuppressClick = false;

  const isDragInteractive = (el) => {
    if (!el) return false;
    if (el.closest && el.closest(".tm_role_buttons")) return true;
    // The favorite star and the click-to-copy account id sit in the draggable
    // info area but must take their click instead of starting a drag.
    if (el.closest && el.closest(".tm_account_id")) return true;
    const tag = (el.tagName || "").toLowerCase();
    return ["button", "select", "input", "a", "textarea"].includes(tag);
  };

  $("body").on("pointerdown", "#tm_role_list .saml-role", function (e) {
    if (dragState) return;
    if (e.button !== 0) return; // primary button only
    if (isDragInteractive(e.target)) return;
    dragState = {
      row: this,
      pointerId: e.pointerId,
      startY: e.clientY,
      startX: e.clientX,
      activated: false,
      // Captured at gesture start so a mid-drag filter clear doesn't switch
      // mode underneath the user.
      filtersBlocked: document.body.classList.contains("tm_filters_active"),
      // Shared-engine config (see activateDrag / finishDrag).
      listId: RoleOrderManager.LIST_ID,
      rowClass: "saml-role",
      activeClass: "tm_role_dragging_active",
      onReorder: () => RoleOrderManager.saveCurrentOrder(),
    };
  });

  // The same pointer-drag engine reorders pinned jumps: only the pinned rows
  // participate (the recents below stay put), and it saves the pinned order.
  $("body").on("pointerdown", '#tm_jump_recents .tm_jump_recent[data-pinned="1"]', function (e) {
    if (dragState) return;
    if (e.button !== 0) return;
    // The ★/✕ actions take their click rather than starting a drag.
    if (e.target.closest && e.target.closest(".tm_jump_action")) return;
    dragState = {
      row: this,
      pointerId: e.pointerId,
      startY: e.clientY,
      startX: e.clientX,
      activated: false,
      filtersBlocked: false,
      listId: "tm_jump_recents",
      rowClass: "tm_jump_recent",
      rowFilter: (el) => el.getAttribute("data-pinned") === "1",
      activeClass: "tm_jump_dragging_active",
      onReorder: () => saveJumpPinnedFromDom(),
    };
  });

  const activateDrag = () => {
    const list = document.getElementById(dragState.listId);
    if (!list) { dragState = null; return; }
    const visible = Array.from(list.children).filter((el) =>
      el.classList && el.classList.contains(dragState.rowClass) &&
      (!dragState.rowFilter || dragState.rowFilter(el)) &&
      getComputedStyle(el).display !== "none"
    );
    const draggedIndex = visible.indexOf(dragState.row);
    if (draggedIndex < 0) { dragState = null; return; }

    dragState.list = list;
    dragState.rows = visible;
    dragState.draggedIndex = draggedIndex;
    dragState.targetIndex = draggedIndex;
    dragState.rowCenters = visible.map((r) => {
      const rect = r.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    const rect = dragState.row.getBoundingClientRect();
    const cs = getComputedStyle(dragState.row);
    // Row spacing now lives on the list's flex `gap`, not per-row margins, so
    // the shift between adjacent slots is row height + the container gap.
    const listGap = parseFloat(getComputedStyle(list).rowGap) || 0;
    dragState.rowOffset = rect.height + (parseFloat(cs.marginBottom) || 0) + listGap;

    try { dragState.row.setPointerCapture(dragState.pointerId); } catch (err) { /* ignore */ }
    dragState.row.classList.add("tm_dragging");
    // setProperty with "important" beats the base `.saml-role { transition: all
    // 0.2s ease !important }` rule, so the dragged row really has no
    // transition and tracks the cursor instantly.
    dragState.row.style.setProperty("transition", "none", "important");
    document.body.classList.add(dragState.activeClass);
    dragState.activated = true;
  };

  const updateDragPosition = (e) => {
    if (!dragState || !dragState.activated) return;
    const delta = e.clientY - dragState.startY;
    dragState.row.style.transform = `translate3d(0, ${delta}px, 0)`;

    const draggedCenterNow = dragState.rowCenters[dragState.draggedIndex] + delta;
    let target = dragState.draggedIndex;
    if (delta > 0) {
      // Moving down: highest k > draggedIndex whose center is above us.
      for (let k = dragState.rows.length - 1; k > dragState.draggedIndex; k--) {
        if (draggedCenterNow > dragState.rowCenters[k]) { target = k; break; }
      }
    } else if (delta < 0) {
      // Moving up: lowest k < draggedIndex whose center is below us.
      for (let k = 0; k < dragState.draggedIndex; k++) {
        if (draggedCenterNow < dragState.rowCenters[k]) { target = k; break; }
      }
    }
    dragState.targetIndex = target;

    const offset = dragState.rowOffset;
    const di = dragState.draggedIndex;
    dragState.rows.forEach((r, k) => {
      if (k === di) return;
      let dy = 0;
      if (di < target && k > di && k <= target) dy = -offset;
      else if (di > target && k >= target && k < di) dy = offset;
      r.style.transform = dy ? `translate3d(0, ${dy}px, 0)` : "";
    });
  };

  const finishDrag = async (e) => {
    if (!dragState) return;
    if (!dragState.activated) { dragState = null; return; }
    e && e.preventDefault && e.preventDefault();

    // The drag really happened, so the click the browser fires on release must
    // not also count as a row click (which would re-jump). Swallow that one
    // click; a failsafe clears the flag if — e.g. on pointercancel — none comes.
    dragSuppressClick = true;
    setTimeout(() => { dragSuppressClick = false; }, 250);

    const { row, rows, list, draggedIndex, targetIndex, pointerId, activeClass, onReorder } = dragState;
    dragState = null;

    // === FLIP commit: no timing-based reorder, no DOM-commit jump. ===
    // 1) Snapshot every row's CURRENT visual position (with their drag transforms).
    const before = rows.map((r) => r.getBoundingClientRect().top);

    // 2) Clear ALL transforms instantly. We must override the !important base
    //    transition; do it with setProperty(...,"important").
    rows.forEach((r) => {
      r.style.setProperty("transition", "none", "important");
      r.style.transform = "";
    });

    // 3) Reorder the DOM (no animation, transforms are 0 now).
    if (draggedIndex !== targetIndex && list) {
      const refNode = targetIndex > draggedIndex
        ? rows[targetIndex].nextSibling
        : rows[targetIndex];
      list.insertBefore(row, refNode);
    }

    // 4) Measure each row's NEW layout position (no transforms applied).
    const after = rows.map((r) => r.getBoundingClientRect().top);

    // 5) Apply inverse transforms so every row stays AT ITS ORIGINAL VISUAL
    //    POSITION even though the DOM has moved on. The browser sees only the
    //    pre-drop layout, so there's no flicker between commit and animation.
    rows.forEach((r, i) => {
      const dy = before[i] - after[i];
      if (dy !== 0) r.style.transform = `translate3d(0, ${dy}px, 0)`;
    });

    // 6) Force reflow so the inverse transforms register before we re-enable
    //    transitions in the next step.
    if (list) void list.offsetWidth;

    // 7) Re-enable transitions and clear transforms — rows now smoothly
    //    animate from their pre-drop positions to their new layout positions.
    //    Only rows that actually moved animate; others have dy === 0 so this
    //    is a no-op for them.
    const easing = "cubic-bezier(0.22, 0.61, 0.36, 1)";
    rows.forEach((r) => {
      r.style.setProperty("transition", `transform ${DRAG_SETTLE_MS}ms ${easing}`, "important");
      r.style.transform = "";
    });

    // 8) Cleanup once the settle animation completes.
    setTimeout(async () => {
      rows.forEach((r) => {
        r.style.removeProperty("transition");
        r.style.transform = "";
      });
      row.classList.remove("tm_dragging");
      document.body.classList.remove(activeClass);
      try { row.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
      if (draggedIndex !== targetIndex) {
        await onReorder();
      }
    }, DRAG_SETTLE_MS + 30);
  };

  $(window).on("pointermove", function (e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dx = Math.abs(e.clientX - dragState.startX);
    const dy = e.clientY - dragState.startY;
    if (!dragState.activated) {
      if (Math.abs(dy) < DRAG_THRESHOLD_PX && dx < DRAG_THRESHOLD_PX) return;
      // Refuse to start a reorder while filters/search are active. Reordering
      // would only affect visible rows, which is unintuitive — clearer to ask
      // the user to clear filters first.
      if (dragState.filtersBlocked) {
        showToast("Clear filters to reorder roles", "info", CONFIG.TOAST_DURATION);
        dragState = null;
        return;
      }
      activateDrag(e);
      if (!dragState) return;
    }
    e.preventDefault();
    updateDragPosition(e);
  });

  $(window).on("pointerup", function (e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    finishDrag(e);
  });
  $(window).on("pointercancel", function (e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    finishDrag(e);
  });

  // Swallow the click the browser synthesises when a drag is released. Capture
  // phase + stopPropagation runs before the delegated body click handlers, so
  // the reorder never doubles as a re-jump / pin / delete. Cleared on consume;
  // the finishDrag failsafe covers the (clickless) pointercancel path.
  document.addEventListener("click", function (e) {
    if (!dragSuppressClick) return;
    dragSuppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  // --- Keyboard navigation ---
  // /, Ctrl+K, Cmd+K  -> focus search
  // ArrowUp / ArrowDown -> move keyboard selection through visible rows
  // Enter             -> click Sign In on the selected row (or first visible)
  // Esc               -> close open modal, else clear selection + filters
  const visibleRoles = () =>
    $(".saml-role").filter(function () { return $(this).css("display") !== "none"; }).get();

  const setKbSelection = (idx) => {
    const rows = visibleRoles();
    if (rows.length === 0) return;
    const next = Math.max(0, Math.min(idx, rows.length - 1));
    $(".saml-role.tm_kb_selected").removeClass("tm_kb_selected");
    const target = $(rows[next]).addClass("tm_kb_selected");
    target[0].scrollIntoView({ block: "nearest" });
  };

  const moveKbSelection = (delta) => {
    const rows = visibleRoles();
    if (rows.length === 0) return;
    const cur = rows.findIndex((el) => el.classList.contains("tm_kb_selected"));
    const next = cur < 0 ? (delta > 0 ? 0 : rows.length - 1) : cur + delta;
    setKbSelection((next + rows.length) % rows.length);
  };

  const isTypingTarget = (el) => {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    return false;
  };

  const $searchInput = () => $(CONFIG.SELECTORS.SEARCH_INPUT);

  $(document).on("keydown", function (e) {
    // Any open modal short-circuits the role-list shortcuts so we never
    // accidentally sign in / navigate while a dialog is up.
    const $openModal = $('[id$="_modal"]').first();
    const modalOpen = $openModal.length > 0;

    // Option/Alt focuses the search box on PRESS, so you can hold it and flow
    // straight into Option+arrow suggestion nav in one gesture. Skipped while a
    // modal is up, while typing in another field, and for Cmd/Ctrl combos so
    // system shortcuts (⌘⌥I and friends) never get hijacked.
    if (
      e.key === "Alt" && !e.repeat && !modalOpen &&
      !e.metaKey && !e.ctrlKey &&
      !isTypingTarget(document.activeElement)
    ) {
      const $sf = $searchInput();
      if ($sf.length) $sf.trigger("focus");
    }

    // Esc — universal close/clear.
    if (e.key === "Escape") {
      if (jumpPopoverOpen) {
        closeJumpPopover();
        return;
      }
      if (modalOpen) {
        $openModal.remove();
        return;
      }
      // First Esc cancels a suggestion highlight (box stays open); a second Esc
      // then blurs the box via the isTypingTarget branch below.
      if (searchSuggestHighlight >= 0 && document.activeElement && document.activeElement.id === "tm_search_input") {
        searchSuggestHighlight = -1;
        renderSearchSuggest();
        return;
      }
      if ($(".saml-role.tm_kb_selected").length) {
        $(".saml-role.tm_kb_selected").removeClass("tm_kb_selected");
        return;
      }
      if (isTypingTarget(e.target)) {
        $(e.target).blur();
        return;
      }
      // No #tm_clear_filters button exists today — call the manager method
      // directly so Esc-to-clear actually works.
      FilterManager.clearAll();
      return;
    }

    // Inside a modal: Enter activates the primary (last) button if focus isn't
    // in a text field. All other shortcuts (Arrows, /, Cmd/Ctrl+K) are ignored.
    if (modalOpen) {
      if (e.key === "Enter" && !isTypingTarget(e.target)) {
        const $primary = $openModal.find("button").last();
        if ($primary.length) {
          e.preventDefault();
          $primary.trigger("click");
        }
      }
      return;
    }

    // Focus search: "/" or Ctrl/Cmd+K.
    if (
      (!isTypingTarget(e.target) && e.key === "/") ||
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")
    ) {
      e.preventDefault();
      const $s = $searchInput();
      if ($s.length) { $s.trigger("focus").trigger("select"); }
      return;
    }

    // From the search box, ArrowDown/Up should move selection (without leaving the box).
    if (isTypingTarget(e.target) && e.target.id !== "tm_search_input" && !$(e.target).is(CONFIG.SELECTORS.SEARCH_INPUT)) {
      return; // typing somewhere else (e.g. modal textarea) — don't hijack arrows
    }

    // Alt/Option + arrows walk the autocomplete chips in all four directions;
    // plain arrows keep driving the results list, so list nav is unchanged.
    // e.altKey is true for Option (Mac) and Alt (Windows/Linux) alike.
    if (
      e.altKey &&
      (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowRight") &&
      document.activeElement && document.activeElement.id === "tm_search_input" &&
      searchSuggestItems.length
    ) {
      e.preventDefault();
      moveSuggestByArrow(e.key);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveKbSelection(+1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveKbSelection(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // A suggestion highlighted via Alt/Option+↑↓ is inserted — this is the only
      // way Enter touches the autocomplete, so it can never sign in unexpectedly.
      if (
        searchSuggestHighlight >= 0 &&
        document.activeElement && document.activeElement.id === "tm_search_input" &&
        searchSuggestItems[searchSuggestHighlight] != null
      ) {
        acceptSearchSuggest(searchSuggestItems[searchSuggestHighlight]);
        return;
      }
      // Otherwise Enter acts ONLY on a row you've explicitly arrow-selected that
      // is STILL visible. No visible selection → Enter does nothing: it never
      // auto-signs-in from a lone match, and never fires on a filtered-out row
      // (a stale .tm_kb_selected on a now-hidden row was the sign-in regression).
      const rows = visibleRoles();
      const sel = $(".saml-role.tm_kb_selected").get().find((el) => rows.includes(el));
      if (!sel) return;
      const $btn = $(sel).find(".tm_signin_button");
      if ($btn.length) {
        // ⌘/Ctrl+Enter carries the modifier so the sign-in opens in a new tab.
        const evt = $.Event("click", { metaKey: e.metaKey, ctrlKey: e.ctrlKey });
        $btn.trigger(evt);
      }
      return;
    }

    // Fall-through: a single printable character with no modifier and no
    // typing target gets piped into the search box, so users can just start
    // typing to filter.
    if (
      e.key.length === 1 &&
      !e.ctrlKey && !e.metaKey && !e.altKey &&
      !isTypingTarget(e.target)
    ) {
      const $s = $searchInput();
      if ($s.length) {
        e.preventDefault();
        $s.trigger("focus");
        $s.val(($s.val() || "") + e.key).trigger("input");
      }
    }
  });

  // Paste into search when no input is focused (and no modal is open).
  $(document).on("paste", function (e) {
    if (isTypingTarget(e.target)) return;
    if ($('[id$="_modal"]').length) return;
    const $s = $searchInput();
    if (!$s.length) return;
    const cd = (e.originalEvent || e).clipboardData;
    if (!cd) return;
    const pasted = cd.getData("text");
    if (!pasted) return;
    e.preventDefault();
    $s.trigger("focus");
    $s.val(($s.val() || "") + pasted).trigger("input");
  });

  // --- Help / About modal ---
  // Shown automatically on first install (gated by hop_welcome_seen) and from
  // the "Help / About" side-menu entry on demand. Same content either way so
  // there's one place to maintain.
  const showAboutModal = ({ firstRun = false } = {}) => {
    // Remove any previously open instance so the side-menu click can re-open.
    $("#tm_about_modal").remove();

    const intro = firstRun
      ? `<p style="margin:0 0 12px 0 !important; color:#16191f !important; font-size:14px !important; line-height:1.5 !important;">
            Welcome! Console Hopper turns the AWS SAML role picker into a fast,
            filterable launcher with colour-coded console tabs. Here's what it
            does and where to configure it.
         </p>`
      : `<p style="margin:0 0 12px 0 !important; color:#16191f !important; font-size:14px !important; line-height:1.5 !important;">
            Console Hopper turns the AWS SAML role picker into a fast,
            filterable launcher with colour-coded console tabs.
         </p>`;

    const sectionHTML = (title, body) => `
      <div style="margin: 0 0 12px 0 !important;">
        <div style="font-weight: 600 !important; color:#16191f !important; font-size:13px !important; margin-bottom: 4px !important;">${title}</div>
        <div style="color:#6c757d !important; font-size:13px !important; line-height:1.5 !important;">${body}</div>
      </div>
    `;

    const modalHTML = `
      <div id="tm_about_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.55) !important;
          z-index: 10001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 24px 26px !important;
            max-width: 620px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
            border-top: 6px solid #0073bb !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        ">
          <div style="
              font-size: 11px !important;
              letter-spacing: 1.2px !important;
              text-transform: uppercase !important;
              color: #0073bb !important;
              font-weight: 700 !important;
              margin-bottom: 4px !important;
          ">${firstRun ? "Welcome" : "Help &amp; About"}</div>
          <h3 style="margin: 0 0 12px 0 !important; color:#16191f !important; font-size: 18px !important;">Console Hopper</h3>
          ${intro}
          ${sectionHTML("Filter, search, favorite",
            `Narrow the role list from the toolbar — by organisation, environment, account type, role name or <strong>tag</strong> — or use the search box. Search is <strong>separator-insensitive</strong> (<code>test 123</code> finds <code>test123</code>) and understands <strong>scoped terms</strong>: <code>tag:</code>, <code>role:</code>, <code>name:</code>, <code>account:</code>, <code>env:</code>, <code>type:</code>, <code>org:</code>. Combine them with a space (<em>and</em>), a comma (<em>or</em>) or a leading <code>-</code> (<em>exclude</em>), with <code>"quotes"</code> for an exact phrase. Focus the box and it pops out with click-to-insert suggestions and a live match count. Star a role to favorite it; the <em>Favorites</em> and <em>Recent</em> chips re-filter quickly.`)}
          ${sectionHTML("Account tags",
            `Tag accounts with your own labels — <code>palo-alto</code>, <code>prod-network</code>, a ticket number — and organise by them. Click the small <strong>tag chip</strong> on any row to add or remove tags inline (autocompleting from tags you already use), or edit in bulk via <em>Account Tags</em> in the side menu. Tags get a filter row of their own and are searchable with <code>tag:</code>.`)}
          ${sectionHTML("Save a search as a Shortcut",
            `Built a query and filter set you'll want again? Click <strong>☆ save as shortcut</strong> in the search card and name it — it becomes a chip in the <em>Shortcuts</em> row, and one click re-applies the whole view (search <em>and</em> filters). Remove one with its <strong>✕</strong> — click to arm, click again to confirm.`)}
          ${sectionHTML("Start view",
            `Have the picker open on a view every load. Open <em>Start View</em> in the side menu and pick one chip — <strong>★ Favorites</strong>, <strong>↻ Recent</strong>, one of your saved <em>Shortcuts</em>, or a <em>Tag</em>. The active choice is highlighted; <strong>Save current filters</strong> snapshots whatever you have on right now, and <strong>Clear</strong> removes it (your favorites stay put).`)}
          ${sectionHTML("Reorder by drag",
            `Drag any role row to reposition it; the order persists across sessions. <strong>Reorder is disabled while any filter or search is active</strong> — otherwise you'd only be sorting visible rows, which gives surprising results. Clear filters first. <em>Reset Order</em> in the side menu restores AWS's default order.`)}
          ${sectionHTML("Deep-link into a service",
            `Each role row has a service dropdown (EC2 / S3 / IAM / …). Picking a service before <strong>Sign In</strong> drops you straight into that service's console for that role. Edit the list via <em>Services</em>.`)}
          ${sectionHTML("Pick a region per sign-in",
            `Next to the service dropdown, each row has a region dropdown that sets which AWS region the sign-in lands in. It defaults to your region (set in <em>General Settings</em>) and remembers your last pick per role. Edit which regions appear — and their order — via <em>Regions</em>.`)}
          ${sectionHTML("Jump to account (role chaining)",
            `For accounts you can only reach by <strong>assuming a role from a hub</strong>. Configure your orgs once via <em>Assume Profiles</em> in the side menu (one per line: <code>Org name | hub account id | role to assume</code>) — a <strong>⤳ Jump to account</strong> button then appears in the search column. Pick the org, type the 12-digit destination account, optionally add a session label, and Jump: Console Hopper signs into the hub and opens AWS's Switch Role pre-filled — one click there and you're in. The new console tab is titled with your session label, and your last jumps are one click away in the popover — <strong>hover a jump to ★ pin</strong> the ones you use most (pinned entries stay at the top, past the recents limit, and can be <strong>dragged to reorder</strong>) or <strong>✕</strong> to remove one. Note: the hub must be in your current role list, the hub→target trust must already exist in AWS, and chained sessions are capped at 1 hour by AWS.`)}
          ${sectionHTML("Rename accounts",
            `Give specific accounts a friendlier name via <em>Account Names</em> (one per line, e.g. <code>123456789012: Prod Logging</code>). The custom name <strong>replaces</strong> the AWS account name in the list and is used for filtering, grouping and tab titles. Saving updates the list immediately. Tip: click the <strong>account-ID button</strong> on any row to copy the 12-digit id.`)}
          ${sectionHTML("Sign in your way",
            `A plain <strong>Sign In</strong> opens the console in the same tab or a new one — your choice, set via the <em>Sign-in</em> side-menu option. <strong>⌘/Ctrl-click</strong> or <strong>middle-click</strong> always does the opposite, so both are one click away.`)}
          ${sectionHTML("Coloured console tabs",
            `Each open AWS console tab gets a coloured favicon (env color) and a tab-title prefix with the account name, so 10 open tabs are still distinguishable at a glance.`)}
          ${sectionHTML("Tab groups (visual containers)",
            `Chrome tab groups cluster console tabs by role, by organisation, or by a ticket tag — emulates Firefox containers visually. Choose how from the <strong>Tabs:</strong> dropdown in the search column — <em>By role</em>, <em>By org</em>, <em>Custom tag</em> (type a ticket or workstream to group everything under it), or <em>Off</em>. The <em>Tab Groups</em> side-menu entry explains the modes and stays in sync.`)}
          ${sectionHTML("Clear AWS sessions",
            `<em>Clear AWS Sessions</em> in the side menu signs you out of all open AWS consoles in one click by deleting AWS authentication cookies (cookies only — your favorites and settings are kept). It asks for confirmation first.`)}
          ${sectionHTML("Make it yours",
            `Open the side menu (hover the right edge) to manage <em>Organizations</em>, <em>Environments</em>, <em>Account Types</em>, <em>Role Names</em>, <em>Services</em>, <em>Regions</em>, <em>Account Names</em>, and <em>General Settings</em> (default region, sensitive-sign-in triggers, footer URL). Defaults ship as generic placeholders — rename them to match your org.`)}
          ${sectionHTML("Privacy",
            `Everything stays in your browser. Nothing is sent to any server by this extension. Use <em>Export Settings</em> to share your config with a teammate. <a href="https://github.com/tomekklas/console-hopper/blob/main/PRIVACY.md" target="_blank" rel="noopener" style="color:#0073bb !important; text-decoration: underline !important;">Read the full privacy policy</a>.`)}
          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="ok" type="button" style="
                padding: 8px 18px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">${firstRun ? "Got it" : "Close"}</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_about_modal");
    // For first-run: mark seen the moment the modal opens. Even if the user
    // closes via Esc (which short-circuits our close handler) we've still
    // "shown" it, and we don't want to re-pop on next load.
    if (firstRun) StorageManager.saveWelcomeSeen(true);
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="ok"]').on("click", close);
  };

  $("body").on("click", "#tm_about", function (e) {
    e.preventDefault();
    showAboutModal({ firstRun: false });
  });

  // --- Keyboard help modal ---
  $("body").on("click", "#tm_keyboard_help", function (e) {
    e.preventDefault();
    const isMac = /Mac/i.test(navigator.platform);
    const cmd = isMac ? "⌘" : "Ctrl";
    const alt = isMac ? "⌥" : "Alt";
    const modalHTML = `
      <div id="tm_kb_help_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 460px !important;
            width: 90% !important;
        ">
          <h3 style="margin: 0 0 14px 0 !important; color: #16191f !important;">Keyboard Shortcuts</h3>
          <table style="width: 100% !important; border-collapse: collapse !important; font-size: 13px !important;">
            <tr><td style="padding: 6px 0 !important;"><kbd>/</kbd>, <kbd>${cmd}</kbd>+<kbd>K</kbd> or tap <kbd>${alt}</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Focus the search box</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>↑</kbd> / <kbd>↓</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Move selection through visible roles</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>${alt}</kbd>+<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Move through search suggestions (<kbd>Enter</kbd> adds the highlighted one)</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>Enter</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Sign in to the selected role</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>${cmd}</kbd>+<kbd>Enter</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Sign in, toggling new-tab vs. your default (also: ${cmd}-click / middle-click)</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>Esc</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Close modal / clear selection / clear filters</td></tr>
          </table>
          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="close" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Got it</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_kb_help_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="close"]').on("click", close);
  });

  // --- Tab group mode modal ---
  // The floating-menu button shows the current default mode; clicking it
  // opens a modal that explains the feature and lets the user pick a mode.
  const updateTabGroupModeButton = () => {
    $("#tm_tab_group_mode").text(
      `Tab Groups: ${CONFIG.TAB_GROUP_MODE_LABELS[tabGroupModeCache] || "By role"}`
    );
  };

  // Reflect the current tag / mode state into the inline "Tab group" dropdown.
  // A non-empty tag means "Custom tag" is the active choice (its field shows);
  // otherwise the dropdown shows the mode and the field is hidden and cleared.
  // The tabGroupTagCache / tabGroupModeCache values are the single source of truth.
  // Toggle a field's ✕ clear affordance based on whether it holds a value:
  // adds/removes .tm_has_value on the wrapper (see the .tm_field_clear CSS). A
  // class — not inline display — so the stylesheet's !important rule stays
  // authoritative. Shared by the custom-tag and Jump account-id fields.
  const syncFieldClear = (inputId, wrapId) => {
    const inp = document.getElementById(inputId);
    const wrap = document.getElementById(wrapId);
    if (!inp || !wrap) return;
    wrap.classList.toggle("tm_has_value", Boolean(inp.value));
  };
  const updateTagClearBtn = () =>
    syncFieldClear("tm_group_tag_input", "tm_group_tag_field");

  const syncGroupControl = () => {
    const sel = document.getElementById("tm_group_mode_select");
    const inp = document.getElementById("tm_group_tag_input");
    const wrap = document.getElementById("tm_group_tag_field");
    if (!sel || !inp || !wrap) return;
    if (tabGroupModeCache === "custom") {
      sel.value = "custom";
      inp.value = tabGroupTagCache;
      wrap.style.display = "block";
    } else {
      sel.value = CONFIG.TAB_GROUP_MODES.includes(tabGroupModeCache)
        ? tabGroupModeCache
        : "role";
      inp.value = "";
      wrap.style.display = "none";
    }
    updateTagClearBtn();
  };
  $("body").on("click", "#tm_tab_group_mode", function (e) {
    e.preventDefault();
    showTabGroupModeModal();
  });

  const showTabGroupModeModal = () => {
    const current = tabGroupModeCache;
    const optionHTML = (key, title, desc) => {
      const checked = key === current ? "checked" : "";
      return `
        <label style="display: flex !important; gap: 10px !important; align-items: flex-start !important; padding: 10px 12px !important; border: 1px solid #e1e4e8 !important; border-radius: 6px !important; margin-bottom: 8px !important; cursor: pointer !important;">
          <input type="radio" name="tm_tab_group_mode_choice" value="${key}" ${checked} style="margin: 4px 0 0 0 !important;" />
          <span style="flex: 1 !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; font-size: 14px !important;">${title}</span>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 2px !important;">${desc}</span>
          </span>
        </label>
      `;
    };

    const modalHTML = `
      <div id="tm_tab_group_mode_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 560px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Tab Groups</h3>
          <p style="margin: 0 0 8px 0 !important; color: #6c757d !important; font-size: 13px !important; line-height: 1.45 !important;">
            When you click <strong>Sign In</strong>, this plugin can drop the
            resulting AWS console tab into a Chrome <strong>tab group</strong>
            so your open sessions are visually clustered and colour-coded in
            the tab strip. Groups are purely visual — they don't isolate
            cookies or sessions.
          </p>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 12px !important; line-height: 1.45 !important;">
            You can also set this — including a one-off <em>Custom tag</em> that
            groups tabs by ticket id or workstream regardless of account — from
            the <em>Tabs:…</em> dropdown in the same column as the account
            search, without opening this dialog.
          </p>
          ${optionHTML("role", "By role", "Each unique account + role becomes its own coloured group, e.g. <code>my-account · PowerUser</code>. Same role always gets the same colour.")}
          ${optionHTML("org", "By org", "Accounts cluster by organization, based on your <em>Organizations</em> patterns. Accounts that don't match any org are not grouped.")}
          ${optionHTML("off", "Off", "No automatic grouping. Tab title prefix and favicon colouring still apply.")}
          <div style="margin-top: 14px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_tab_group_mode_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);

    $m.find('[data-action="save"]').on("click", async function () {
      const chosen = $m.find('input[name="tm_tab_group_mode_choice"]:checked').val();
      if (!chosen || !CONFIG.TAB_GROUP_MODES.includes(chosen)) {
        close();
        return;
      }
      tabGroupModeCache = chosen;
      await StorageManager.saveTabGroupMode(chosen);
      updateTabGroupModeButton();
      // Choosing an explicit mode clears any active custom tag so the dropdown
      // and this dialog agree on a single grouping choice.
      if (tabGroupTagCache) {
        tabGroupTagCache = "";
        await StorageManager.saveTabGroupTag("");
      }
      syncGroupControl();
      close();
      showToast(
        `Tab grouping: ${CONFIG.TAB_GROUP_MODE_LABELS[chosen]}`,
        "success",
        CONFIG.TOAST_DURATION
      );
    });
  };

  const showSigninTabModal = () => {
    const current = signinNewTab ? "new" : "same";
    const optionHTML = (key, title, desc) => {
      const checked = key === current ? "checked" : "";
      return `
        <label style="display: flex !important; gap: 10px !important; align-items: flex-start !important; padding: 10px 12px !important; border: 1px solid #e1e4e8 !important; border-radius: 6px !important; margin-bottom: 8px !important; cursor: pointer !important;">
          <input type="radio" name="tm_signin_tab_choice" value="${key}" ${checked} style="margin: 4px 0 0 0 !important;" />
          <span style="flex: 1 !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; font-size: 14px !important;">${title}</span>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 2px !important;">${desc}</span>
          </span>
        </label>
      `;
    };

    const modalHTML = `
      <div id="tm_signin_tab_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 560px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Sign-in tab</h3>
          <p style="margin: 0 0 8px 0 !important; color: #6c757d !important; font-size: 13px !important; line-height: 1.45 !important;">
            Choose where clicking <strong>Sign In</strong> opens the AWS console.
          </p>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 12px !important; line-height: 1.45 !important;">
            <strong>Tip:</strong> to do the opposite for just one sign-in, hold
            <strong>⌘/Ctrl</strong> (or middle-click) when you click Sign In —
            no need to change this setting. (If you use the keyboard, ⌘/Ctrl +
            Enter does the same.)
          </p>
          ${optionHTML("same", "Same tab", "Sign In replaces the current tab (the role picker). This is the default.")}
          ${optionHTML("new", "New tab", "Sign In opens the console in a new tab and leaves the role picker open, so you can sign into several roles in a row.")}
          <div style="margin-top: 14px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_signin_tab_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);

    $m.find('[data-action="save"]').on("click", async function () {
      const chosen = $m.find('input[name="tm_signin_tab_choice"]:checked').val();
      const value = chosen === "new";
      const saved = await SigninTabManager.saveSetting(value);
      if (saved) {
        SigninTabManager.updateButton();
        close();
        showToast(
          `Sign-in opens in ${value ? "a new tab" : "the same tab"}`,
          "success",
          CONFIG.TOAST_DURATION
        );
      }
    });
  };

  // --- Tab group tag input ---
  // Persisted in chrome.storage so it survives page reloads. Empty value
  // means "use default grouping (account/role)"; non-empty value overrides.
  // Update the in-memory cache synchronously on every keystroke so a Sign In
  // fired immediately after typing still carries the tag — only the storage
  // write is debounced. (Previously the cache update lived inside the debounce,
  // so a quick sign-in read a stale/empty tag and grouping ignored it.)
  const saveTabGroupTagDebounced = debounce(
    (v) => StorageManager.saveTabGroupTag(v),
    300
  );
  $("body").on("input", "#tm_group_tag_input", function () {
    tabGroupTagCache = $(this).val().trim();
    saveTabGroupTagDebounced(tabGroupTagCache);
    updateTagClearBtn();
  });

  // ✕ inside the custom-tag field: clear the value (and persist the clear) but
  // stay in "Custom tag" and refocus, so a corrected tag can be typed straight in.
  $("body").on("click", "#tm_group_tag_clear", async function (e) {
    e.preventDefault();
    const inp = document.getElementById("tm_group_tag_input");
    if (inp) inp.value = "";
    tabGroupTagCache = "";
    await StorageManager.saveTabGroupTag("");
    updateTagClearBtn();
    if (inp) inp.focus();
  });

  // The "Tab group" dropdown is the single control for how opened console tabs
  // are grouped. Picking a mode (role / org / off) clears any custom tag and
  // hides the tag field; picking "Custom tag" reveals the field and focuses it.
  // The field's own input handler (above) keeps tabGroupTagCache current as you
  // type, so no separate save is needed here for the tag path.
  $("body").on("change", "#tm_group_mode_select", async function () {
    const v = String($(this).val() || "");
    const inp = document.getElementById("tm_group_tag_input");
    const wrap = document.getElementById("tm_group_tag_field");
    if (v === "custom") {
      // "Custom tag" is a saved choice in its own right — persist it so a Sign
      // In (and a reload) honour the dropdown even before a tag is typed. An
      // empty tag then means "no group" (the SW's resolveTitle returns null),
      // rather than silently falling back to whatever mode was set before.
      tabGroupModeCache = "custom";
      await StorageManager.saveTabGroupMode("custom");
      updateTabGroupModeButton();
      if (wrap) wrap.style.display = "block";
      if (inp) inp.focus();
      updateTagClearBtn();
      return;
    }
    if (!CONFIG.TAB_GROUP_MODES.includes(v)) return;
    tabGroupModeCache = v;
    await StorageManager.saveTabGroupMode(v);
    updateTabGroupModeButton();
    if (tabGroupTagCache) {
      tabGroupTagCache = "";
      await StorageManager.saveTabGroupTag("");
    }
    if (inp) inp.value = "";
    if (wrap) wrap.style.display = "none";
    updateTagClearBtn();
  });

  // --- Reset Order ---
  // Wipes the stored drag-and-drop ordering and falls back to AWS's native
  // role-picker order. Destructive, so we gate behind a confirm modal.
  $("body").on("click", "#tm_reset_order", function (e) {
    e.preventDefault();
    const modalHTML = `
      <div id="tm_reset_order_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.55) !important;
          z-index: 10001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 440px !important;
            width: 90% !important;
            border-top: 6px solid #dc3545 !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        ">
          <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">
            Reset role order?
          </h3>
          <p style="margin: 0 0 16px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            This clears your drag-and-drop ordering and restores AWS's default
            order. This cannot be undone.
          </p>
          <div style="text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="reset" style="
                padding: 8px 16px !important;
                border: 1px solid #dc3545 !important;
                background: #dc3545 !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Reset</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_reset_order_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);

    $m.find('[data-action="reset"]').on("click", async function () {
      await StorageManager.saveRoleOrder([]);
      roleOrderCache = [];
      close();
      showToast("Order reset — reloading…", "success", CONFIG.TOAST_DURATION);
      setTimeout(() => location.reload(), 600);
    });
  });

  // --- Reset Recent ---
  // Wipes the recently-signed-in history. Destructive (can't be undone), so
  // we gate behind the same style of confirm modal as Reset Order.
  $("body").on("click", "#tm_reset_recent", function (e) {
    e.preventDefault();
    const modalHTML = `
      <div id="tm_reset_recent_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.55) !important;
          z-index: 10001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 440px !important;
            width: 90% !important;
            border-top: 6px solid #dc3545 !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        ">
          <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">
            Clear recent sign-ins?
          </h3>
          <p style="margin: 0 0 16px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            This empties the <em>Recent</em> shortcut list. Sign-ins from now
            on will start populating it again. This cannot be undone.
          </p>
          <div style="text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="reset" style="
                padding: 8px 16px !important;
                border: 1px solid #dc3545 !important;
                background: #dc3545 !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Clear</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_reset_recent_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);

    $m.find('[data-action="reset"]').on("click", async function () {
      recentRolesCache = [];
      await StorageManager.saveRecentRoles([]);
      close();
      // If the user was filtered to "Recent", that filter now matches nothing
      // — re-apply so the empty list is reflected immediately.
      FilterManager.applyFilters();
      showToast("Recent cleared", "success", CONFIG.TOAST_DURATION);
    });
  });

  // --- Settings export / import ---
  // All persisted keys (everything under STORAGE_KEYS). Recognised by import
  // for sanity-checking. Anything outside this set is ignored on import.
  const SETTINGS_EXPORT_KEYS = Object.values(CONFIG.STORAGE_KEYS);

  // Keys whose chrome.storage payload is a JSON-encoded string (legacy storage
  // shape). For export we parse them so the JSON is readable; for import we
  // re-stringify if the incoming value is a parsed object/array.
  const STRING_SERIALIZED_KEYS = new Set([
    CONFIG.STORAGE_KEYS.FAVORITES,
    CONFIG.STORAGE_KEYS.SHORTCUTS,
    CONFIG.STORAGE_KEYS.SERVICES,
    CONFIG.STORAGE_KEYS.REGION_LIST,
    CONFIG.STORAGE_KEYS.ENV_PATTERNS,
    CONFIG.STORAGE_KEYS.ORG_PATTERNS,
    CONFIG.STORAGE_KEYS.TYPE_PATTERNS,
    CONFIG.STORAGE_KEYS.ROLE_PATTERNS,
    CONFIG.STORAGE_KEYS.RECENT_ROLES,
    CONFIG.STORAGE_KEYS.ROLE_ORDER,
    CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS,
    CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS,
    CONFIG.STORAGE_KEYS.ASSUME_PROFILES,
    CONFIG.STORAGE_KEYS.JUMP_RECENTS,
    CONFIG.STORAGE_KEYS.JUMP_PINNED,
  ]);

  const collectExportPayload = async () => {
    const data = await chrome.storage.local.get(SETTINGS_EXPORT_KEYS);
    const settings = {};
    for (const [k, v] of Object.entries(data)) {
      if (STRING_SERIALIZED_KEYS.has(k) && typeof v === "string") {
        try {
          settings[k] = JSON.parse(v);
        } catch (e) {
          settings[k] = v;
        }
      } else {
        settings[k] = v;
      }
    }
    return {
      _meta: {
        plugin: "Console Hopper",
        version: CONFIG.SCRIPT_VERSION,
        exportedAt: new Date().toISOString(),
      },
      settings,
    };
  };

  $("body").on("click", "#tm_export_settings", async function (e) {
    e.preventDefault();
    const payload = await collectExportPayload();
    const json = JSON.stringify(payload, null, 2);
    const modalHTML = `
      <div id="tm_export_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 640px !important;
            width: 92% !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Export Settings</h3>
          <p style="margin: 0 0 12px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            Copy this JSON and paste it into another browser/profile via Import Settings to clone your setup.
          </p>
          <textarea id="tm_export_json" readonly style="
              width: 100% !important;
              height: 320px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 10px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              resize: vertical !important;
              box-sizing: border-box !important;
              background: #f8f9fa !important;
          "></textarea>
          <div style="margin-top: 15px !important; text-align: right !important;">
            <button data-action="copy" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #0073bb !important;
                background: white !important;
                color: #0073bb !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Copy</button>
            <button data-action="download" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #0073bb !important;
                background: white !important;
                color: #0073bb !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Download</button>
            <button data-action="close" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Close</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_export_modal");
    $("#tm_export_json").val(json);
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="close"]').on("click", close);

    $m.find('[data-action="copy"]').on("click", async function () {
      const ok = await copyTextToClipboard(json);
      showToast(ok ? "Settings copied to clipboard" : "Copy failed", ok ? "success" : "error", CONFIG.TOAST_DURATION);
    });

    $m.find('[data-action="download"]').on("click", function () {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `console-hopper-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  });

  $("body").on("click", "#tm_import_settings", function (e) {
    e.preventDefault();
    const modalHTML = `
      <div id="tm_import_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 640px !important;
            width: 92% !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Import Settings</h3>
          <p style="margin: 0 0 12px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            Paste an export JSON. Only the recognised settings keys are imported; everything else is ignored. Existing settings for those keys will be overwritten. The page reloads after import.
          </p>
          <textarea id="tm_import_json" placeholder='{ "_meta": { ... }, "settings": { ... } }' style="
              width: 100% !important;
              height: 320px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 10px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              resize: vertical !important;
              box-sizing: border-box !important;
          "></textarea>
          <div style="margin-top: 15px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="import" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Import</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_import_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);

    $m.find('[data-action="import"]').on("click", async function () {
      const raw = $("#tm_import_json").val();
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        showToast("Invalid JSON: " + err.message, "error", CONFIG.TOAST_DURATION_LONG);
        return;
      }
      const settings = parsed && parsed.settings ? parsed.settings : parsed;
      if (!settings || typeof settings !== "object") {
        showToast("No settings object found in JSON", "error", CONFIG.TOAST_DURATION_LONG);
        return;
      }

      // Per-key shape validators. Anything that fails validation is rejected
      // wholesale so a hand-edited or hostile JSON can't poison storage with
      // unexpected shapes that later flow into HTML.
      const isHexColor = (s) => typeof s === "string" && /^#[0-9a-fA-F]{3,8}$/.test(s);
      const isStringList = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
      const isPatternEntryList = (v) =>
        Array.isArray(v) && v.every((e) =>
          e && typeof e === "object" &&
          typeof e.id === "string" && e.id.length <= 64 &&
          typeof e.label === "string" && e.label.length <= 64 &&
          (e.color == null || isHexColor(e.color)) &&
          (e.patterns == null || isStringList(e.patterns))
        );
      const isServiceList = (v) =>
        Array.isArray(v) && v.every((s) =>
          s && typeof s === "object" &&
          typeof s.id === "string" &&
          typeof s.name === "string" && s.name.length <= 64 &&
          typeof s.path === "string" && s.path.length <= 256
        );
      const isRegionList = (v) =>
        Array.isArray(v) && v.every((r) =>
          r && typeof r === "object" &&
          typeof r.id === "string" && r.id.length <= 32 &&
          (r.label === undefined || (typeof r.label === "string" && r.label.length <= 64))
        );
      const isRecentRoleList = (v) =>
        Array.isArray(v) && v.every((r) =>
          r && typeof r === "object" && typeof r.roleArn === "string"
        );
      const isPlainStringMap = (v) =>
        v && typeof v === "object" && !Array.isArray(v) &&
        Object.values(v).every((x) => typeof x === "string");
      const isAccountTagMap = (v) =>
        v && typeof v === "object" && !Array.isArray(v) &&
        Object.values(v).every((arr) =>
          Array.isArray(arr) && arr.every((t) => typeof t === "string"));

      const SK = CONFIG.STORAGE_KEYS;
      const validators = {
        [SK.THEME]:        (v) => typeof v === "string" && ["light", "dark", "auto"].includes(v),
        [SK.FAVORITES]:    isStringList,
        [SK.SHORTCUTS]:    (v) => Array.isArray(v) && v.every((s) =>
                              s && typeof s === "object" &&
                              typeof s.label === "string" && s.label.length <= 64 &&
                              typeof s.search === "string" && s.search.length <= 256),
        [SK.COMPACT_MODE]: (v) => typeof v === "boolean",
        [SK.SIGNIN_NEW_TAB]: (v) => typeof v === "boolean",
        [SK.SERVICES]:     isServiceList,
        [SK.LAST_SERVICE]: isPlainStringMap,
        [SK.LAST_REGION]:  isPlainStringMap,
        [SK.REGION_LIST]:  isRegionList,
        [SK.ACCOUNT_NAMES]: isPlainStringMap,
        [SK.ACCOUNT_TAGS]: isAccountTagMap,
        [SK.ENV_PATTERNS]: isPatternEntryList,
        [SK.ORG_PATTERNS]: isPatternEntryList,
        [SK.TYPE_PATTERNS]: isPatternEntryList,
        [SK.ROLE_PATTERNS]: isPatternEntryList,
        [SK.RECENT_ROLES]: isRecentRoleList,
        [SK.RECENT_LIMIT]: (v) => typeof v === "number" && v >= 1 && v <= 100,
        [SK.ROLE_ORDER]:   isStringList,
        [SK.TAB_GROUP_TAG]: (v) => typeof v === "string" && v.length <= 64,
        [SK.TAB_GROUP_MODE]: (v) => CONFIG.TAB_GROUP_MODES.includes(v),
        [SK.AWS_REGION]:   (v) => typeof v === "string" && v.length <= 32,
        [SK.HOMEPAGE_URL]: (v) => typeof v === "string" && v.length <= 512,
        [SK.SIGNIN_CONFIRM_ROLE_KEYWORDS]: isStringList,
        [SK.SIGNIN_CONFIRM_TYPE_IDS]:      isStringList,
        [SK.WELCOME_SEEN]: (v) => typeof v === "boolean",
        [SK.START_VIEW]: (v) =>
          !!v && typeof v === "object" && !Array.isArray(v) &&
          !!v.filters && typeof v.filters === "object" && !Array.isArray(v.filters) &&
          (v.search === undefined || typeof v.search === "string"),
        [SK.ASSUME_PROFILES]: (v) =>
          Array.isArray(v) && v.every((p) =>
            p && typeof p === "object" &&
            typeof p.name === "string" && p.name.length <= 64 &&
            typeof p.hub === "string" && /^\d{12}$/.test(p.hub) &&
            typeof p.role === "string" && p.role.length <= 128
          ),
        [SK.JUMP_RECENTS]: (v) =>
          Array.isArray(v) && v.every((r) =>
            r && typeof r === "object" &&
            typeof r.org === "string" && typeof r.account === "string" &&
            (r.label === undefined || typeof r.label === "string") &&
            (r.role === undefined || typeof r.role === "string")
          ),
        [SK.JUMP_PINNED]: (v) =>
          Array.isArray(v) && v.every((r) =>
            r && typeof r === "object" &&
            typeof r.org === "string" && typeof r.account === "string" &&
            (r.label === undefined || typeof r.label === "string") &&
            (r.role === undefined || typeof r.role === "string")
          ),
      };

      const allowed = new Set(SETTINGS_EXPORT_KEYS);
      const toWrite = {};
      const rejected = [];
      let count = 0;
      for (const [k, v] of Object.entries(settings)) {
        if (!allowed.has(k)) continue;
        // Accept both clean (object/array) and legacy (JSON-string) shapes.
        let value = v;
        if (STRING_SERIALIZED_KEYS.has(k) && typeof v === "string") {
          try { value = JSON.parse(v); } catch (e) {
            rejected.push(k); continue;
          }
        }
        const check = validators[k];
        if (!check || !check(value)) {
          rejected.push(k); continue;
        }
        // Round-trip: write the canonical storage shape (string-serialised
        // for the legacy keys, raw for the rest).
        toWrite[k] = STRING_SERIALIZED_KEYS.has(k) ? JSON.stringify(value) : value;
        count++;
      }

      if (count === 0) {
        showToast("No valid settings found in the JSON", "error", CONFIG.TOAST_DURATION_LONG);
        return;
      }
      if (rejected.length > 0) {
        console.warn("Rejected malformed import keys:", rejected);
      }
      try {
        await chrome.storage.local.set(toWrite);
        close();
        const msg = rejected.length
          ? `Imported ${count} settings (${rejected.length} skipped) — reloading…`
          : `Imported ${count} settings — reloading…`;
        showToast(msg, "success", CONFIG.TOAST_DURATION);
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast("Storage write failed: " + err.message, "error", CONFIG.TOAST_DURATION_LONG);
      }
    });
  });

  // --- Handle Recent limit configuration (styled modal, matches other settings) ---
  $("body").on("click", "#tm_recent_limit", function (e) {
    e.preventDefault();
    const current = RecentRolesManager.getLimit();
    const modalHTML = `
      <div id="tm_recent_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 420px !important;
            width: 90% !important;
        ">
          <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">Recent Roles Limit</h3>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            How many recent roles to remember and show under the Recent filter? (1–100)
          </p>
          <input type="number" id="tm_recent_input" min="1" max="100" step="1" value="${current}" style="
              width: 100% !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 8px 10px !important;
              font-family: monospace !important;
              font-size: 14px !important;
              box-sizing: border-box !important;
          " />
          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_recent_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);
    setTimeout(() => $("#tm_recent_input").trigger("focus").trigger("select"), 0);

    $m.find('[data-action="save"]').on("click", async function () {
      const raw = $("#tm_recent_input").val();
      const saved = await RecentRolesManager.setLimit(raw);
      if (saved) {
        $("#tm_recent_limit").text(`Recent: ${RecentRolesManager.getLimit()}`);
        FilterManager.applyFilters();
        close();
        showToast(`Recent limit set to ${RecentRolesManager.getLimit()}`, "success", CONFIG.TOAST_DURATION);
      }
    });
  });

  // Remap activeFilters whenever an entry id changes (label edit can rename
  // an entry). Any filter that referenced the old id either gets the new id
  // (rename) or drops out entirely (delete).
  const remapActiveFilters = (group, idMap, finalEntries) => {
    if (!activeFilters[group]) return;
    const validIds = new Set(finalEntries.map((e) => e.id));
    activeFilters[group] = activeFilters[group]
      .map((id) => idMap[id] || id)
      .filter((id) => validIds.has(id));
  };

  // --- Handle manage environments ---
  $("body").on("click", "#tm_manage_environments", function (e) {
    e.preventDefault();
    showPatternsModal({
      modalId: "tm_envs_modal",
      title: "Environments",
      description: "Each entry colors a filter button, the role-card left stripe, and the AWS console favicon. Patterns are substrings of the account name or full account IDs.",
      addButtonLabel: "Add environment",
      labelPlaceholder: "e.g. PROD",
      defaults: CONFIG.DEFAULT_ENV_PATTERNS,
      current: EnvironmentsManager.entries(),
      onSave: (entries) => EnvironmentsManager.save(entries),
      onChangeIds: (idMap) => remapActiveFilters("env", idMap, EnvironmentsManager.entries()),
      onAfterSave: () => {
        renderFilterRow("env", EnvironmentsManager.entries());
        applyEnvironmentStyling();
        FilterManager.applyFilters();
      },
      toastOnSave: "Environments saved!",
    });
  });

  // --- Handle manage organizations ---
  $("body").on("click", "#tm_manage_organizations", function (e) {
    e.preventDefault();
    showPatternsModal({
      modalId: "tm_orgs_modal",
      title: "Organizations",
      description: "Cluster accounts into organizations. Used by the toolbar filter row and by tab-group \"By org\" mode. Patterns are substrings of the account name or full account IDs.",
      addButtonLabel: "Add organization",
      labelPlaceholder: "e.g. ACME",
      defaults: CONFIG.DEFAULT_ORG_PATTERNS,
      current: OrganizationsManager.entries(),
      onSave: (entries) => OrganizationsManager.save(entries),
      onChangeIds: (idMap) => remapActiveFilters("org", idMap, OrganizationsManager.entries()),
      onAfterSave: () => {
        renderFilterRow("org", OrganizationsManager.entries());
        FilterManager.applyFilters();
      },
      toastOnSave: "Organizations saved!",
    });
  });

  // --- Handle manage account types ---
  $("body").on("click", "#tm_manage_types", function (e) {
    e.preventDefault();
    showPatternsModal({
      modalId: "tm_types_modal",
      title: "Account Types",
      description: "Define categories like Management, Security, Logging, Network … Patterns are substrings of the account name or full account IDs. Configured types can be flagged as \"sensitive\" in General Settings.",
      addButtonLabel: "Add account type",
      labelPlaceholder: "e.g. Security",
      defaults: CONFIG.DEFAULT_TYPE_PATTERNS,
      current: AccountTypesManager.entries(),
      onSave: (entries) => AccountTypesManager.save(entries),
      onChangeIds: async (idMap) => {
        remapActiveFilters("type", idMap, AccountTypesManager.entries());
        // The sensitive-sign-in trigger references account-type ids — keep them in sync.
        signinConfirmTypeIdsCache = signinConfirmTypeIdsCache
          .map((id) => idMap[id] || id)
          .filter((id) => AccountTypesManager.findEntry(id));
        await StorageManager.saveSigninConfirmTypeIds(signinConfirmTypeIdsCache);
      },
      onAfterSave: () => {
        renderFilterRow("type", AccountTypesManager.entries());
        FilterManager.applyFilters();
      },
      toastOnSave: "Account types saved!",
    });
  });

  // --- General Settings (region / homepage / sensitive sign-in triggers) ---
  $("body").on("click", "#tm_general_settings", function (e) {
    e.preventDefault();

    const types = AccountTypesManager.entries();
    const typeCheckboxes = types.length === 0
      ? `<div style="color:#6c757d !important; font-size: 13px !important; padding: 6px 0 !important;">No account types configured yet. Add them via <em>Account Types</em>.</div>`
      : types.map((t) => {
          const checked = signinConfirmTypeIdsCache.includes(t.id) ? "checked" : "";
          // Re-validate the color even though renderFilterRow does too —
          // this modal could be opened before the toolbar paints, and
          // injecting a raw color value into a CSS context is its own
          // attack surface.
          const safeColor = (t.color && /^#[0-9a-fA-F]{3,8}$/.test(t.color)) ? t.color : "#6c757d";
          return `
            <label style="display: flex !important; align-items: center !important; gap: 8px !important; padding: 4px 0 !important; cursor: pointer !important;">
              <input type="checkbox" class="tm_signin_type_id" value="${escapeHtml(t.id)}" ${checked} />
              <span style="display:inline-block !important; width:10px !important; height:10px !important; border-radius:2px !important; background:${safeColor} !important; border:1px solid rgba(0,0,0,0.1) !important;"></span>
              <span style="font-size: 13px !important; color: #16191f !important;">${escapeHtml(t.label)}</span>
            </label>
          `;
        }).join("");

    const modalHTML = `
      <div id="tm_general_settings_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 560px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 14px 0 !important; color: #16191f !important;">General Settings</h3>

          <label style="display: block !important; margin-bottom: 14px !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Default AWS region</span>
            <select id="tm_gs_region" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-size: 13px !important; box-sizing: border-box !important; cursor: pointer !important;
            ">
              ${(() => {
                const cur = awsRegionCache || CONFIG.DEFAULT_AWS_REGION;
                const list = regionListCache.slice();
                if (!list.some((r) => r.id === cur)) list.unshift({ id: cur, label: cur });
                return list
                  .map(
                    (r) =>
                      `<option value="${escapeHtml(r.id)}"${r.id === cur ? " selected" : ""}>${escapeHtml(r.label)} (${escapeHtml(r.id)})</option>`
                  )
                  .join("");
              })()}
            </select>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 4px !important;">
              Only regions added under <em>Regions</em> are listed — add more there.
              Used as the sign-in destination region and the <code>{region}</code> placeholder in service paths.
            </span>
          </label>

          <label style="display: block !important; margin-bottom: 14px !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Homepage URL (footer link)</span>
            <input type="text" id="tm_gs_homepage" value="${sanitizeInput(homepageUrlCache)}" placeholder="https://your.docs/url (leave blank to hide)" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-size: 13px !important; box-sizing: border-box !important;
            " />
          </label>

          <div style="margin-bottom: 14px !important;">
            <div style="font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Sensitive-sign-in role keywords</div>
            <input type="text" id="tm_gs_signin_keywords" value="${sanitizeInput(signinConfirmRoleKeywordsCache.join(', '))}" placeholder="admin, root, breakglass" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-size: 13px !important; box-sizing: border-box !important;
            " />
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 4px !important;">
              Comma-separated. Signing in to a role whose name contains any of these pops a confirmation modal.
            </span>
          </div>

          <div style="margin-bottom: 6px !important;">
            <div style="font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Sensitive account types</div>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-bottom: 6px !important;">
              Signing in to a role on an account that matches any of these types pops the confirmation modal.
            </span>
            <div id="tm_gs_signin_types" style="
                border: 1px solid #e1e4e8 !important;
                border-radius: 4px !important;
                padding: 8px 12px !important;
                background: #fafbfc !important;
            ">${typeCheckboxes}</div>
          </div>

          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="cancel" type="button" style="
                padding: 8px 16px !important; margin-right: 10px !important;
                border: 1px solid #ccc !important; background: white !important;
                border-radius: 4px !important; cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" type="button" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important; color: white !important;
                border-radius: 4px !important; cursor: pointer !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHTML);
    const $m = $("#tm_general_settings_modal");
    const close = () => $m.remove();
    $m.on("click", function (ev) { if (ev.target === this) close(); });
    $m.find('[data-action="cancel"]').on("click", close);

    $m.find('[data-action="save"]').on("click", async function () {
      const region = ($("#tm_gs_region").val() || "").trim();
      const homepage = ($("#tm_gs_homepage").val() || "").trim();
      const keywordsRaw = ($("#tm_gs_signin_keywords").val() || "").trim();
      const signinRoleKeywords = keywordsRaw
        ? keywordsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const signinTypeIds = $m.find(".tm_signin_type_id:checked")
        .get().map((el) => el.value);

      const prevRegion = awsRegionCache;
      await GeneralSettingsManager.save({ region, homepage, signinRoleKeywords, signinTypeIds });
      updateHomepageFooter();
      close();
      if (awsRegionCache !== prevRegion) {
        showToast("Region changed — reloading to refresh service links…", "success", CONFIG.TOAST_DURATION);
        setTimeout(() => location.reload(), 800);
      } else {
        showToast("Settings saved!", "success", CONFIG.TOAST_DURATION);
      }
    });
  });

  // --- Handle manage role names ---
  $("body").on("click", "#tm_manage_role_names", function (e) {
    e.preventDefault();
    showPatternsModal({
      modalId: "tm_role_names_modal",
      title: "Role Names",
      description: "Filter buttons that match against the role name (not account info). Useful for picking out Admin / ReadOnly / DevOps etc. Patterns are case-insensitive substrings of the role text.",
      addButtonLabel: "Add role-name filter",
      labelPlaceholder: "e.g. Admin",
      patternHelp: "One keyword per line — e.g. admin, readonly, devops",
      defaults: CONFIG.DEFAULT_ROLE_PATTERNS,
      current: RolesManager.entries(),
      onSave: (entries) => RolesManager.save(entries),
      onChangeIds: (idMap) => remapActiveFilters("role", idMap, RolesManager.entries()),
      onAfterSave: () => {
        renderFilterRow("role", RolesManager.entries());
        FilterManager.applyFilters();
      },
      toastOnSave: "Role names saved!",
    });
  });

  // --- Handle filter buttons ---
  $("body").on("click", ".tm_filter_button", function (e) {
    e.preventDefault();
    const $button = $(this);
    const group = String($button.data("group"));
    // .data() mirrors jQuery's coercion, so a numeric tag ("123") or one named
    // "true" comes back as a Number/Boolean and then fails the string compare in
    // matchesFilters (rowTags are strings). Force it back to a string at the one
    // place it enters activeFilters.
    const filter = String($button.data("filter"));

    debug(`Filter clicked: ${group}:${filter}`);

    // A custom shortcut is a saved VIEW, not a single toggle: restore its
    // search + filter chips wholesale (clicking the active one clears).
    if ($button.hasClass("tm_custom_shortcut")) {
      const onDelete = e.target && e.target.closest && e.target.closest(".tm_shortcut_del");
      if (onDelete) {
        // Two-step: first ✕ click arms (red), second removes. Any other click
        // (below, or the disarm handler) cancels — so it can't fire by accident.
        twoStepDelete($button, onDelete, () => {
          const sc = ShortcutsManager.findByFilter(filter);
          const label = sc ? sc.label : "";
          ShortcutsManager.remove(sc).then((ok) => {
            if (ok) showToast(`Removed shortcut "${label}"`, "info", CONFIG.TOAST_DURATION_SHORT);
          });
        });
        return;
      }
      disarmConfirmDelete(); // a normal chip click cancels any pending delete
      ShortcutsManager.applyShortcut(ShortcutsManager.findByFilter(filter));
      return;
    }

    $button.toggleClass("active");

    if ($button.hasClass("active")) {
      if (!activeFilters[group].includes(filter)) {
        activeFilters[group].push(filter);
      }
    } else {
      activeFilters[group] = activeFilters[group].filter((f) => f !== filter);
    }

    debug("Updated filters:", activeFilters);

    FilterManager.applyFilters();
  });

  // --- Handle search ---
  // The search term is used only for `.includes()` against role text — never
  // injected back into HTML, so it stays as the user's raw input. Escaping
  // would break searches for & or other meta-characters.
  getCachedElement(CONFIG.SELECTORS.SEARCH_INPUT).on("input", function () {
    searchTerm = ($(this).val() || "").trim();
    searchSuggestHighlight = -1; // typing starts a fresh token — drop any highlight
    // Typing changes the result set, so a prior arrow-selection is stale — drop it
    // (also stops it lingering on a row the filter hides, then re-appearing).
    $(".saml-role.tm_kb_selected").removeClass("tm_kb_selected");
    syncFieldClear("tm_search_input", "tm_search_field");
    if (searchTerm.length >= 2 || searchTerm.length === 0) {
      FilterManager.applyFilters();
    }
  });

  // --- Search autocomplete: a click-to-insert suggestion strip (field prefixes,
  // then values for that field) plus an always-visible syntax legend. Keyboard
  // is untouched — chips are inserted by click, so Enter/arrows behave exactly
  // as elsewhere. ---
  // "id" is deliberately absent — it's an alias of "account" and only doubled up
  // the chips. Typing it by hand still parses (see KNOWN_QUERY_FIELDS).
  const SEARCH_FIELD_SUGGESTIONS = ["tag", "role", "name", "account", "env", "type", "org"];
  const searchFieldValues = (field) => {
    switch (field) {
      case "tag": case "tags": return AccountTagsManager.allTags();
      case "env": case "environment":
        return EnvironmentsManager.entries().map((e) => e.label).filter(Boolean);
      case "type": return AccountTypesManager.entries().map((e) => e.label).filter(Boolean);
      case "org": case "organization": case "organisation":
        return OrganizationsManager.entries().map((e) => e.label).filter(Boolean);
      case "role": {
        const set = new Set();
        document.querySelectorAll("#tm_role_list .tm_role_name").forEach((el) => {
          const t = el.textContent.trim();
          if (t) set.add(t);
        });
        return [...set].sort((a, b) => a.localeCompare(b));
      }
      default: return [];
    }
  };
  // Describe the token being edited (around the cursor) so we know whether to
  // suggest field prefixes or values, and where to splice a chosen suggestion.
  const searchSuggestContext = () => {
    const input = document.getElementById("tm_search_input");
    if (!input) return null;
    const value = input.value;
    const cur = input.selectionStart == null ? value.length : input.selectionStart;
    let start = cur;
    while (start > 0 && !/\s/.test(value[start - 1])) start--;
    let end = cur;
    while (end < value.length && !/\s/.test(value[end])) end++;
    let token = value.slice(start, end);
    let neg = "";
    if (token[0] === "-") { neg = "-"; token = token.slice(1); }
    const colon = token.indexOf(":");
    if (colon > 0 && KNOWN_QUERY_FIELDS.has(token.slice(0, colon).toLowerCase())) {
      const field = token.slice(0, colon).toLowerCase();
      const valPart = token.slice(colon + 1);
      const frag = (valPart.split(",").pop() || "").toLowerCase();
      const items = searchFieldValues(field)
        .filter((v) => v.toLowerCase().includes(frag))
        .slice(0, 8);
      return { kind: "value", start, end, neg, field, valPart, items };
    }
    const t = token.toLowerCase();
    const items = SEARCH_FIELD_SUGGESTIONS.filter((f) => t === "" || f.startsWith(t)).slice(0, 8);
    return { kind: "field", start, end, neg, items };
  };
  // Free-text fields (account id / name) have no enumerable values, so rather
  // than a dead-end "no matching values" we hint at what to type next.
  const SEARCH_VALUE_HINTS = {
    account: "type an account id", acct: "type an account id",
    id: "type an account id", name: "type text to match",
  };
  // "N matches" reflects the post-filter visible-row count; blank when the box
  // is empty. Only visible inside the expanded card (CSS :focus-within).
  const updateSearchMatchCount = () => {
    const el = document.getElementById("tm_search_matchcount");
    const foot = document.getElementById("tm_search_foot");
    // The footer earns its border only when there is a view worth saving or
    // counting — otherwise an empty search box shows a stray divider.
    if (foot) foot.classList.toggle("tm_foot_on", StartViewManager.hasCurrent());
    if (!el) return;
    const input = document.getElementById("tm_search_input");
    const q = input ? input.value.trim() : "";
    if (!q) { el.textContent = ""; return; }
    // lastVisibleCount was just set by applyFilters (which runs before this on
    // every input) — reuse it instead of re-scanning every .saml-role.
    const n = lastVisibleCount;
    el.textContent = n === 0 ? "no matches" : n === 1 ? "1 match" : `${n} matches`;
  };
  // Visibility of the whole card (input + suggest + count) is owned by the
  // #tm_search_container:focus-within CSS — this only fills in the content.
  // Alt/Option (Mac shows ⌥, Windows shows Alt) + arrows walk the chips below.
  const SUGGEST_KEYS_HINT = `<div class="tm_suggest_keys">${IS_MAC ? "⌥↑↓" : "Alt+↑↓"} move · ↵ add</div>`;
  const renderSearchSuggest = () => {
    const box = document.getElementById("tm_search_suggest");
    const input = document.getElementById("tm_search_input");
    if (!box || !input) return;
    const ctx = searchSuggestContext();
    searchSuggestItems = ctx && ctx.items ? ctx.items : [];
    // A highlight can outlive its list (query narrowed) — keep it in range.
    if (searchSuggestHighlight >= searchSuggestItems.length) {
      searchSuggestHighlight = searchSuggestItems.length - 1;
    }
    const chips = searchSuggestItems.length
      ? searchSuggestItems.map((it, i) => {
          const label = ctx.kind === "field" ? `${escapeHtml(it)}:` : escapeHtml(it);
          const active = i === searchSuggestHighlight ? " tm_suggest_active" : "";
          return `<button type="button" class="tm_suggest_chip${active}" data-val="${escapeHtml(it)}">${label}</button>`;
        }).join("")
      : "";
    const noneMsg = ctx && ctx.kind === "value" && SEARCH_VALUE_HINTS[ctx.field]
      ? escapeHtml(SEARCH_VALUE_HINTS[ctx.field])
      : "no matching values";
    box.innerHTML =
      (chips
        ? `<div class="tm_suggest_chips">${chips}</div>`
        : `<div class="tm_suggest_none">${noneMsg}</div>`) +
      `<div class="tm_suggest_legend"><b>prod dev</b> both · <b>prod,dev</b> either · <b>-dev</b> exclude · <b>"a b"</b> exact</div>` +
      (chips ? SUGGEST_KEYS_HINT : "");
    updateSearchMatchCount();
  };
  // Move the chip highlight with Alt/Option + arrows. Left/Right step through the
  // chips in order; Up/Down jump to the nearest chip in the adjacent visual row
  // (chips wrap into a grid, so a purely linear ↑↓ reads as ←→ — the "weird" bug).
  const moveSuggestByArrow = (key) => {
    const chips = [...document.querySelectorAll("#tm_search_suggest .tm_suggest_chip")];
    const n = chips.length;
    if (!n) return;
    const idx = searchSuggestHighlight;
    if (idx < 0) {
      searchSuggestHighlight = (key === "ArrowUp" || key === "ArrowLeft") ? n - 1 : 0;
      renderSearchSuggest();
      return;
    }
    if (key === "ArrowRight") { searchSuggestHighlight = (idx + 1) % n; renderSearchSuggest(); return; }
    if (key === "ArrowLeft") { searchSuggestHighlight = (idx - 1 + n) % n; renderSearchSuggest(); return; }
    // Up / Down: nearest chip in the adjacent row by horizontal centre.
    const rects = chips.map((c) => c.getBoundingClientRect());
    const cur = rects[idx];
    const curMid = cur.left + cur.width / 2;
    const rowOf = (r) => Math.round(r.top);
    const curRow = rowOf(cur);
    const dir = key === "ArrowDown" ? 1 : -1;
    let best = -1, bestRow = Infinity, bestDX = Infinity;
    for (let i = 0; i < n; i++) {
      const rowDelta = (rowOf(rects[i]) - curRow) * dir;
      if (rowDelta <= 0) continue; // must be in the arrow's direction
      const dx = Math.abs((rects[i].left + rects[i].width / 2) - curMid);
      if (rowDelta < bestRow || (rowDelta === bestRow && dx < bestDX)) {
        best = i; bestRow = rowDelta; bestDX = dx;
      }
    }
    if (best >= 0) { searchSuggestHighlight = best; renderSearchSuggest(); }
  };
  const acceptSearchSuggest = (val) => {
    const input = document.getElementById("tm_search_input");
    const ctx = searchSuggestContext();
    if (!input || !ctx || val == null) return;
    searchSuggestHighlight = -1; // fresh token after insert — no stale highlight
    let insert;
    if (ctx.kind === "field") {
      insert = `${ctx.neg}${val}:`;
    } else {
      const parts = ctx.valPart.split(",");
      parts[parts.length - 1] = val;
      insert = `${ctx.neg}${ctx.field}:${parts.join(",")} `;
    }
    const before = input.value.slice(0, ctx.start);
    const after = input.value.slice(ctx.end);
    input.value = before + insert + after;
    const pos = (before + insert).length;
    input.setSelectionRange(pos, pos);
    input.dispatchEvent(new Event("input", { bubbles: true })); // reuse the search handler
    input.focus();
    renderSearchSuggest();
  };
  const $si = getCachedElement(CONFIG.SELECTORS.SEARCH_INPUT);
  $si.on("focus", function () {
    searchSuggestHighlight = -1;
    closeShortcutSave(false); // never re-open the card mid-rename
    renderSearchSuggest();
  });
  $si.on("input", renderSearchSuggest);
  $si.on("keyup", renderSearchSuggest);
  // No blur handler needed: the card and its suggest/count collapse via the
  // #tm_search_container:focus-within CSS the moment focus leaves the input.
  // mousedown keeps the input focused (no blur), so the strip survives the click.
  $("body").on("mousedown", ".tm_suggest_chip", function (e) { e.preventDefault(); });
  $("body").on("click", ".tm_suggest_chip", function (e) {
    e.preventDefault();
    acceptSearchSuggest(this.getAttribute("data-val"));
  });

  // --- Save the current search + filters as a named Shortcut, inline in the
  // card. Writing the array directly (rather than through the modal's
  // `Label: "search"` text format) is what lets a quoted/exact query round-trip.
  const suggestShortcutName = () => {
    const input = document.getElementById("tm_search_input");
    const q = input ? input.value.trim() : "";
    // Drop the field: prefixes and quotes so the default name reads naturally.
    const words = q
      .replace(/-?[A-Za-z]+:/g, " ")
      .replace(/["',]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .join(" ");
    if (words) return words;
    const f = activeFilters;
    const chips = [...f.tag, ...f.env, ...f.type, ...f.org, ...f.role].filter(Boolean);
    return chips.slice(0, 3).join(" ") || "My view";
  };
  const closeShortcutSave = (refocus) => {
    const wrap = document.getElementById("tm_search_save");
    if (wrap) wrap.classList.remove("tm_saving");
    const input = document.getElementById("tm_search_input");
    if (refocus && input) input.focus();
  };
  const commitShortcutSave = async () => {
    const name = document.getElementById("tm_search_save_name");
    if (!name) return;
    const label = name.value.trim();
    if (!label) { name.focus(); return; }
    const ok = await ShortcutsManager.addCurrent(label);
    closeShortcutSave(true);
    if (ok) showToast(`Saved shortcut "${label}"`, "success", CONFIG.TOAST_DURATION_SHORT);
  };
  // Keep focus inside the card on mousedown so :focus-within never collapses it
  // mid-click (same trick as the suggest chips).
  $("body").on("mousedown", "#tm_search_save_btn, #tm_search_save_go", function (e) {
    e.preventDefault();
  });
  $("body").on("click", "#tm_search_save_btn", function (e) {
    e.preventDefault();
    const wrap = document.getElementById("tm_search_save");
    const name = document.getElementById("tm_search_save_name");
    if (!wrap || !name) return;
    wrap.classList.add("tm_saving");
    name.value = suggestShortcutName();
    name.focus();
    name.select();
  });
  $("body").on("click", "#tm_search_save_go", function (e) {
    e.preventDefault();
    commitShortcutSave();
  });
  // stopPropagation keeps Enter/Esc away from the global role-list shortcuts.
  $("body").on("keydown", "#tm_search_save_name", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commitShortcutSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeShortcutSave(true);
    }
  });

  // ✕ clears the account search and re-shows the full list. mousedown-
  // preventDefault keeps focus on the input so the pop-out card doesn't collapse
  // (focus-within) before the click lands — same trick as the suggest chips.
  $("body").on("mousedown", "#tm_search_clear", function (e) { e.preventDefault(); });
  $("body").on("click", "#tm_search_clear", function (e) {
    e.preventDefault();
    const inp = document.getElementById("tm_search_input");
    if (inp) {
      inp.value = "";
      inp.focus();
    }
    searchTerm = "";
    FilterManager.applyFilters();
    syncFieldClear("tm_search_input", "tm_search_field");
    renderSearchSuggest();
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addListener((e) => {
      if (currentTheme === "auto") {
        debug("System theme changed:", e.matches ? "dark" : "light");
        ThemeManager.applyTheme("auto");
      }
    });
  }

  // Initial setup

  // Start modal-theming observer before any modal can be created so the
  // welcome modal (and everything after) picks up the current theme.
  // subtree: true so re-renders inside a modal (e.g. "Add entry" in a config
  // modal) get themed too, not just the initial modal append.
  modalObserver.observe(document.body, { childList: true, subtree: true });

  // Initialize theme
  try {
    currentTheme = await StorageManager.getTheme();
    debug("Loaded theme:", currentTheme);
    await ThemeManager.applyTheme(currentTheme);
  } catch (e) {
    console.error("Error loading theme:", e);
    currentTheme = "light";
    await ThemeManager.applyTheme(currentTheme);
  }

  // Load favorites cache and initialize UI
  debug("Initializing favorites...");
  try {
    await FavoritesManager.loadCache();
    debug("Favorites cache initialized:", favoritesCache);
    await FavoritesManager.updateButtons();
    debug("Favorite buttons updated successfully");
  } catch (e) {
    console.error("Error during favorites initialization:", e);
  }

  // Load custom shortcuts cache and update UI
  debug("Initializing custom shortcuts...");
  try {
    await ShortcutsManager.loadCache();
    debug("Custom shortcuts cache initialized:", customShortcutsCache);
    ShortcutsManager.updateSection();
    debug("Shortcuts section updated successfully");
  } catch (e) {
    console.error("Error during custom shortcuts initialization:", e);
  }

  // Initialize compact mode
  debug("Initializing compact mode...");
  try {
    await CompactManager.loadSetting();
    debug("Loaded compact mode:", compactMode);
    CompactManager.apply();
    CompactManager.updateButton();
    debug("Compact mode applied successfully");
  } catch (e) {
    console.error("Error during compact mode initialization:", e);
  }

  // Sign-in new-tab default (toggle; ⌘/Ctrl/middle-click inverts it).
  try {
    await SigninTabManager.loadSetting();
    SigninTabManager.updateButton();
  } catch (e) {
    console.error("Error loading sign-in tab setting:", e);
  }

  // Sync the "Recent: N" floating-menu label with the stored limit.
  $("#tm_recent_limit").text(`Recent: ${RecentRolesManager.getLimit()}`);

  // Hydrate the tab-group tag + mode from storage, then reflect both into the
  // inline "Tab group" dropdown (and the side-menu button label).
  try {
    tabGroupTagCache = await StorageManager.getTabGroupTag();
  } catch (e) {
    console.error("Error loading tab group tag:", e);
  }
  try {
    tabGroupModeCache = await StorageManager.getTabGroupMode();
    updateTabGroupModeButton();
  } catch (e) {
    console.error("Error loading tab group mode:", e);
  }
  syncGroupControl();
  syncFieldClear("tm_search_input", "tm_search_field");

  // Center the side-menu pull-tab on the filter panel (not on the tall menu it
  // belongs to, which pushed the tab well below the panel). Re-measured on any
  // panel resize (compact toggle, filter config) and window resize.
  const positionActionsHandle = () => {
    const wrap = document.getElementById("tm_interface_wrapper");
    const container = document.getElementById("tm_actions_container");
    if (!wrap || !container) return;
    const r = wrap.getBoundingClientRect();
    const center = r.top + r.height / 2;
    // The container is fixed at top: 20px and its ::before tab is
    // translateY(-50%), so this `top` is where the tab's centre lands.
    container.style.setProperty("--tm-handle-top", Math.max(16, center - 20) + "px");
  };
  positionActionsHandle();
  window.addEventListener("resize", positionActionsHandle);
  if (window.ResizeObserver) {
    const handleRO = new ResizeObserver(() => positionActionsHandle());
    const wrapEl = document.getElementById("tm_interface_wrapper");
    if (wrapEl) handleRO.observe(wrapEl);
  }

  // Apply the saved "start view" (default filters), if one is configured. Runs
  // after the filter rows + custom-shortcut chips are rendered so their .active
  // state can be restored; silent so it doesn't toast "Showing N of M" on load.
  try {
    startViewCache = await StorageManager.getStartView();
    updateStartViewButton();
    if (startViewCache) StartViewManager.apply(startViewCache, true);
  } catch (e) {
    console.error("Error applying start view:", e);
  }

  // Reveal + populate the Jump-to-account bar if any assume profiles exist.
  refreshJumpBar();

  // Apply initial environment-based styling
  applyEnvironmentStyling();

  debug(`Added buttons to ${$(".tm_role_buttons").length} roles`);

  // First-run welcome — only on the very first load after install.
  try {
    const seen = await StorageManager.getWelcomeSeen();
    if (!seen) showAboutModal({ firstRun: true });
  } catch (e) {
    console.warn("Welcome-modal first-run check failed:", e);
  }
})();
