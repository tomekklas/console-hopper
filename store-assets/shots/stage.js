(function () {
  // Display-only staging for a store screenshot. Rewrites VISIBLE TEXT to safe
  // demo values and leaves every data-* attribute holding the real value, so
  // the mapping stays stable and this whole script is re-runnable. A page
  // reload restores the real data.
  var IDS = ["111122223333", "444455556666", "777788889999", "123456789012",
             "222233334444", "555566667777", "888899990000", "333344445555",
             "666677778888", "999900001111", "121234345656", "343456567878"];
  var NAMES = ["acme-prod-audit", "acme-prod-backup", "globex-prod-web",
               "initech-test-core", "acme-dev-tools", "globex-test-data",
               "initech-prod-net", "acme-sec-logging", "globex-dev-apps",
               "initech-sandbox", "acme-test-api", "globex-sec-audit"];
  var ROLES = { CHBilling: "Billing", CHReadOnly: "ReadOnly",
                CHPowerUser: "PowerUser", CHOrgAdmin: "OrgAdmin",
                CHAdmin: "Admin", CHNetwork: "NetworkAdmin" };
  var TAGS = ["pci", "prod-network", "sandbox", "security-core"];

  // Stable account map, ordered by first appearance in the DOM.
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
  document.querySelectorAll(".tm_account_name").forEach(function (el) {
    var a = acct(el);
    if (a) el.textContent = nameMap[a];
  });

  // Role names: the CH* prefix is this org's, so map to generic ones.
  function mapRole(t) {
    t = (t || "").trim();
    if (ROLES[t]) return ROLES[t];
    return t.replace(/^CH/, "") || t;
  }
  document.querySelectorAll(".saml-role-description, .tm_role_name").forEach(function (el) {
    if (el.children.length === 0) el.textContent = mapRole(el.textContent);
  });

  // Tag chips that carry a real tag name.
  var t = 0;
  document.querySelectorAll(".tm_tag_chip").forEach(function (el) {
    if (el.classList.contains("tm_no_tags")) return;
    el.textContent = TAGS[t++ % TAGS.length];
  });

  // "via <profile> hub · max 1 h" lines under jump rows, and any filter chip
  // or label naming the real jump profile.
  document.querySelectorAll("*").forEach(function (el) {
    if (el.children.length !== 0) return;
    var s = el.textContent;
    if (/^\s*via\s+.+hub/.test(s)) el.textContent = "via Acme hub · max 1 h";
  });

  // Filter-bar chips for the tag group carry the org's real tag names —
  // "palo-alto" (a real vendor) was flagged on an earlier submission.
  var f = 0;
  document.querySelectorAll('.tm_filter_button[data-group="tag"]').forEach(function (el) {
    el.textContent = TAGS[f++ % TAGS.length];
  });

  document.body.classList.add("tm_theme_dark");

  // Idempotent: re-running staging must not stack a second modal.
  document.querySelectorAll("#tm_general_settings_modal").forEach(function (el) { el.remove(); });
  var gs = document.getElementById("tm_general_settings");
  if (gs) gs.click();

  // The shipped 1.6.0 help text for this setting (source: src/content/index.js).
  // Patched in because the extension has to be reloaded in Chrome to pick up a
  // rebuild, and a store screenshot must not show an AWS service-name list.
  var HELP = "Some AWS consoles are account-wide and have no region of their own, so " +
    "leaving one drops you into whatever region your AWS profile defaults to — not " +
    "the one you were working in. This sends the tab back. Changing region from " +
    "AWS's own region picker still works: the tab follows you and stays there.";
  document.querySelectorAll("span").forEach(function (el) {
    if (el.children.length === 0 && /AWS serves global consoles/.test(el.textContent)) {
      el.textContent = HELP;
    }
  });


  // The extension focuses the search box whenever the window is activated,
  // which pops the search card open over the shot.
  var si = document.getElementById("tm_search_input");
  if (si) si.blur();
  var rl = document.getElementById("tm_role_list");
  if (rl) { rl.style.outline = "none"; rl.focus && rl.focus(); }
  document.querySelectorAll("#claude-phantom-cursor, #claude-agent-glow-border")
    .forEach(function (el) { el.remove(); });

  // The actions column (Find account / Jump / Tabs / sessions) is
  // position:fixed with a JS-computed `left` that tracks the container's right
  // edge, so at any window size it sits off-screen. Pull it back into frame —
  // display-only, exactly like the demo-data rewrite above.
  // The actions column is position:fixed at a `left` the extension computes
  // from the container's right edge, so it sits off-screen whenever the page
  // is full-width. Fighting the value directly loses — it gets recomputed
  // before the shutter. Instead narrow the container and let the extension
  // recompute, which puts the column inside the viewport by its own rules.
  // This display is 1280px wide, so the store's 1280x800 frame IS the whole
  // viewport — there is no room to capture bigger and downscale. Three staging
  // tweaks make the picker fit that frame:
  //  - zoom, because the layout needs ~1480px to seat the role rows and the
  //    actions column side by side;
  //  - body padding, because mock-saml renders the sign-in page full-width
  //    (a real AWS SAML page is not) which spreads the role rows too wide;
  //  - an explicit left for the side menu, which is position:fixed and parks
  //    itself off the right edge with only its handle showing, at a left the
  //    extension computes once from the container's right edge. On this
  //    full-width page that computation leaves a slice of the panel in frame,
  //    and it is NOT recomputed on a synthetic resize, so park it here — with
  //    `important`, because the extension's own inline value carries it.
  //    Lengths here are CSS px, which the zoom scales, hence the /Z.
  var Z = 0.84;
  document.documentElement.style.zoom = String(Z);
  document.body.style.paddingRight = "220px";
  var ac = document.querySelector("#tm_actions_container");
  if (ac) ac.style.setProperty("left", ((window.innerWidth - 18) / Z) + "px", "important");

  void document.body.offsetWidth;
  // Capture rect: the window is sized so the viewport IS the store's frame, so
  // take it 1:1 — no downscale, no upscale. The 2px top offset drops a sliver
  // of browser chrome that the viewport-origin calculation catches.
  var row = document.querySelector(".saml-role");
  var modal = document.querySelector("#tm_general_settings_modal > *") ||
              document.querySelector("#tm_general_settings_modal");
  var vw = window.innerWidth, vh = window.innerHeight;
  var rb = row ? row.getBoundingClientRect() : null;
  var mb = modal ? modal.getBoundingClientRect() : null;
  var framing = {
    vw: vw, vh: vh, shot: { x: 0, y: 2, w: 1280, h: 800 },
    rowLeft: rb ? Math.round(rb.left) : null,
    rowRight: rb ? Math.round(rb.right) : null,
    modalBottom: mb ? Math.round(mb.bottom) : null
  };
  framing.ok = vw >= 1280 && vh >= 802 && !!rb && rb.left > 20 && rb.right < vw &&
    !!mb && mb.top > 2 && mb.bottom < 802;

  // Refuse the shot if anything real is still legible.
  var txt = document.body.innerText;
  var leaks = realIds.filter(function (id) { return txt.indexOf(id) !== -1; });
  if (/\bCH[A-Z]/.test(txt)) leaks.push("CH* role name");
  if (/Cloud\s*Scale/i.test(txt)) leaks.push("Cloud Scale profile");
  document.querySelectorAll('.tm_filter_button[data-group="tag"], .tm_tag_chip')
    .forEach(function (el) {
      var v = el.textContent.trim().replace(/^\+?tag$/, "");
      if (v && TAGS.indexOf(v) === -1) leaks.push("tag not in the demo set: " + v);
    });
  if (/\((?:IAM|EC2|S3|Billing)[,)]/.test(txt)) leaks.push("AWS service list in visible text");

  return JSON.stringify({
    accounts: realIds.length,
    modals: document.querySelectorAll("#tm_general_settings_modal").length,
    dark: document.body.classList.contains("tm_theme_dark"),
    leaks: leaks,
    framing: framing
  });
})();
