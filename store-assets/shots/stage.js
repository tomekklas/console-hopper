/* global SCENE */
(function () {
  // Display-only staging for a store screenshot. Rewrites VISIBLE TEXT to safe
  // demo values and leaves every data-* attribute holding the real value, so
  // the mapping stays stable and this whole script is re-runnable. A page
  // reload restores the real data.
  //
  // SCENE is set by shoot.sh (prepended as `var SCENE = "...";`):
  //   main      light theme, filter rows with +N, the Sets column
  //   sets      the Launch Sets panel
  //   edit      Edit set dialog for the first set
  //   sessions  the Active AWS sessions panel (needs live sessions)
  //   dark      dark theme with the Tags row's +N pop-out open
  //   room      the Open-set dialog when a set won't fit ("room:N" opens the
  //             Nth set in the column, default 0) — needs live sessions and a
  //             set that needs more of them than are free
  var scene = typeof SCENE === "string" ? SCENE : "main";
  var roomSet = 0;
  if (/^room(:\d+)?$/.test(scene)) {
    roomSet = Number((scene.split(":")[1]) || 0);
    scene = "room";
  }

  var IDS = ["111122223333", "444455556666", "777788889999", "123456789012",
             "222233334444", "555566667777", "888899990000", "333344445555",
             "666677778888", "999900001111", "121234345656", "343456567878"];
  var NAMES = ["acme-prod-audit", "acme-prod-backup", "globex-prod-web",
               "initech-test-core", "acme-dev-tools", "globex-test-data",
               "initech-prod-net", "acme-sec-logging", "globex-dev-apps",
               "initech-sandbox", "acme-test-api", "globex-sec-audit"];
  var ROLES = { CHBilling: "Finance", CHReadOnly: "ReadOnly",
                CHPowerUser: "PowerUser", CHOrgAdmin: "OrgAdmin",
                CHAdmin: "Admin", CHNetwork: "NetworkAdmin" };
  var TAGS = ["OPS-1234", "prod-network", "pci", "security-core", "sandbox",
              "OPS-1198", "INC-0419", "platform", "OPS-1350", "CHG-2231"];
  var SETS = ["OPS-1234", "INC-0419", "OPS-1198", "CHG-2210", "OPS-1301",
              "INC-0442", "CHG-2231", "OPS-1350"];
  var SHORTCUTS = ["Prod network", "PCI accounts", "Sandboxes"];
  var LABELS = ["audit-review", "INC-0419 triage", "billing-check", "net-debug"];
  var VIA = "via Acme hub · max 1 h";
  var ROLE_POOL = Object.keys(ROLES).map(function (k) { return ROLES[k]; })
    .concat(["Jump", "Hub"]);

  // ---- open the scene's UI first, so everything it shows gets rewritten ----
  // The Open-set dialog is answered, not removed: removing it would leave the
  // picker waiting on it, and no other set would open until a reload. The
  // room scene keeps it (the second pass rewrites what the first opened).
  document.querySelectorAll('[id$="_modal"]').forEach(function (el) {
    if (el.id === "tm_set_open_modal") {
      if (scene !== "room") {
        var cancel = el.querySelector('[data-action="cancel"]');
        if (cancel) cancel.click(); else el.remove();
      }
      return;
    }
    el.remove();
  });
  document.querySelectorAll("#tm_toasts, .tm_toast").forEach(function (el) { el.remove(); });
  var pop = document.getElementById("tm_sessions_popover");
  if (scene === "dark") document.body.classList.add("tm_theme_dark");
  else document.body.classList.remove("tm_theme_dark");

  // ---- Open / Sign In ----
  // The extension decides a row's "Open" from the row's VISIBLE account id
  // and role, so once those are rewritten its next refresh (bringing the
  // window forward, a console tab changing) would flip every Open back to
  // Sign In. Record each button's label the first time it is seen with real
  // text, and pin it on every pass.
  document.querySelectorAll("#tm_role_list .tm_signin_button").forEach(function (b) {
    if (!b.dataset.stageLabel) b.dataset.stageLabel = b.textContent;
    if (b.textContent !== b.dataset.stageLabel) b.textContent = b.dataset.stageLabel;
  });

  // ---- account ids / names / roles ----
  var idMap = {}, nameMap = {}, n = 0;
  document.querySelectorAll("[data-account-id]").forEach(function (el) {
    var a = el.getAttribute("data-account-id");
    if (a && !(a in idMap)) {
      idMap[a] = IDS[n % IDS.length];
      nameMap[a] = NAMES[n % NAMES.length];
      n++;
    }
  });
  var realIds = Object.keys(idMap);
  function acct(el) {
    var a = el.getAttribute("data-account-id");
    return a && idMap[a] ? a : null;
  }
  document.querySelectorAll(".tm_account_id").forEach(function (el) {
    var a = acct(el);
    if (a) el.textContent = idMap[a];
  });
  // A name that isn't the bare id (an AWS alias, an Account Names entry, a
  // jump destination's name) also shows in the Open-set dialog and the
  // sessions panel; remember each one so the text pass below swaps it too.
  var nameSwap = {};
  document.querySelectorAll(".tm_account_name").forEach(function (el) {
    var a = acct(el);
    if (!a) return;
    if (!el.dataset.realName) el.dataset.realName = el.textContent.replace(/^\s*⤳\s*/, "").replace(/\s+/g, " ").trim();
    [el.dataset.realName, el.getAttribute("data-aws-name") || ""].forEach(function (real) {
      if (real && real.length >= 3 && !/^\d{12}$/.test(real)) nameSwap[real] = nameMap[a];
    });
    el.textContent = nameMap[a];
  });
  var swapKeys = Object.keys(nameSwap).sort(function (x, y) { return y.length - x.length; });
  function mapRole(t) {
    t = (t || "").trim();
    if (ROLES[t]) return ROLES[t];
    return t.replace(/^CH/, "") || t;
  }
  document.querySelectorAll(".saml-role-description, .tm_role_name").forEach(function (el) {
    if (el.children.length === 0) el.textContent = mapRole(el.textContent);
  });
  document.querySelectorAll("*").forEach(function (el) {
    if (el.children.length !== 0) return;
    if (/^\s*via\s+.+hub/.test(el.textContent)) el.textContent = VIA;
  });

  // ---- filter chips: tags, shortcuts ----
  // A few display-only demo chips so the row overflows into "+N" the way a
  // ticket-heavy tag list does. Clones; nothing is saved.
  var tagGroup = document.querySelector('.tm_button_group[data-filter-group="tag"]');
  if (tagGroup && !tagGroup.querySelector("[data-demo-chip]")) {
    var model = tagGroup.querySelector(".tm_filter_button");
    for (var d = 0; model && d < 4; d++) {
      var c = model.cloneNode(true);
      c.setAttribute("data-demo-chip", "1");
      c.setAttribute("data-filter", "demo-" + d);
      c.classList.remove("active", "tm_chip_overflow");
      var more0 = tagGroup.querySelector(".tm_more_chip");
      tagGroup.insertBefore(c, more0 || null);
    }
  }
  var f = 0;
  document.querySelectorAll('.tm_filter_button[data-group="tag"]').forEach(function (el) {
    el.textContent = TAGS[f++ % TAGS.length];
  });
  var s = 0;
  document.querySelectorAll(".tm_custom_shortcut").forEach(function (el) {
    var node = el.firstChild;
    if (node && node.nodeType === 3) node.nodeValue = SHORTCUTS[s++ % SHORTCUTS.length];
  });

  // ---- Launch Sets column ----
  // Keyed by set id (stable across passes); the real name is kept on the
  // element the first time so a second pass maps the same way.
  var setMap = {}, setById = {}, k = 0;
  document.querySelectorAll(".tm_set_line").forEach(function (line) {
    var chip = line.querySelector("[data-set-id]");
    var nameEl = line.querySelector(".tm_set_name");
    if (!chip || !nameEl) return;
    if (!nameEl.dataset.realName) nameEl.dataset.realName = nameEl.textContent;
    var id = chip.getAttribute("data-set-id");
    var demo = SETS[k++ % SETS.length];
    setById[id] = demo;
    setMap[nameEl.dataset.realName] = demo;
    nameEl.textContent = demo;
  });
  function mapSet(name) { return setMap[name] || name; }

  // Row tag chips stay as they are (icon + count, no tag text).
  // Refold the rows now that chip labels changed width: a resize makes the
  // extension re-measure. Then open whatever the scene needs.
  window.dispatchEvent(new Event("resize"));

  if (scene === "sets" || scene === "edit") {
    var mgr = document.getElementById("tm_manage_launch_sets");
    if (mgr) mgr.click();
    if (scene === "edit") {
      // The set with the most tabs shows the dialog best.
      var best = null, bestN = -1;
      document.querySelectorAll("#tm_sets_manage_modal .tm_setm_row").forEach(function (r) {
        var nTabs = parseInt((r.querySelector(".tm_setm_meta") || {}).textContent, 10) || 0;
        if (nTabs > bestN) { bestN = nTabs; best = r; }
      });
      var e = best && best.querySelector("[data-act='edit']");
      if (e) e.click();
      var m = document.getElementById("tm_sets_manage_modal");
      if (m) m.style.setProperty("display", "none", "important");
    }
  }
  if (scene !== "dark") {
    var cp = document.getElementById("tm_chip_pop");
    if (cp) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }
  if (scene === "room" && !document.getElementById("tm_set_open_modal")) {
    var opens = document.querySelectorAll("#tm_sets_list .tm_set_open, .tm_set_line .tm_set_open");
    var ob = opens[Math.min(roomSet, opens.length - 1)];
    if (ob) ob.click();
  }
  if (scene === "sessions") {
    var pill = document.getElementById("tm_sessions_pill");
    if (pill && !(pop && pop.offsetParent)) pill.click();
  } else if (pop && pop.offsetParent) {
    var closeBtn = document.getElementById("tm_sessions_close");
    if (closeBtn) closeBtn.click();
  }

  // Show one session as idle (no tabs) so the shot carries "Sign out idle",
  // without closing anyone's real tabs. Display-only.
  var idleBtn = document.getElementById("tm_sess_signout_idle");
  var sessRows = document.querySelectorAll(".tm_sess_tr");
  if (scene === "sessions" && idleBtn && getComputedStyle(idleBtn).display === "none" && sessRows.length > 1) {
    var last = sessRows[sessRows.length - 1].children;
    // Columns: label, account · role, region, tab group, started, expires, tabs.
    last[2].textContent = "—";
    last[3].textContent = "—";
    last[6].textContent = "0";
    idleBtn.textContent = "Sign out idle (1)";
    idleBtn.style.setProperty("display", "inline-block", "important");
  }

  // ---- sessions panel: demo labels ----
  document.querySelectorAll("#tm_sessions_rows .tm_sess_tr").forEach(function (tr, i) {
    var lab = tr.children[0];
    if (lab && lab.textContent.trim() !== "—") lab.textContent = LABELS[i % LABELS.length];
  });

  // ---- generic pass: any real id / CH role / set name left in text or options ----
  // AWS service names must not appear in a store screenshot (flagged on an
  // earlier submission); a saved page on one becomes the plain console.
  var SERVICE_RE = /\b(costmanagement|billing|iam|ec2|s3|lambda|cloudwatch)\b/gi;
  var SET_UI = "#tm_sets_list, .tm_setm_row, #tm_set_edit_modal, #tm_set_bar, #tm_set_open_modal, #tm_sets_manage_modal";
  function scrub(str, inSetUI) {
    var out = str;
    // Set names first, and only where a node IS the name (or "Edit set ·
    // <name>"): a set called "123" must not rewrite digits inside an id, and a
    // set named after an account must match before that id is rewritten.
    var t = out.trim();
    if (inSetUI && setMap[t]) return out.replace(t, setMap[t]);
    var m = inSetUI && t.match(/^(Edit set · |Set: |Open set · )(.+)$/);
    if (m && setMap[m[2]]) return out.replace(m[2], setMap[m[2]]);
    // Inside a sentence ("<set> needs 3 new sessions …"): only names with a
    // letter in them, so a set called "111111" can't touch digits elsewhere.
    if (inSetUI) {
      Object.keys(setMap).filter(function (real) { return /[A-Za-z]/.test(real) && real.length >= 4; })
        .sort(function (x, y) { return y.length - x.length; })
        .forEach(function (real) { out = out.split(real).join(setMap[real]); });
    }
    realIds.forEach(function (id) { out = out.split(id).join(idMap[id]); });
    swapKeys.forEach(function (real) { out = out.split(real).join(nameSwap[real]); });
    out = out.replace(/costmanagement\/home[^\s]*/gi, "console/home?region=us-east-1");
    out = out.replace(SERVICE_RE, function (w) { return w[0] === w[0].toUpperCase() ? "Console" : "console"; });
    out = out.replace(/\bCH([A-Z][A-Za-z]+)\b/g, function (_, r) { return mapRole("CH" + r); });
    return out;
  }
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = walker.nextNode())) {
    var v = node.nodeValue;
    var nv = scrub(v, !!(node.parentElement && node.parentElement.closest(SET_UI)));
    if (nv !== v) node.nodeValue = nv;
  }
  document.querySelectorAll("input[type='text']").forEach(function (el) {
    if (el.value) el.value = scrub(el.value, !!el.closest(SET_UI));
  });
  document.querySelectorAll("option").forEach(function (o) {
    var v = scrub(o.textContent, false);
    if (v !== o.textContent) o.textContent = v;
  });
  // A row whose remembered service got scrubbed would read a bare "Console";
  // show it on "Console only" instead (display only: no change event, so
  // nothing is saved).
  document.querySelectorAll(".tm_service_dropdown").forEach(function (sel) {
    var o = sel.options[sel.selectedIndex];
    if (o && o.textContent.trim() === "Console") sel.selectedIndex = 0;
  });
  document.querySelectorAll(".tm_setm_row[data-set-id]").forEach(function (r) {
    var nm = r.querySelector(".tm_setm_name");
    var demo = setById[r.getAttribute("data-set-id")];
    if (nm && demo) { nm.textContent = demo; nm.title = demo; }
  });
  document.querySelectorAll(".tm_set_name_input, .tm_set_group_input").forEach(function (el) {
    el.value = mapSet(el.value);
  });

  // The sessions panel repaints itself (a console tab changing, a window
  // focus) — straight back to real data. Show a static copy of the rewritten
  // rows for the shot and hide the live list behind it; made once, so a later
  // pass doesn't copy a repaint.
  if (scene === "sessions") {
    var live = document.getElementById("tm_sessions_rows");
    if (live && !document.getElementById("tm_sessions_rows_shot") && live.querySelector(".tm_sess_tr")) {
      var copy = live.cloneNode(true);
      copy.id = "tm_sessions_rows_shot";
      live.parentNode.insertBefore(copy, live);
      live.style.setProperty("display", "none", "important");
    }
  } else {
    var oldCopy = document.getElementById("tm_sessions_rows_shot");
    if (oldCopy) oldCopy.remove();
    var liveRows = document.getElementById("tm_sessions_rows");
    if (liveRows) liveRows.style.removeProperty("display");
  }

  // ---- framing ----
  var si = document.getElementById("tm_search_input");
  if (si) si.blur();
  var rl = document.getElementById("tm_role_list");
  if (rl) { rl.style.outline = "none"; if (rl.focus) rl.focus(); }
  document.querySelectorAll("#claude-phantom-cursor, #claude-agent-glow-border")
    .forEach(function (el) { el.remove(); });

  // The store's 1280x800 frame is this display's full width, so the picker
  // renders at zoom 0.84 and is captured 1:1 (see README.md). The side menu
  // is position:fixed at a left the extension computes once; park it at its
  // collapsed position, with `important` like the extension's own value.
  var Z = 0.84;
  document.documentElement.style.zoom = String(Z);
  document.body.style.paddingRight = "220px";
  var ac = document.querySelector("#tm_actions_container");
  if (ac) ac.style.setProperty("left", (window.innerWidth / Z) + "px", "important");
  window.dispatchEvent(new Event("resize"));
  void document.body.offsetWidth;
  // The extension closes the "+N" pop-out on resize, so open it last. Its
  // chips are copies of the (already rewritten) row chips.
  if (scene === "dark" && !document.getElementById("tm_chip_pop")) {
    var more = document.querySelector('.tm_button_group[data-filter-group="tag"] .tm_more_chip');
    if (more) more.click();
  }
  // Staging renders at CSS zoom Z, where the extension's pixel placement of
  // the pop-out (from a zoomed getBoundingClientRect) lands off by the zoom.
  // Real pages aren't CSS-zoomed; re-seat it under its "+N" for the shot.
  // The extension re-seats it on its next refit (a frame later), so do this
  // after that too.
  function reseatPop() {
    var popEl = document.getElementById("tm_chip_pop");
    var moreEl = document.querySelector('.tm_button_group[data-filter-group="tag"] .tm_more_chip');
    if (!popEl || !moreEl) return;
    var mr = moreEl.getBoundingClientRect();
    popEl.style.setProperty("left", (mr.left / Z + window.scrollX) + "px", "important");
    popEl.style.setProperty("top", (mr.bottom / Z + window.scrollY + 6) + "px", "important");
  }
  reseatPop();
  setTimeout(reseatPop, 150);
  setTimeout(reseatPop, 400);

  var row = document.querySelector(".saml-role");
  var focusEl = {
    sets: "#tm_sets_manage_modal > *",
    edit: "#tm_set_edit_modal > *",
    sessions: "#tm_sessions_popover",
    dark: "#tm_chip_pop",
    room: "#tm_set_open_modal > *"
  }[scene];
  var fe = focusEl ? document.querySelector(focusEl) : null;
  var vw = window.innerWidth, vh = window.innerHeight;
  var rb = row ? row.getBoundingClientRect() : null;
  var fb = fe ? fe.getBoundingClientRect() : null;
  var framing = {
    vw: vw, vh: vh, shot: { x: 0, y: 2, w: 1280, h: 800 },
    rowLeft: rb ? Math.round(rb.left) : null,
    rowRight: rb ? Math.round(rb.right) : null,
    focusBottom: fb ? Math.round(fb.bottom) : null
  };
  framing.ok = vw >= 1280 && vh >= 802 && !!rb && rb.left > 20 && rb.right < vw &&
    (!focusEl || (!!fb && fb.width > 0 && fb.top > 2 && fb.bottom < 802));

  // ---- refuse the shot if anything real is still legible ----
  var txt = document.body.innerText;
  var leaks = realIds.filter(function (id) { return txt.indexOf(id) !== -1; });
  document.querySelectorAll("option").forEach(function (o) {
    realIds.forEach(function (id) { if (o.textContent.indexOf(id) !== -1) leaks.push("id in a dropdown option"); });
  });
  function allowed(sel, pool, what) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.children.length !== 0) return;
      var v = el.textContent.trim();
      if (v && pool.indexOf(v) === -1) leaks.push(what + " not in the demo set: " + v);
    });
  }
  allowed(".tm_role_name, .saml-role-description", ROLE_POOL, "role");
  allowed(".tm_account_name", NAMES, "account name");
  allowed(".tm_account_id", IDS, "account id");
  allowed(".tm_set_name, .tm_setm_name", SETS, "set name");
  document.querySelectorAll('.tm_filter_button[data-group="tag"], #tm_chip_pop [data-pop-filter]')
    .forEach(function (el) {
      var v = el.textContent.trim();
      if (v && TAGS.indexOf(v) === -1 && !/^(Direct roles|⤳ Jumps)$/.test(v)) leaks.push("tag not in the demo set: " + v);
    });
  if (/\bCH[A-Z][a-z]/.test(txt)) leaks.push("CH role name still visible");
  (txt.match(/\b\d{12}\b/g) || []).forEach(function (num) {
    if (IDS.indexOf(num) === -1) leaks.push("12-digit number not in the demo set: " + num.slice(0, 4) + "…");
  });
  swapKeys.forEach(function (real) {
    if (txt.indexOf(real) !== -1) leaks.push("real account name still visible");
  });
  if (/\((?:IAM|EC2|S3|Billing)[,)]/.test(txt)) leaks.push("AWS service list in visible text");
  var modalTxt = [].map.call(document.querySelectorAll('[id$="_modal"], #tm_sessions_popover'), function (el) { return el.innerText; }).join(" ");
  var svc = modalTxt.match(SERVICE_RE);
  if (svc) leaks.push("AWS service name visible: " + svc[0]);

  return JSON.stringify({
    scene: scene,
    accounts: realIds.length,
    dark: document.body.classList.contains("tm_theme_dark"),
    leaks: leaks,
    framing: framing
  });
})();
