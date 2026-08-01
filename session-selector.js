// Console Hopper — pick the right AWS session during a jump
//
// With more than one console session live, AWS interrupts a jump twice over:
//   * /sessions/selector — "Choose your AWS session", one card per session
//   * /switchrole        — the Switch Role form carries a session radio group
//
// The second one is the dangerous case: AWS pre-selects a session for you, and
// it does NOT pick the newest — verified live picking an older ReadOnly session
// over the hub session the jump had just created, which fails with "The
// selected session doesn't have permission to switch to that role".
//
// Console Hopper already knows which identity the jump signs in as (the assume
// profile's hub), so it selects that one and submits the pre-filled form, which
// makes a jump one click end to end.
//
// Deliberately narrow. It acts only while a jump is in flight (a fresh pending
// hint), only when the session match is unambiguous, and it only submits when
// the destination account on the page is one we have a pending jump for — so
// it can never auto-submit a Switch Role page the user opened themselves.

(function () {
  "use strict";

  const HINT_KEY = "hop_pending_hub";
  // Same 5-minute window as the pending-jump decoration, so an abandoned jump
  // can't silently steer a session choice ten minutes later.
  const HINT_TTL_MS = 5 * 60 * 1000;
  // Both pages are SPAs — the controls arrive after first paint. This is how
  // long to keep waiting for the session radio group before concluding this
  // page genuinely has none (a single-session switch-role). The Switch Role
  // button renders BEFORE the radios, so its presence alone is not a settled
  // page — acting on it treats "not rendered yet" as "nothing to choose".
  const SETTLE_MS = 2500;

  function clearHint() {
    try {
      chrome.storage.local.remove(HINT_KEY);
    } catch (e) { /* extension context gone; nothing to do */ }
  }

  // Poll for the controls until they exist or we give up, then stop watching so
  // we're not left observing a page the user is now reading themselves.
  // Calls attempt() as the page renders. attempt() returns true when it has
  // decided and wants no more calls. If it never decides, it gets one last call
  // with final=true so a page that simply has nothing to disambiguate still
  // gets acted on rather than being waited on forever.
  function whenReady(attempt) {
    let done = false;
    const finish = (final) => {
      if (done) return true;
      if (attempt(final)) {
        done = true;
        return true;
      }
      return false;
    };
    if (finish(false)) return;
    const observer = new MutationObserver(() => {
      if (finish(false)) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      finish(true);
    }, SETTLE_MS);
  }

  // --- /sessions/selector: one card per session, keyed by differentiator ---
  function runSelector(hint) {
    whenReady((final) => {
      void final;
      const cards = Array.from(
        document.querySelectorAll('[data-testid^="card-' + hint.account + '-"]')
      );
      if (!cards.length) return false;
      const matches = hint.role
        ? cards.filter((c) => (c.innerText || "").includes(hint.role))
        : cards;
      if (matches.length !== 1) return false;
      const link = matches[0].querySelector("a[href]");
      if (!link) return false;
      const href = link.getAttribute("href") || "";
      if (!/^https:\/\/[a-z0-9.-]*signin\.aws\.amazon\.com\//i.test(href)) return false;
      clearHint();
      window.location.assign(href);
      return true;
    });
  }

  // --- /switchrole: a radio per session, value = differentiator ---
  // The radio carries no role, so when several sessions share the hub account
  // we ask the service worker to map differentiator -> role. If that lookup
  // fails we fall back to a unique account-prefix match, and otherwise leave
  // AWS's choice alone rather than guess.
  function selectRadio(radios, wanted) {
    const target = radios.find((r) => r.value === wanted);
    if (!target || target.checked) return !!target;
    // Click the label: these are Cloudscape controls, and setting .checked
    // directly doesn't update the component's own state.
    const clickable = target.closest("label") || target.parentElement || target;
    clickable.click();
    return true;
  }

  // Submit the pre-filled Switch Role form — but ONLY for a switch this
  // extension set up moments ago. The destination account on the page must be
  // one we have a pending jump for, which ties the click to a jump the user
  // started themselves rather than any switch-role page they happen to open.
  function maybeSubmit() {
    let acct = "";
    const field = document.querySelector('input[name="accountId"], #accountId');
    if (field) acct = String(field.value || "").trim();
    if (!/^\d{12}$/.test(acct)) return;
    try {
      chrome.storage.local.get("hop_pending_jumps", (res) => {
        const pending = (res && res.hop_pending_jumps) || {};
        if (!pending[acct]) return; // not our jump — leave the click to the user
        const btn = Array.from(document.querySelectorAll("button")).find(
          (b) => (b.innerText || "").trim() === "Switch Role"
        );
        if (btn) btn.click();
      });
    } catch (e) { /* extension context gone; leave the form alone */ }
  }

  function runSwitchRole(hint) {
    whenReady((final) => {
      const submit = Array.from(document.querySelectorAll("button")).find(
        (b) => (b.innerText || "").trim() === "Switch Role"
      );
      if (!submit) return false;

      const radios = Array.from(document.querySelectorAll('input[type="radio"]')).filter((r) =>
        /^\d{12}-/.test(r.value || "")
      );
      const mine = radios.filter((r) => r.value.indexOf(hint.account + "-") === 0);

      // The radio group renders after the button, and AWS pre-checks one of
      // them — so "no radios" or "none checked" means still rendering, not
      // "nothing to choose". Keep waiting until the settle timeout says stop.
      if (!final && (!radios.length || !radios.some((r) => r.checked))) return false;

      // Nothing to disambiguate: no session picker, or only one candidate.
      if (radios.length < 2 || mine.length === 1) {
        if (mine.length === 1) selectRadio(radios, mine[0].value);
        clearHint();
        // Let the Cloudscape radio commit its state before submitting.
        setTimeout(maybeSubmit, 120);
        return true;
      }
      if (!mine.length) return true; // hub isn't among the sessions; hands off

      // Several sessions share the hub account — the role decides which.
      try {
        chrome.runtime.sendMessage({ type: "hop_list_sessions" }, (res) => {
          if (chrome.runtime.lastError || !res || !res.ok) return;
          const hit = (res.sessions || []).filter(
            (s) => s.account === hint.account && s.role === hint.role
          );
          if (hit.length !== 1) return; // ambiguous — leave AWS's choice
          selectRadio(radios, hit[0].differentiator);
          clearHint();
          setTimeout(maybeSubmit, 120);
        });
      } catch (e) { /* worker unavailable; leave AWS's choice */ }
      return true;
    });
  }


  try {
    chrome.storage.local.get(HINT_KEY, (res) => {
      const hint = res && res[HINT_KEY];
      if (!hint || !/^\d{12}$/.test(String(hint.account || ""))) return;
      if (!hint.ts || Date.now() - hint.ts > HINT_TTL_MS) {
        clearHint();
        return;
      }
      const target = {
        account: String(hint.account),
        role: String(hint.role || "").slice(0, 128),
      };
      if (window.location.pathname.indexOf("/switchrole") === 0) runSwitchRole(target);
      else runSelector(target);
    });
  } catch (e) {
    /* no extension context — leave the page alone */
  }
})();
