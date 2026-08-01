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

  // AWS region code shape — lenient (covers every partition) but injection-safe:
  // only [a-z0-9-], so a value can't break out of a host segment or a query
  // value. Mirrors isValidRegionCode in src/content/util.js; kept inline because
  // this is a standalone classic script with no imports. Any region we drop into
  // the switch-role URL or the destination host is validated against it first.
  const REGION_CODE_RE = /^[a-z0-9-]+$/;

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
      // UTF-8-safe base64 decode, mirroring the picker's TextEncoder+btoa
      // encode so labels with emoji / non-Latin1 characters round-trip.
      const bin = atob(raw);
      const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
      const decoded = JSON.parse(new TextDecoder().decode(bytes));
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

  function loadLabel(fromFragment) {
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

  // A jump asked to land in a specific region, but AWS drops a freshly switched
  // role into that identity's own default region. If we didn't land in the
  // requested one, this returns the same URL with the host's region segment
  // rewritten, so the caller can reload the console in the right region; null
  // when no rewrite is needed (already there, no target, or not a regional
  // multi-session host). The once-only guard lives in the pending entry rather
  // than sessionStorage: the region is part of the destination hostname, so
  // changing it changes origin and would wipe any per-tab sessionStorage flag —
  // exactly when a region AWS refuses bounces us back and we'd loop.
  function regionPinUrl(region) {
    try {
      const target = String(region || "");
      if (!target || !REGION_CODE_RE.test(target)) return null;
      // Regional multi-session host: [account-alias, region, "console", …].
      // Anything else (e.g. a global "…-alias.console.aws.amazon.com" host with
      // no region segment) is left untouched.
      const parts = window.location.hostname.split(".");
      if (parts.length < 6 || parts[2] !== "console") return null;
      if (!REGION_CODE_RE.test(parts[1]) || parts[1] === target) return null;
      parts[1] = target;
      // Keep the rest of the URL byte-for-byte (AWS console URLs carry opaque
      // encoded params); only swap a region= query value if one is present.
      const search = window.location.search.replace(/([?&]region=)[^&]*/i, "$1" + target);
      return (
        window.location.protocol + "//" + parts.join(".") +
        window.location.pathname + search + window.location.hash
      );
    } catch (e) {
      return null;
    }
  }

  // A #hop payload arrives in the URL fragment, which anyone can craft — so a
  // link from any site could otherwise paint a real production console as
  // "DEV/green", relabel its tab, or send you into a pre-filled switch-role.
  // Every payload the picker emits carries a single-use token recorded in
  // extension storage; the fragment is trusted only if that token checks out.
  // The callback always fires, with `false` when it doesn't.
  function verifyToken(fragment, done) {
    const tok = fragment && typeof fragment.tok === "string" ? fragment.tok : "";
    if (!/^[a-f0-9]{32}$/.test(tok)) {
      done(false);
      return;
    }
    try {
      chrome.storage.local.get("hop_signin_tokens", (res) => {
        const all = (res && res.hop_signin_tokens) || {};
        const issued = all[tok];
        // Deliberately NOT single-use. A sign-in lands on the plain regional
        // host and is then redirected to the session-prefixed one, replaying the
        // same payload on a different origin — so consuming the token on first
        // sight would leave the tab that actually survives undecorated. The
        // token proves *we* minted the payload; an attacker cannot guess it, and
        // the short TTL (pruned when the next one is minted) bounds replay.
        done(issued != null && Date.now() - issued <= 5 * 60 * 1000);
      });
    } catch (e) {
      done(false);
    }
  }

  const rawFragment = readFragmentPayload();


  // Decorate from a verified fragment, else from whatever this tab already
  // trusts (sessionStorage), else from a pending jump hand-off.
  function applyLabel(trustedFragment) {
    const label = loadLabel(trustedFragment);
    if (label) {
      decorate(label);
      requestTabGrouping(label);
      return;
    }
    if (!(chrome && chrome.storage && chrome.storage.local)) return;
    // No sign-in label on this tab — but if we just chained into this account
    // via a Jump, the picker stashed a pending decoration keyed by the account
    // id (multi-session subdomains expose it as the leading host segment). Pick
    // it up, decorate the tab with the session label + env colour, and clear it.
    const m = window.location.hostname.match(/^(\d{12})-/);
    if (!m) return;
    const acct = m[1];
    chrome.storage.local.get("hop_pending_jumps", (res) => {
      const pending = (res && res.hop_pending_jumps) || {};
      const hit = pending[acct];
      if (!hit) return;
      // Expired (or clock-less) entry: consume and bail without decorating.
      if (!hit.ts || Date.now() - hit.ts > 5 * 60 * 1000) {
        delete pending[acct];
        chrome.storage.local.set({ hop_pending_jumps: pending });
        return;
      }
      // Pin the region first — but only once. The attempt is recorded in the
      // entry (which lives in chrome.storage.local, so it survives the
      // cross-origin region redirect) and the entry is left in place, so the
      // post-redirect load still consumes it and decorates. If AWS refuses the
      // region and bounces us back, regionPinTried is already set → we stop and
      // decorate in whatever region we ended up in, rather than looping.
      if (!hit.regionPinTried) {
        const url = regionPinUrl(hit.region);
        if (url) {
          hit.regionPinTried = true;
          chrome.storage.local.set({ hop_pending_jumps: pending }, () => {
            window.location.assign(url);
          });
          return;
        }
      }
      delete pending[acct];
      chrome.storage.local.set({ hop_pending_jumps: pending });
      const jumpLabel = {
        account: hit.label || acct,
        envColor: hit.envColor,
        envLetter: hit.envLetter,
      };
      // The destination console loads more than once (AWS redirects after the
      // switch-role settles). The entry is single-use, so without this the
      // second load would land undecorated and wipe the title prefix applied by
      // the first. Persist it per-origin — loadLabel() picks it up from here on
      // every later load in this tab.
      try {
        sessionStorage.setItem(SS_KEY, JSON.stringify(jumpLabel));
      } catch (e) { /* private mode or storage full; decoration is best-effort */ }
      decorate(jumpLabel);
    });
  }

  // Chain-jump: a verified sign-in landing that carries a chain target hops
  // straight to AWS's Switch Role for the destination account. Read from the
  // fragment (not sessionStorage) so it fires ONLY on the fresh hub landing and
  // never re-fires on the switched-into console.
  if (rawFragment && rawFragment.chain && rawFragment.chain.account && rawFragment.chain.role) {
    verifyToken(rawFragment, (trusted) => {
      if (!trusted) return;
      const c = rawFragment.chain;
      // Re-validate even when trusted, mirroring the picker-side contract
      // (12-digit account, bounded role/displayName).
      if (!/^\d{12}$/.test(String(c.account))) return;
      const role = String(c.role).slice(0, 128);
      const display = c.displayName ? String(c.displayName).slice(0, 120) : "";
      // A region on the chain asks AWS to land the switched role there. AWS
      // doesn't document this param, so it's best-effort — the pending-jump
      // branch pins the region for certain if AWS ignores it.
      const region = REGION_CODE_RE.test(String(c.region || "")) ? String(c.region) : "";
      window.location.assign(
        "https://signin.aws.amazon.com/switchrole?account=" +
          encodeURIComponent(c.account) +
          "&roleName=" + encodeURIComponent(role) +
          (display ? "&displayName=" + encodeURIComponent(display) : "") +
          (region ? "&region=" + encodeURIComponent(region) : "")
      );
    });
  } else {
    verifyToken(rawFragment, (trusted) => applyLabel(trusted ? rawFragment : null));
  }
})();
