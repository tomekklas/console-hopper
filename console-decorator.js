// Console Hopper — Console tab decorator
// Runs on *.console.aws.amazon.com; reads the env/color/letter payload passed
// via URL fragment from the SAML role-picker's Sign In flow, persists it in
// sessionStorage for the lifetime of the tab, and decorates the tab strip
// (env-colored favicon + tab title prefix) so the user can distinguish
// many open AWS console tabs at a glance.

(function () {
  "use strict";

  const SS_KEY = "hop_tab_label";
  const FRAGMENT_KEY = "hop";

  // Fallback when the payload doesn't carry color/letter (older payloads or
  // unmatched envs): grey favicon with "?" glyph.
  const FALLBACK_COLOR = "#6c757d";
  const FALLBACK_LETTER = "?";

  // Read the fragment payload on a fresh sign-in landing; then strip it so the
  // URL stays clean (and won't expose the encoded label on copy/share).
  function readFragmentPayload() {
    if (!window.location.hash) return null;
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const raw = params.get(FRAGMENT_KEY);
    if (!raw) return null;
    try {
      const decoded = JSON.parse(atob(raw));
      params.delete(FRAGMENT_KEY);
      const remaining = params.toString();
      const newHash = remaining ? "#" + remaining : "";
      history.replaceState(null, "", window.location.pathname + window.location.search + newHash);
      return decoded;
    } catch (e) {
      console.warn("[hop] failed to parse fragment payload", e);
      return null;
    }
  }

  function loadLabel() {
    const fromFragment = readFragmentPayload();
    if (fromFragment && fromFragment.account && fromFragment.role) {
      sessionStorage.setItem(SS_KEY, JSON.stringify(fromFragment));
      return fromFragment;
    }
    try {
      const stored = sessionStorage.getItem(SS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // Build a 32x32 favicon: solid env color background + white env-letter glyph.
  function makeColoredFavicon(color, letter) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    // Rounded square background for a softer look in the tab strip.
    const r = 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(32 - r, 0);
    ctx.quadraticCurveTo(32, 0, 32, r);
    ctx.lineTo(32, 32 - r);
    ctx.quadraticCurveTo(32, 32, 32 - r, 32);
    ctx.lineTo(r, 32);
    ctx.quadraticCurveTo(0, 32, 0, 32 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    if (letter) {
      // Pick dark or light glyph based on the background's luminance so the
      // letter stays readable regardless of which env colour the user picked.
      ctx.fillStyle = isLightColor(color) ? "#1a1a1a" : "#ffffff";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // textBaseline middle is slightly off-center in many fonts; nudge down 1px.
      ctx.fillText(letter, 16, 17);
    }
    return canvas.toDataURL("image/png");
  }

  // Relative luminance per WCAG, normalised to [0, 1]. Above ~0.55 the
  // background is "light enough" that dark glyph contrasts better.
  function isLightColor(hex) {
    const m = (hex || "").trim().match(/^#?([0-9a-f]{6})$/i);
    if (!m) return false;
    const num = parseInt(m[1], 16);
    const r = ((num >> 16) & 0xff) / 255;
    const g = ((num >> 8) & 0xff) / 255;
    const b = (num & 0xff) / 255;
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.55;
  }

  // Replace all existing favicons with our data-URL one. AWS Console adds its
  // own favicon links; we strip and re-add ours, then watch for re-adds.
  function applyFavicon(dataUrl) {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;
    head.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = dataUrl;
    link.setAttribute("data-hop", "1");
    head.appendChild(link);
  }

  function decorate(label) {
    // The plugin's content script ships the env color + letter as part of the
    // payload, so this script doesn't need to know which env ids exist.
    const color = (label.envColor && /^#[0-9a-fA-F]{3,8}$/.test(label.envColor))
      ? label.envColor
      : FALLBACK_COLOR;
    const letter = (label.envLetter && label.envLetter.length > 0)
      ? label.envLetter.charAt(0).toUpperCase()
      : FALLBACK_LETTER;
    const dataUrl = makeColoredFavicon(color, letter);

    const ensureFavicon = () => {
      const ours = document.head && document.head.querySelector('link[data-hop="1"]');
      if (!ours) applyFavicon(dataUrl);
    };

    // Drop our favicon as soon as <head> exists; then re-assert on any change.
    const startFaviconObserver = () => {
      ensureFavicon();
      new MutationObserver(ensureFavicon).observe(document.head, {
        childList: true,
        subtree: false,
      });
    };

    if (document.head) {
      startFaviconObserver();
    } else {
      const headWaiter = new MutationObserver(() => {
        if (document.head) {
          headWaiter.disconnect();
          startFaviconObserver();
        }
      });
      headWaiter.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Title prefix; re-apply if AWS rewrites <title>.
    const prefix = `[${label.account}] `;
    const ensureTitle = () => {
      if (!document.title.startsWith(prefix)) {
        document.title = prefix + document.title;
      }
    };
    ensureTitle();
    const wireTitleObserver = () => {
      const titleEl = document.querySelector("title");
      if (titleEl) {
        new MutationObserver(ensureTitle).observe(titleEl, { childList: true });
      }
    };
    if (document.querySelector("title")) {
      wireTitleObserver();
    } else {
      const titleWaiter = new MutationObserver(() => {
        if (document.querySelector("title")) {
          titleWaiter.disconnect();
          wireTitleObserver();
        }
      });
      titleWaiter.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  // Once per tab, ask the service worker to put this tab into a colored
  // group. If label.tag is present, that's used as the group title (override
  // mode — e.g. ticket id); otherwise the group is named "<account> · <role>".
  // Subsequent in-tab navigations don't re-send (we don't want to fight a
  // user who manually pulls the tab out of its group).
  function requestTabGrouping(label) {
    try {
      if (sessionStorage.getItem("hop_tab_grouped") === "1") return;
      sessionStorage.setItem("hop_tab_grouped", "1");
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "hop_group_tab",
          account: label.account,
          role: label.role,
          tag: label.tag || "",
          mode: label.groupMode || "role",
          org: label.org || "",
        });
      }
    } catch (err) { /* extension context may be unavailable; ignore */ }
  }

  const label = loadLabel();
  if (label) {
    decorate(label);
    requestTabGrouping(label);
  }
})();
