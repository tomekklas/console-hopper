// Console Hopper — region lock.
//
// AWS's *global* service consoles drop the region from the console host:
//
//   eu-central-1.console.aws.amazon.com/iam/home
//     → console.aws.amazon.com/iam/home
//     → us-east-1.console.aws.amazon.com/iam/home
//
// (verified for iam, billing, organizations, route53, cloudfront, health,
// trustedadvisor, artifact, cost-management and support; ec2/s3/lambda/
// cloudformation/vpcconsole/rds/cloudwatch/console-home stay put). So a tab
// that visits one loses its region context, and the next regional console it
// opens is placed by AWS in that identity's Unified Settings "Default Region"
// — which is "Last used Region" unless somebody deliberately set it. That is
// why a Frankfurt tab comes back from IAM in Stockholm.
//
// Setting it at the AWS end means writing a per-identity setting through a
// private, credential-signed API, so it stays out of the extension: Console
// Hopper never holds AWS credentials. This module fixes it in the browser
// instead. The service worker remembers what region each tab is working in;
// for every console page a tab loads, planRegionLock() decides whether to
// leave it alone, adopt its region as the tab's, or send the tab back to the
// region it was already in.
//
// The one thing it must never do is fight the user: switching region from
// AWS's own region picker keeps you on the same service, so a region change
// that also changes service is AWS carrying over a stale region, while a
// region change on the same service is the user asking for it.

// A hostname segment that is an AWS region code. Deliberately stricter than
// the picker's isValidRegionCode(): this one has to tell a region segment
// apart from a multi-session differentiator ("123456789012-a1b2c3") and from
// the global "support" console host, so it insists on the real shape —
// us-east-1, eu-central-1, ap-southeast-4, us-gov-west-1, us-iso-east-1.
export const REGION_SEGMENT_RE = /^[a-z]{2}(?:-[a-z]+)+-\d{1,2}$/;

// Service consoles that AWS serves without a region. Landing on one is not a
// region change, so the lock neither corrects them nor adopts whatever host
// region they happen to redirect to. Verified 2026-09-07 by following the
// redirects off a regional host; anything not listed is treated as regional,
// and the loop guard covers the case where AWS adds one we don't know about.
export const GLOBAL_SERVICE_KEYS = new Set([
  "iam",
  "billing",
  "organizations",
  "route53",
  "cloudfront",
  "health",
  "trustedadvisor",
  "artifact",
  "cost-management",
  "costmanagement",
  "support",
  "account",
]);

// How long the picker's hand-off for a console landing stays live
// (hop_pending_jumps; the decorator honours the same window).
export const HANDOFF_TTL_MS = 5 * 60 * 1000;

// Whether a hand-off entry means "a jump is steering this account's landing",
// which is when the lock has to stay out of the way. Only a jump stashes the
// region (and maybe the service) it asked for; a sign-in's or Launch Set's
// entry is just the tab label, never consumed when the tab arrives with its
// own, and must not switch the lock off for that account for five minutes.
export function isLandingHandOff(entry, now) {
  const at = typeof now === "number" ? now : Date.now();
  if (!entry || !entry.ts) return false;
  if (!entry.region && !entry.service) return false;
  return at - entry.ts <= HANDOFF_TTL_MS;
}

// How long a correction we already tried blocks another attempt at the same
// URL. Long enough to break a redirect ping-pong with AWS, short enough that
// a user going somewhere and coming back isn't left stranded.
export const LOOP_GUARD_MS = 15000;

// Describe an AWS console URL: which region its host names (if any), which
// service it is, and whether that service is one of the region-less globals.
// Returns null for anything that isn't an AWS console page — the caller then
// does nothing at all.
export function parseConsolePage(href) {
  let url;
  try {
    url = new URL(String(href || ""));
  } catch (e) {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host !== "console.aws.amazon.com" && !host.endsWith(".console.aws.amazon.com")) {
    return null;
  }

  // Host shapes, in the two forms AWS uses:
  //   {region}.console.aws.amazon.com                  → region at index 0
  //   {differentiator}.{region}.console.aws.amazon.com → region at index 1
  // Anything else (console.aws.amazon.com, support.console.aws.amazon.com,
  // {differentiator}.console.aws.amazon.com) carries no region.
  const parts = host.split(".");
  let regionIndex = -1;
  if (parts[1] === "console" && REGION_SEGMENT_RE.test(parts[0])) regionIndex = 0;
  else if (parts[2] === "console" && REGION_SEGMENT_RE.test(parts[1])) regionIndex = 1;

  const segments = url.pathname.split("/").filter(Boolean);
  const serviceKey = (segments[0] || "").toLowerCase();

  return {
    href: url.href,
    region: regionIndex === -1 ? "" : parts[regionIndex],
    regionIndex,
    serviceKey,
    // A region-less host is a global console by construction; the key list
    // catches the globals AWS parks on us-east-1 instead.
    isGlobal: regionIndex === -1 || GLOBAL_SERVICE_KEYS.has(serviceKey),
  };
}

