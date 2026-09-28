// Console Hopper — launch page for Launch Sets.
//
// Chrome's popup blocker lets one click open one new window, so the role
// picker can't submit its SAML form into five new tabs at once. Instead it
// hands the batch to the service worker, which opens one of these pages per
// tab. Each page redeems its single-use ticket (the URL fragment) for the
// sign-in form fields — the SAML response, the chosen role and the RelayState
// deep link — and posts them to AWS's sign-in endpoint, exactly as the role
// picker's own form would.
//
// The SAML response never appears in this page's URL: it stays in the service
// worker's session storage until this page redeems the ticket, and the ticket
// is deleted as it is redeemed.

(function () {
  "use strict";

  const status = document.getElementById("hop_launch_status");

  function fail(text) {
    status.textContent = text;
    status.className = "error";
    document.title = "Console Hopper — couldn't open console";
  }

  const m = /^#([a-f0-9]{32})$/.exec(window.location.hash);
  // Drop the ticket from the URL straight away: it is single-use, and a reload
  // of this page should say so rather than look like it might work.
  history.replaceState(null, "", window.location.pathname);
  if (!m) {
    fail("This launch link is incomplete. Open the set again from the AWS role picker.");
    return;
  }

  chrome.runtime.sendMessage({ type: "hop_launch_take", ticket: m[1] }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok) {
      fail(
        "This launch link has expired or was already used. " +
        "Open the set again from the AWS role picker."
      );
      return;
    }
    const form = document.createElement("form");
    form.method = "post";
    form.action = res.action;
    for (const [name, value] of res.fields) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  });
})();
