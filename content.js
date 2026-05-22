// Console Hopper — Chrome Extension
// Enhances the AWS SAML role picker with filters, favorites, deep-link
// services, per-tab env decoration, and tab-group clustering.

(async function () {
  "use strict";

  // === CONSTANTS & CONFIGURATION ===
  // All org-specific labels, filter buttons, colors and triggers are driven
  // from chrome.storage via the "Manage …" side-menu modals. The defaults
  // below are intentionally generic so the plugin works in any AWS org.
  const CONFIG = {
    SCRIPT_VERSION: chrome.runtime.getManifest().version,
    SCRIPT_HOMEPAGE_DEFAULT: "",
    DEFAULT_AWS_REGION: "us-east-1",
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
      SERVICES: "aws_services",
      LAST_SERVICE: "aws_last_service",
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
      HOMEPAGE_URL: "aws_homepage_url",
      SIGNIN_CONFIRM_ROLE_KEYWORDS: "aws_signin_role_keywords",
      SIGNIN_CONFIRM_TYPE_IDS: "aws_signin_type_ids",
      WELCOME_SEEN: "hop_welcome_seen",
    },
    TAB_GROUP_MODES: ["role", "org", "off"],
    TAB_GROUP_MODE_LABELS: { role: "By role", org: "By org", off: "Off" },
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
      SEARCH_INPUT: "#tm_search_input",
      FAVORITE_BUTTONS: ".tm_favorite_button",
      FILTER_BUTTONS: ".tm_filter_button",
      SHORTCUTS_SECTION: ".tm_shortcuts_section .tm_button_group",
      CUSTOM_SHORTCUTS: ".tm_custom_shortcut",
    },
  };

  // === UTILITY FUNCTIONS ===
  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Proper HTML escaper. Use this anywhere a string is interpolated into an
  // HTML template literal — both for text contexts and for attribute values
  // (the same five-char escape is safe for both, assuming attributes are
  // quoted with " or ' in the template). NEVER use this for CSS or URL
  // contexts; those need their own escapers.
  const escapeHtml = (input) => {
    if (input == null) return "";
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };
  // Backwards-compatible alias. sanitizeInput was previously misused as an
  // HTML escaper despite only stripping <>; the alias makes the existing
  // callsites safe without a sweep, and any non-HTML uses (e.g. search input
  // value going into String.includes) get harmless extra escaping that they
  // ignore.
  const sanitizeInput = escapeHtml;

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

  console.log(`Console Hopper v${CONFIG.SCRIPT_VERSION}`);

  // Global filter state
  let activeFilters = {
    org: [],
    env: [],
    type: [],
    role: [],
    show: [],
  };
  let searchTerm = "";

  // Cache favorites list for performance
  let favoritesCache = [];

  // Cache custom shortcuts for performance
  let customShortcutsCache = [];

  // Configurable filter rows, each cached as an ordered array of
  // { id, label, color, patterns:[] } entries. Edited via the corresponding
  // side-menu "Manage …" modal; rendered into the toolbar by renderFilterRow.
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
  // Default tab-group mode used when the tag input is empty.
  let tabGroupModeCache = "role";

  // Compact mode setting
  let compactMode = false;

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
  const LIGHT_MODAL_DEFAULTS = { bg: "white", softBox: "#f8f9fa", border: "#e1e4e8", text: "#16191f", muted: "#6c757d" };

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
      console.log("Loading favorites into cache...");
      favoritesCache = await StorageManager.getFavorites();
      console.log("Favorites cache loaded:", favoritesCache);
    },

    async saveFavorites(favorites) {
      const saved = await StorageManager.saveFavorites(favorites);
      if (saved !== false) {
        favoritesCache = [...favorites];
        console.log("Updated favorites cache:", favoritesCache);
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
      console.log(
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
      console.log("Updating favorite buttons...");
      console.log("Current favorites cache for button update:", favoritesCache);

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
      console.log("Loading custom shortcuts into cache...");
      customShortcutsCache = await StorageManager.getCustomShortcuts();
      console.log("Custom shortcuts cache loaded:", customShortcutsCache);
    },

    async saveShortcuts(shortcuts) {
      const saved = await StorageManager.saveCustomShortcuts(shortcuts);
      if (saved !== false) {
        customShortcutsCache = [...shortcuts];
        console.log("Updated shortcuts cache:", customShortcutsCache);
        return true;
      } else {
        showToast("Failed to save shortcuts", "error");
        return false;
      }
    },

    generateHTML() {
      let shortcutsHTML =
        '<a href="#" class="tm_filter_button" data-group="show" data-filter="favorites">Favorites</a>' +
        '<a href="#" class="tm_filter_button" data-group="show" data-filter="recent">Recent</a>';

      customShortcutsCache.forEach((shortcut) => {
        const safeLabelId = sanitizeInput(shortcut.label)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const safeSearch = sanitizeInput(shortcut.search);
        const safeLabel = sanitizeInput(shortcut.label);
        shortcutsHTML += `<a href="#" class="tm_filter_button tm_custom_shortcut" data-group="show" data-filter="custom_${safeLabelId}" data-search="${safeSearch}">${safeLabel}</a>`;
      });

      return shortcutsHTML;
    },

    updateSection() {
      getCachedElement(CONFIG.SELECTORS.SHORTCUTS_SECTION).html(
        this.generateHTML()
      );
    },
  };

  // === COMPACT MODE MANAGEMENT ===
  const CompactManager = {
    async loadSetting() {
      compactMode = await StorageManager.getCompactMode();
      console.log("Loaded compact mode:", compactMode);
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
        console.log("Applied compact mode");
      } else {
        $("body").removeClass("tm_compact_mode");
        console.log("Removed compact mode");
      }
    },

    updateButton() {
      getCachedElement(CONFIG.SELECTORS.COMPACT_TOGGLE).text(
        `Compact: ${compactMode ? "On" : "Off"}`
      );
    },
  };

  // === SERVICES MANAGEMENT ===
  let servicesCache = [];
  let lastServicesCache = {};

  const ServicesManager = {
    async loadCache() {
      console.log("Loading services into cache...");
      servicesCache = await StorageManager.getServices();
      console.log("Services cache loaded:", servicesCache);
    },

    async loadLastServicesCache() {
      const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LAST_SERVICE);
      lastServicesCache = result[CONFIG.STORAGE_KEYS.LAST_SERVICE] ?? {};
      console.log("Last services cache loaded:", lastServicesCache);
    },

    async saveServices(services) {
      const saved = await StorageManager.saveServices(services);
      if (saved !== false) {
        servicesCache = [...services];
        console.log("Updated services cache:", servicesCache);
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

  // Helper function to parse account info. AWS renders `Account: name (id)`;
  // on the fallback path (no match) we still strip the `Account:` prefix so
  // it doesn't show up in the role row.
  const parseAccountInfo = (accountText) => {
    const text = (accountText || "").trim();
    const match = text.match(/Account:\s*(.+?)\s*\((\d+)\)/);
    if (match) {
      return {
        name: match[1].trim(),
        id: match[2].trim(),
      };
    }
    return { name: text.replace(/^Account:\s*/i, ""), id: "" };
  };

  // Shared matcher: a pattern is either an exact account-ID match (full
  // 12-digit account number) or a case-insensitive substring of the account
  // name. Used by every entry-based manager.
  const matchesAnyPattern = (patterns, accountName, accountId) => {
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
  const matchesRolePatterns = (patterns, roleName) => {
    if (!patterns || patterns.length === 0) return false;
    const rn = (roleName || "").toLowerCase();
    for (const raw of patterns) {
      const p = (raw || "").toString().trim().toLowerCase();
      if (p && rn.includes(p)) return true;
    }
    return false;
  };

  // Generic factory: each manager backs a configurable filter row in the
  // toolbar. Entries shape is [{id, label, color, patterns:[]}] (see
  // normalizePatternList). save() writes the whole list at once; lookups
  // operate over the cached array.
  const makeEntryManager = ({ cacheGet, cacheSet, storageGet, storageSave, label }) => ({
    async loadCache() {
      cacheSet(await storageGet());
      console.log(`${label} cache loaded:`, cacheGet());
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
      console.log("General settings cache loaded:", {
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
      console.log("Recent roles cache loaded:", recentRolesCache, "limit:", recentLimit);
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
      console.log("Role order cache loaded:", roleOrderCache.length, "entries");
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

  // Render the filter buttons for a single toolbar row from a list of
  // { id, label, color, patterns } entries. Buttons get inline CSS variable
  // --tm-fb-color so the per-entry colour shows on both idle and .active
  // states. Existing non-button children (e.g. the #tm_group_tag_input on
  // the types row) are preserved.
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
  };

  // Re-render every configurable filter row from its current cache.
  const renderAllFilterRows = () => {
    renderFilterRow("org",  OrganizationsManager.entries());
    renderFilterRow("env",  EnvironmentsManager.entries());
    renderFilterRow("type", AccountTypesManager.entries());
    renderFilterRow("role", RolesManager.entries());
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

  // Optimized filter matching function
  const matchesFilters = ($role) => {
    const accountName = $role.find(".tm_account_name").text().toLowerCase();
    const accountId = $role.find(".tm_account_id").text().toLowerCase();
    const roleName = $role.find(".tm_role_name").text().toLowerCase();
    const fullText = `${accountName} ${accountId} ${roleName}`;
    const roleArn = $role.find(".tm_signin_button").data("role-arn");

    // Text search
    if (searchTerm && !fullText.includes(searchTerm.toLowerCase())) {
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
    // so PROD/TEST/DEV filter buttons stay in sync with the Manage Environments modal.
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

    // Role name filters — configurable via Manage Role Names. Each active
    // entry's patterns are case-insensitive substrings of the role text.
    if (activeFilters.role.length > 0) {
      const roleMatch = activeFilters.role.some((id) =>
        RolesManager.matches(id, roleName)
      );
      if (!roleMatch) return false;
    }

    // Special "show" filters: built-in Favorites/Recent + any user-defined
    // search shortcut (Manage Shortcuts) where the shortcut's `search` string
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
            const searchString = $button.data("search");
            if (
              searchString &&
              !fullText.includes(String(searchString).toLowerCase())
            )
              return false;
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

    applyFilters() {
      let visibleCount = 0;
      let totalCount = 0;

      console.log("Applying filters:", activeFilters, "Search:", searchTerm);

      getCachedElement(CONFIG.SELECTORS.SAML_ROLES).each(function () {
        const $role = $(this);
        totalCount++;

        if (matchesFilters($role)) {
          $role.css("display", "flex").show();
          visibleCount++;
        } else {
          $role.css("display", "none").hide();
        }
      });

      console.log(`Visible: ${visibleCount}, Total: ${totalCount}`);

      applyEnvironmentStyling();

      const filterCount = Object.values(activeFilters).flat().length;
      const hasSearch = searchTerm.length > 0;
      const filtersActive = filterCount > 0 || hasSearch;

      // Toggle a global flag so the drag-and-drop layer can refuse to start
      // a reorder while the view is filtered (avoids unintuitive ordering of
      // hidden rows).
      document.body.classList.toggle("tm_filters_active", filtersActive);

      if (filtersActive) {
        showToast(
          `Showing ${visibleCount} of ${totalCount} roles`,
          "info",
          CONFIG.TOAST_DURATION_LONG
        );
      }
    },

    clearAll() {
      activeFilters = { org: [], env: [], type: [], role: [], show: [] };
      searchTerm = "";

      getCachedElement(CONFIG.SELECTORS.FILTER_BUTTONS).removeClass("active");
      getCachedElement(CONFIG.SELECTORS.SEARCH_INPUT).val("");

      getCachedElement(CONFIG.SELECTORS.SAML_ROLES).each(function () {
        $(this).css("display", "flex").show();
      });

      // Filters are off again: drop the body marker drag-and-drop watches.
      document.body.classList.remove("tm_filters_active");
      applyEnvironmentStyling();

      showToast("All filters cleared", "info", CONFIG.TOAST_DURATION_SHORT);
    },
  };

  // Build the AWS Console deep-link AWS will redirect to after SAML sign-in.
  // Uses the regional console host so AWS doesn't have to redirect from the
  // global one, and so multi-session routing (when enabled) kicks in directly.
  // Appends a URL fragment payload (env/account/role) so the console-side
  // decorator script can color and label the resulting tab.
  const buildDestination = (servicePath, labelPayload) => {
    const region = GeneralSettingsManager.region() || CONFIG.DEFAULT_AWS_REGION;
    const host = `https://${region}.console.aws.amazon.com`;
    const path = (servicePath || "").replace(/\{region\}/g, region);
    const base = path ? `${host}/${path}` : `${host}/`;
    if (!labelPayload) return base;
    try {
      const encoded = btoa(JSON.stringify(labelPayload));
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
  $('h1.background, form p:contains("Select a role:")').remove();
  $("#signin_button").parent().hide();

  // --- Add UI Components ---
  // Filter rows are containers; their buttons are rendered by renderFilterRow
  // from the corresponding manager's cached entries. This means the toolbar
  // automatically reflects whatever the user configures via "Manage …" modals.
  const mainPanelHTML = `
        <div id="tm_interface_wrapper">
            <div class="tm_main_layout">
                <div class="tm_left_column">
                    <div class="tm_filter_row" id="tm_row_1">
                        <div class="tm_filter_section tm_org_section">
                            <h4>ORGANIZATIONS</h4>
                            <div class="tm_button_group" data-filter-group="org"></div>
                        </div>
                        <div class="tm_divider"></div>
                        <div class="tm_filter_section tm_env_section">
                            <h4>ENVIRONMENTS</h4>
                            <div class="tm_button_group" data-filter-group="env"></div>
                        </div>
                        <div class="tm_divider"></div>
                        <div class="tm_filter_section tm_role_section">
                            <h4>ROLE NAMES</h4>
                            <div class="tm_button_group" data-filter-group="role"></div>
                        </div>
                    </div>
                    <div class="tm_filter_row" id="tm_row_2">
                        <div class="tm_filter_section tm_types_section">
                            <h4>ACCOUNT TYPES</h4>
                            <div class="tm_button_group" data-filter-group="type">
                                <div class="tm_divider" style="margin: 0 8px 0 4px !important;"></div>
                                <input id="tm_group_tag_input" class="tm_group_tag_input" type="text" placeholder="Tab group tag…" autocomplete="off" />
                            </div>
                        </div>
                        <div class="tm_divider"></div>
                        <div class="tm_filter_section tm_search_section">
                            <h4>SEARCH</h4>
                            <div id="tm_search_container">
                                <input type="text" id="tm_search_input" placeholder="Find account..." autocomplete="off">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tm_right_column">
                    <div class="tm_filter_row" id="tm_row_3">
                        <div class="tm_filter_section tm_shortcuts_section">
                            <h4>SHORTCUTS</h4>
                            <div class="tm_button_group">
                                <a href="#" class="tm_filter_button" data-group="show" data-filter="favorites">Favorites</a>
                                <a href="#" class="tm_filter_button" data-group="show" data-filter="recent">Recent</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  const floatingActionsHTML = `
        <div id="tm_actions_container">
            <a href="#" class="tm_action_button" id="tm_theme_toggle">Theme: Light</a>
            <a href="#" class="tm_action_button" id="tm_compact_toggle">Compact: Off</a>
            <a href="#" class="tm_action_button" id="tm_recent_limit">Recent: 10</a>
            <a href="#" class="tm_action_button" id="tm_tab_group_mode">Tab Groups: By role</a>
            <a href="#" class="tm_action_button" id="tm_manage_shortcuts">Manage Shortcuts</a>
            <a href="#" class="tm_action_button" id="tm_manage_organizations">Manage Organizations</a>
            <a href="#" class="tm_action_button" id="tm_manage_environments">Manage Environments</a>
            <a href="#" class="tm_action_button" id="tm_manage_types">Manage Account Types</a>
            <a href="#" class="tm_action_button" id="tm_manage_role_names">Manage Role Names</a>
            <a href="#" class="tm_action_button" id="tm_manage_services">Manage Services</a>
            <a href="#" class="tm_action_button" id="tm_general_settings">General Settings</a>
            <a href="#" class="tm_action_button" id="tm_export_settings">Export Settings</a>
            <a href="#" class="tm_action_button" id="tm_import_settings">Import Settings</a>
            <a href="#" class="tm_action_button" id="tm_reset_order">Reset Order</a>
            <a href="#" class="tm_action_button" id="tm_reset_recent">Reset Recent</a>
            <a href="#" class="tm_action_button" id="tm_keyboard_help">Keyboard Shortcuts</a>
            <a href="#" class="tm_action_button" id="tm_about">Help / About</a>
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

        body.tm_theme_dark .tm_filter_section h4 {
            color: #cbd5e0 !important;
        }

        body.tm_theme_dark .tm_divider {
            border-color: #4a5568 !important;
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
            color: #63b3ed !important;
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
        }

        .tm_left_column {
            flex: 0 0 65% !important;
            border-right: 1px solid #f0f0f0 !important;
            padding-right: 15px !important;
        }

        .tm_right_column {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            padding-left: 15px !important;
        }

        body.tm_theme_dark .tm_left_column {
            border-right-color: #3a4148 !important;
        }

        .tm_filter_row {
            display: flex !important;
        }

        #tm_row_1 {
            border-bottom: 1px solid #f0f0f0 !important;
            padding-bottom: 10px !important;
            margin-bottom: 10px !important;
        }

        #tm_row_2 {
            padding-bottom: 0px !important;
            margin-bottom: 0px !important;
        }

        #tm_row_3 {
            padding-bottom: 0px !important;
            margin-bottom: 0px !important;
        }

        body.tm_theme_dark #tm_row_1 {
            border-bottom-color: #3a4148 !important;
        }

        .tm_divider {
            border-left: 1px solid #e7e7e7 !important;
            margin: 0 15px !important;
            align-self: stretch !important;
        }

        .tm_filter_section h4 {
            font-size: 12px !important;
            color: #545b64 !important;
            margin: 0 0 8px 0 !important;
            text-transform: uppercase !important;
            font-weight: 700 !important;
        }

        .tm_org_section,
        .tm_env_section {
            flex: 0 0 auto !important;
            min-width: 120px !important;
        }

        .tm_role_section {
            flex: 0 0 auto !important;
            min-width: 260px !important;
        }

        .tm_shortcuts_section {
            flex: 1 !important;
            min-width: 180px !important;
            max-width: 100% !important;
            overflow: hidden !important;
        }

        .tm_types_section {
            flex: 0 0 auto !important;
            min-width: 440px !important;
        }

        .tm_search_section {
            flex: 0 0 auto !important;
            min-width: 180px !important;
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

        /* Tab-group tag override input — looks like another chip in the row,
           but is a text field. When non-empty, it overrides automatic
           account/role tab-grouping for subsequent Sign Ins. */
        .tm_group_tag_input {
            padding: 4px 12px !important;
            border: 1px dashed #adb5bd !important;
            border-radius: 15px !important;
            color: #16191f !important;
            font-size: 13px !important;
            background-color: #fff !important;
            transition: all 0.2s ease !important;
            outline: none !important;
            width: 160px !important;
            font-family: inherit !important;
        }
        .tm_group_tag_input::placeholder { color: #6c757d !important; font-style: italic !important; }
        .tm_group_tag_input:focus,
        .tm_group_tag_input:not(:placeholder-shown) {
            border-style: solid !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0,115,187,0.15) !important;
        }
        body.tm_theme_dark .tm_group_tag_input {
            background-color: #2d3748 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
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

        #tm_search_container {
            width: 100% !important;
            position: relative !important;
        }

        #tm_search_input {
            width: 90% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 35px 0 10px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
        }

        #tm_actions_container {
            position: fixed !important;
            top: 20px !important;
            /* Width is fixed so the hidden offset is predictable — the
               container's natural width follows the longest button label
               and was leaving ~80px of body sticking out at -120px. */
            width: 220px !important;
            right: -220px !important;
            box-sizing: border-box !important;
            z-index: 1000 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            transition: right 0.3s ease !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 8px 0 0 8px !important;
            padding: 8px 12px 8px 8px !important;
            border: 1px solid #e1e4e8 !important;
            border-right: none !important;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.1) !important;
        }

        #tm_actions_container::before {
            content: "..." !important;
            position: absolute !important;
            left: -24px !important;
            top: 50% !important;
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

        .tm_action_button:hover {
            background: #f8f9fa !important;
            transform: translateX(-2px) !important;
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
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
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

        .saml-role.tm_kb_selected {
            outline: 2px solid #0073bb !important;
            outline-offset: -2px !important;
            box-shadow: 0 2px 12px rgba(0,115,187,0.35) !important;
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
           so the colour comes from the user's Manage Environments config, not
           hardcoded CSS. */
        .saml-role[data-env-id]:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }

        .tm_role_info {
            flex: 1 !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 12px !important;
            line-height: 1.3 !important;
            min-width: 0 !important;
            overflow: hidden !important;
        }

        .tm_account_name {
            font-size: 14px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            flex: 1 !important;
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            max-width: 300px !important;
            position: relative !important;
            cursor: default !important;
        }

        .tm_account_id {
            font-size: 12px !important;
            color: #6c757d !important;
            font-weight: 400 !important;
            margin: 0 !important;
            font-family: monospace !important;
            background-color: #f8f9fa !important;
            padding: 2px 6px !important;
            border-radius: 3px !important;
            flex-shrink: 0 !important;
            min-width: 100px !important;
            text-align: center !important;
        }

        .tm_role_name {
            font-size: 14px !important;
            color: #0073bb !important;
            font-weight: 600 !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
            min-width: 110px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }

        body.tm_theme_dark .tm_account_id {
            background-color: #4a5568 !important;
            color: #cbd5e0 !important;
        }

        .saml-role span[style*="clear"] {
            display: none !important;
        }

        .tm_role_buttons {
            display: flex !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
            align-items: center !important;
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
            min-width: 140px !important;
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

        #tm_footer {
            text-align: center !important;
            color: #6c757d !important;
            font-size: 12px !important;
            padding: 4px 20px !important;
            background-color: #f8f9fa !important;
            margin-top: 0px !important;
            margin-bottom: 2px !important;
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

        body.tm_compact_mode .tm_filter_section h4 {
            display: none !important;
        }

        body.tm_compact_mode .tm_filter_section {
            margin-top: 0 !important;
        }

        body.tm_compact_mode .tm_button_group {
            margin-top: 0 !important;
        }

        /* Compact rows: keep row size & fonts identical to non-compact,
           only shrink the vertical gap between rows. */
        body.tm_compact_mode .saml-role {
            margin-bottom: 2px !important;
        }

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
  $(".saml-role").each(function (index) {
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
      const safeAccountName = escapeHtml(accountInfo.name);
      const safeAccountId   = escapeHtml(accountInfo.id);
      const safeRoleName    = escapeHtml(roleName);
      const safeRoleArn     = escapeHtml(roleArn);

      const roleInfoHTML = `
                <div class="tm_role_info">
                    <div class="tm_account_name">${safeAccountName}</div>
                    <div class="tm_account_id">${safeAccountId}</div>
                    <div class="tm_role_name">${safeRoleName}</div>
                </div>
                <div class="tm_role_buttons">
                    <button class="tm_favorite_button" data-role-arn="${safeRoleArn}" title="Add to favorites">☆</button>
                    <button class="tm_role_button" data-action="copy-account-id" data-account-id="${safeAccountId}">Copy Account ID</button>
                    ${ServicesManager.generateDropdownHTML(roleArn, accountInfo.id)}
                    <button class="tm_role_button primary tm_signin_button" data-role-arn="${safeRoleArn}" title="Sign in (hold ⌘/Ctrl or middle-click for a new tab)">Sign In</button>
                </div>
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
  $("body").on("click", ".tm_role_button[data-action='copy-account-id']", async function (e) {
    e.preventDefault();
    const $button = $(this);
    const accountId = $button.data("account-id");
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
    const newTab = !!(e.metaKey || e.ctrlKey || (e.type === "auxclick" && e.button === 1));
    const $button = $(this);
    const roleArn = $button.data("role-arn");
    const $role = $button.closest(".saml-role");
    const servicePath = $role.find(".tm_service_dropdown").val();
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
        // what the user typed in Manage Organizations.
        const entry = OrganizationsManager.findEntry(orgId);
        labelPayload.org = (entry && entry.label) ? entry.label : orgId;
      }
    }
    await RecentRolesManager.recordSignIn(roleArn);
    signInToRole(roleArn, buildDestination(servicePath, labelPayload), { newTab });
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

    console.log("Favorite button clicked:", roleArn, accountName, roleName);
    await FavoritesManager.toggleFavorite(roleArn, accountName, roleName);
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
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Manage Custom Shortcuts</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        Create shortcuts with a label and search string. Each line: <code>Label: "search text"</code>
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
          const match = line.match(/^(.+?):\s*["'](.+?)["']\s*$/);
          if (match) {
            shortcuts.push({
              label: match[1].trim(),
              search: match[2].trim(),
            });
          }
        }
      }

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
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Manage AWS Services</h3>
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

  const isDragInteractive = (el) => {
    if (!el) return false;
    if (el.closest && el.closest(".tm_role_buttons")) return true;
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
    };
  });

  const activateDrag = (e) => {
    const list = document.getElementById(RoleOrderManager.LIST_ID);
    if (!list) { dragState = null; return; }
    const visible = Array.from(list.children).filter((el) =>
      el.classList && el.classList.contains("saml-role") &&
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
    dragState.rowOffset = rect.height + (parseFloat(cs.marginBottom) || 0);

    try { dragState.row.setPointerCapture(dragState.pointerId); } catch (err) { /* ignore */ }
    dragState.row.classList.add("tm_dragging");
    // setProperty with "important" beats the base `.saml-role { transition: all
    // 0.2s ease !important }` rule, so the dragged row really has no
    // transition and tracks the cursor instantly.
    dragState.row.style.setProperty("transition", "none", "important");
    document.body.classList.add("tm_role_dragging_active");
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

    const { row, rows, list, draggedIndex, targetIndex, pointerId } = dragState;
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
      document.body.classList.remove("tm_role_dragging_active");
      try { row.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
      if (draggedIndex !== targetIndex) {
        await RoleOrderManager.saveCurrentOrder();
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

    // Esc — universal close/clear.
    if (e.key === "Escape") {
      if (modalOpen) {
        $openModal.remove();
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
      // Click Sign In on selected, or on the first visible if no selection.
      let $sel = $(".saml-role.tm_kb_selected").first();
      if ($sel.length === 0) {
        const rows = visibleRoles();
        if (rows.length === 0) return;
        $sel = $(rows[0]);
      }
      const $btn = $sel.find(".tm_signin_button");
      if ($btn.length) {
        e.preventDefault();
        // ⌘/Ctrl+Enter sends the modifier through so the sign-in opens in a
        // new tab, mirroring the mouse-click behaviour. jQuery's synthetic
        // click event accepts our own metaKey/ctrlKey on the original event.
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
            `The toolbar at the top lets you narrow the role list by organisation, environment, account type or role name, plus full-text search. Star a role to favorite it; the <em>Favorites</em> and <em>Recent</em> chips re-filter quickly.`)}
          ${sectionHTML("Reorder by drag",
            `Drag any role row to reposition it; the order persists across sessions. <strong>Reorder is disabled while any filter or search is active</strong> — otherwise you'd only be sorting visible rows, which gives surprising results. Clear filters first. <em>Reset Order</em> in the side menu restores AWS's default order.`)}
          ${sectionHTML("Deep-link into a service",
            `Each role row has a service dropdown (EC2 / S3 / IAM / …). Picking a service before <strong>Sign In</strong> drops you straight into that service's console for that role. Manage the list via <em>Manage Services</em>.`)}
          ${sectionHTML("Coloured console tabs",
            `Each open AWS console tab gets a coloured favicon (env color) and a tab-title prefix with the account name, so 10 open tabs are still distinguishable at a glance.`)}
          ${sectionHTML("Tab groups (visual containers)",
            `Chrome tab groups cluster console tabs by role, by organisation, or by a ticket tag — emulates Firefox containers visually. Configure via the <em>Tab Groups</em> button (default modes) and the toolbar tag input (per-session overrides).`)}
          ${sectionHTML("Make it yours",
            `Open the side menu (hover the right edge) to manage <em>Organizations</em>, <em>Environments</em>, <em>Account Types</em>, <em>Role Names</em>, <em>Services</em>, and <em>General Settings</em> (AWS region, sensitive-sign-in triggers, footer URL). Defaults ship as generic placeholders — rename them to match your org.`)}
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
            <tr><td style="padding: 6px 0 !important;"><kbd>/</kbd> or <kbd>${cmd}</kbd>+<kbd>K</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Focus the search box</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>↑</kbd> / <kbd>↓</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Move selection through visible roles</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>Enter</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Sign in to the selected role</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>${cmd}</kbd>+<kbd>Enter</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Sign in in a new tab (also: ${cmd}-click / middle-click)</td></tr>
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
            <strong>Override:</strong> the <em>Tab group tag</em> field on the
            toolbar (next to the Account Types row) overrides this setting
            when it has a value — useful for grouping tabs by ticket id or
            workstream regardless of account.
          </p>
          ${optionHTML("role", "By role", "Each unique account + role becomes its own coloured group, e.g. <code>my-account · PowerUser</code>. Same role always gets the same colour.")}
          ${optionHTML("org", "By org", "Accounts cluster by organization, based on your <em>Manage Organizations</em> patterns. Accounts that don't match any org are not grouped.")}
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
      close();
      showToast(
        `Tab grouping: ${CONFIG.TAB_GROUP_MODE_LABELS[chosen]}`,
        "success",
        CONFIG.TOAST_DURATION
      );
    });
  };

  // --- Tab group tag input ---
  // Persisted in chrome.storage so it survives page reloads. Empty value
  // means "use default grouping (account/role)"; non-empty value overrides.
  $("body").on("input", "#tm_group_tag_input", debounce(async function () {
    const val = $(this).val().trim();
    tabGroupTagCache = val;
    await StorageManager.saveTabGroupTag(val);
  }, 300));

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
    CONFIG.STORAGE_KEYS.ENV_PATTERNS,
    CONFIG.STORAGE_KEYS.ORG_PATTERNS,
    CONFIG.STORAGE_KEYS.TYPE_PATTERNS,
    CONFIG.STORAGE_KEYS.ROLE_PATTERNS,
    CONFIG.STORAGE_KEYS.RECENT_ROLES,
    CONFIG.STORAGE_KEYS.ROLE_ORDER,
    CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS,
    CONFIG.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS,
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
      const isRecentRoleList = (v) =>
        Array.isArray(v) && v.every((r) =>
          r && typeof r === "object" && typeof r.roleArn === "string"
        );
      const isPlainStringMap = (v) =>
        v && typeof v === "object" && !Array.isArray(v) &&
        Object.values(v).every((x) => typeof x === "string");

      const SK = CONFIG.STORAGE_KEYS;
      const validators = {
        [SK.THEME]:        (v) => typeof v === "string" && ["light", "dark", "auto"].includes(v),
        [SK.FAVORITES]:    isStringList,
        [SK.SHORTCUTS]:    (v) => Array.isArray(v) && v.every((s) =>
                              s && typeof s === "object" &&
                              typeof s.label === "string" && s.label.length <= 64 &&
                              typeof s.search === "string" && s.search.length <= 256),
        [SK.COMPACT_MODE]: (v) => typeof v === "boolean",
        [SK.SERVICES]:     isServiceList,
        [SK.LAST_SERVICE]: isPlainStringMap,
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
      title: "Manage Environments",
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
      title: "Manage Organizations",
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
      title: "Manage Account Types",
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
      ? `<div style="color:#6c757d !important; font-size: 13px !important; padding: 6px 0 !important;">No account types configured yet. Add them via <em>Manage Account Types</em>.</div>`
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
            <input type="text" id="tm_gs_region" value="${sanitizeInput(awsRegionCache)}" placeholder="us-east-1" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-family: monospace !important; font-size: 13px !important; box-sizing: border-box !important;
            " />
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 4px !important;">
              Used in the destination URL of every sign-in and as the <code>{region}</code> placeholder in service paths.
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
      title: "Manage Role Names",
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
    const group = $button.data("group");
    const filter = $button.data("filter");

    console.log(`Filter clicked: ${group}:${filter}`);

    $button.toggleClass("active");

    if ($button.hasClass("active")) {
      if (!activeFilters[group].includes(filter)) {
        activeFilters[group].push(filter);
      }
    } else {
      activeFilters[group] = activeFilters[group].filter((f) => f !== filter);
    }

    console.log("Updated filters:", activeFilters);

    FilterManager.applyFilters();
  });

  // --- Handle search ---
  // The search term is used only for `.includes()` against role text — never
  // injected back into HTML, so it stays as the user's raw input. Escaping
  // would break searches for & or other meta-characters.
  getCachedElement(CONFIG.SELECTORS.SEARCH_INPUT).on("input", function () {
    searchTerm = ($(this).val() || "").trim();
    if (searchTerm.length >= 2 || searchTerm.length === 0) {
      FilterManager.applyFilters();
    }
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addListener((e) => {
      if (currentTheme === "auto") {
        console.log("System theme changed:", e.matches ? "dark" : "light");
        ThemeManager.applyTheme("auto");
      }
    });
  }

  // Initial setup

  // Start modal-theming observer before any modal can be created so the
  // welcome modal (and everything after) picks up the current theme.
  // subtree: true so re-renders inside a modal (e.g. "Add entry" in Manage
  // modals) get themed too, not just the initial modal append.
  modalObserver.observe(document.body, { childList: true, subtree: true });

  // Initialize theme
  try {
    currentTheme = await StorageManager.getTheme();
    console.log("Loaded theme:", currentTheme);
    await ThemeManager.applyTheme(currentTheme);
  } catch (e) {
    console.error("Error loading theme:", e);
    currentTheme = "light";
    await ThemeManager.applyTheme(currentTheme);
  }

  // Load favorites cache and initialize UI
  console.log("Initializing favorites...");
  try {
    await FavoritesManager.loadCache();
    console.log("Favorites cache initialized:", favoritesCache);
    await FavoritesManager.updateButtons();
    console.log("Favorite buttons updated successfully");
  } catch (e) {
    console.error("Error during favorites initialization:", e);
  }

  // Load custom shortcuts cache and update UI
  console.log("Initializing custom shortcuts...");
  try {
    await ShortcutsManager.loadCache();
    console.log("Custom shortcuts cache initialized:", customShortcutsCache);
    ShortcutsManager.updateSection();
    console.log("Shortcuts section updated successfully");
  } catch (e) {
    console.error("Error during custom shortcuts initialization:", e);
  }

  // Initialize compact mode
  console.log("Initializing compact mode...");
  try {
    await CompactManager.loadSetting();
    console.log("Loaded compact mode:", compactMode);
    CompactManager.apply();
    CompactManager.updateButton();
    console.log("Compact mode applied successfully");
  } catch (e) {
    console.error("Error during compact mode initialization:", e);
  }

  // Sync the "Recent: N" floating-menu label with the stored limit.
  $("#tm_recent_limit").text(`Recent: ${RecentRolesManager.getLimit()}`);

  // Hydrate the tab-group tag input from storage.
  try {
    tabGroupTagCache = await StorageManager.getTabGroupTag();
    if (tabGroupTagCache) $("#tm_group_tag_input").val(tabGroupTagCache);
  } catch (e) {
    console.error("Error loading tab group tag:", e);
  }

  // Hydrate the tab-group mode cycler.
  try {
    tabGroupModeCache = await StorageManager.getTabGroupMode();
    updateTabGroupModeButton();
  } catch (e) {
    console.error("Error loading tab group mode:", e);
  }

  // Apply initial environment-based styling
  applyEnvironmentStyling();

  showToast("Console Hopper loaded successfully!", "success", 3000);
  console.log(`Added buttons to ${$(".tm_role_buttons").length} roles`);

  // First-run welcome — only on the very first load after install.
  try {
    const seen = await StorageManager.getWelcomeSeen();
    if (!seen) showAboutModal({ firstRun: true });
  } catch (e) {
    console.warn("Welcome-modal first-run check failed:", e);
  }
})();