// The same console URL in another region: the host's region segment swapped,
// and any region= query value brought along with it. The rest of the URL is
// kept byte-for-byte — console URLs carry opaque encoded params, and the hash
// routinely holds the service's own deep link.
export function regionSwapUrl(href, region) {
  const target = String(region || "");
  if (!REGION_SEGMENT_RE.test(target)) return null;
  let url;
  try {
    url = new URL(String(href || ""));
  } catch (e) {
    return null;
  }
  const parts = url.hostname.toLowerCase().split(".");
  let regionIndex = -1;
  if (parts[1] === "console" && REGION_SEGMENT_RE.test(parts[0])) regionIndex = 0;
  else if (parts[2] === "console" && REGION_SEGMENT_RE.test(parts[1])) regionIndex = 1;
  if (regionIndex === -1 || parts[regionIndex] === target) return null;
  parts[regionIndex] = target;
  const search = url.search.replace(/([?&]region=)[^&]*/gi, "$1" + target);
  return url.protocol + "//" + parts.join(".") + url.pathname + search + url.hash;
}

// Decide what to do with one console page load.
//
//   page     — parseConsolePage() of the URL that just loaded
//   pinned   — the region this tab is working in, "" if not established yet
//   prev     — the previous console page seen in this tab ({ serviceKey,
//              isGlobal }), null if this is the tab's first
//   fallback — the user's General Settings default region, used only to
//              rescue a tab whose first regional page arrives via a global
//              console (a bookmark straight to IAM, then EC2)
//   tried    — { url, ts } of the last correction issued for this tab
//   now      — Date.now(), injected so the loop guard is testable
//
// Returns { action: "none" | "adopt" | "correct", region, url, reason }.
export function planRegionLock({ page, pinned, prev, fallback, tried, now } = {}) {
  const at = typeof now === "number" ? now : Date.now();
  const held = REGION_SEGMENT_RE.test(String(pinned || "")) ? String(pinned) : "";
  const spare = REGION_SEGMENT_RE.test(String(fallback || "")) ? String(fallback) : "";

  if (!page) return { action: "none", reason: "not-a-console-page" };

  // Global consoles have no region to hold or to fix. Leave them completely
  // alone — correcting one is how you get a redirect loop with AWS.
  if (page.isGlobal || !page.region) return { action: "none", reason: "global-console" };

  const correct = (region, reason) => {
    const url = regionSwapUrl(page.href, region);
    if (!url) return { action: "none", reason: "no-rewrite" };
    // Already tried this exact correction and we're back here: AWS is refusing
    // it. Stop rather than ping-pong.
    if (tried && tried.url === url && at - (tried.ts || 0) < LOOP_GUARD_MS) {
      return { action: "none", reason: "loop-guard" };
    }
    return { action: "correct", region, url, reason };
  };

  if (!held) {
    // First regional page in this tab. Normally its region IS the user's
    // intent (a jump lands in the region it asked for, a bookmark names one).
    // The exception is arriving from a global console, where AWS picked the
    // region on the identity's behalf — that's the bug this module exists for.
    if (prev && prev.isGlobal && spare && spare !== page.region) {
      return correct(spare, "from-global-no-pin");
    }
    return { action: "adopt", region: page.region, reason: "first-regional-page" };
  }

  if (page.region === held) return { action: "none", reason: "already-pinned" };

  // Same service, different region: that's AWS's region picker, i.e. the user
  // deliberately moving this tab. Follow them, and hold the new region.
  if (prev && !prev.isGlobal && prev.serviceKey === page.serviceKey) {
    return { action: "adopt", region: page.region, reason: "user-switched-region" };
  }

  return correct(held, "stale-region-carried-over");
}

// Fold one page load into a tab's stored state. Kept here, next to the rules
// it has to agree with, so the sequence "land → global console → back" can be
// unit-tested end to end rather than only one decision at a time.
export function nextTabState({ state, page, plan, now } = {}) {
  const at = typeof now === "number" ? now : Date.now();
  const prior = state || {};
  if (!page) return prior;

  const correcting = plan && plan.action === "correct";
  return {
    // A correction implies the tab holds the region we're sending it back to,
    // including the rescue case where nothing was pinned yet.
    pinned:
      plan && (plan.action === "adopt" || plan.action === "correct")
        ? plan.region
        : prior.pinned || "",
    // What the *next* page will see as its predecessor. A correction is our
    // own navigation rather than a page the user asked for, so it leaves the
    // predecessor alone — otherwise the corrected load would look like a
    // service change and could bounce again.
    prev: correcting
      ? prior.prev
      : { serviceKey: page.serviceKey, isGlobal: page.isGlobal },
    tried: correcting ? { url: plan.url, ts: at } : prior.tried || null,
    seen: at,
  };
}
