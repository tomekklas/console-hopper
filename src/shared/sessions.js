// AWS console sessions — which role a session belongs to, how jumps pair up
// with their hub, and whether a Launch Set fits beside the live ones. Pure
// functions, shared by the role picker and the service worker, and the unit
// tests. A session is { differentiator, account, role, tabs, expiry,
// authTime }, as the worker builds it from AWS's sessions/v1/list.

// A role's key in AWS's session list: "account/RoleName". A role ARN may carry
// a path (role/path/Name), but the session's assumed-role ARN only has the name.
export const sessionRoleKey = (roleArn) => {
  const m = String(roleArn || "").match(/^arn:aws[a-z-]*:iam::(\d{12}):role\/(?:.*\/)?([^/]+)$/);
  return m ? `${m[1]}/${m[2]}` : "";
};

const sessionKeyOf = (s) => `${s.account}/${s.role}`;
const sumOf = (list, fn) => list.reduce((n, x) => n + (Number(fn(x)) || 0), 0);

// A jump signs in to a hub role, then switches into the destination, and the
// console authorises that switched session with the hub's credentials — so
// ending the hub most likely ends the jumped session too. AWS's session list
// doesn't link them, so they're paired from the Jump Profiles ({ hub,
// hubRole?, role }): a live session of a profile's destination role, in
// another account, hangs off the newest live hub session that started before
// it. A session of a role you can also sign in to directly (`directKeys`,
// "account/Role") is never taken for a jump: with a same-named direct role
// there's no telling them apart, and pairing a direct session with a hub
// would sign the hub out with it. Returns Map(jumped session -> hub session).
export const jumpHubs = (sessions, profiles, directKeys) => {
  const live = Array.isArray(sessions) ? sessions : [];
  const direct = directKeys instanceof Set ? directKeys : new Set(directKeys || []);
  const out = new Map();
  for (const s of live) {
    if (direct.has(sessionKeyOf(s))) continue;
    let best = null;
    for (const p of Array.isArray(profiles) ? profiles : []) {
      if (!p || s.role !== p.role || s.account === p.hub) continue;
      for (const h of live) {
        if (h === s || h.account !== p.hub || (p.hubRole && h.role !== p.hubRole)) continue;
        if ((h.authTime || 0) > (s.authTime || 0)) continue;
        if (!best || (h.authTime || 0) > (best.authTime || 0)) best = h;
      }
    }
    if (best) out.set(s, best);
  }
  return out;
};

// Live sessions as the units you can sign out: a hub together with the
// sessions jumped through it, or a session on its own. Each unit lists its
// differentiators, its open tabs and when its first member expires.
// `directKeys` as for jumpHubs.
export const groupSessions = (sessions, profiles, directKeys) => {
  const live = Array.isArray(sessions) ? sessions : [];
  const hubOf = jumpHubs(live, profiles, directKeys);
  const unitOf = (members, hub) => ({
    ids: members.map((m) => m.differentiator),
    sessions: members,
    hub,
    tabs: sumOf(members, (m) => m.tabs),
    expiry: Math.min(...members.map((m) => m.expiry || Infinity)),
  });
  const units = [];
  for (const s of live) {
    if (hubOf.has(s)) continue; // listed with its hub
    const kids = live.filter((k) => hubOf.get(k) === s);
    units.push(unitOf([s, ...kids], kids.length ? s : null));
  }
  return units;
};

// Opening a set against AWS's session cap. `roleKeys` are the set's roles in
// set order ("account/Role", see sessionRoleKey); `sessions` the live list
// ({ differentiator, account, role, tabs, expiry }). A role with a live
// session opens in it (`keep` maps role key to that session) and needs no
// slot; every other role needs a free one, and `deficit` is how many more
// sessions must be signed out before the whole set fits.
export const planSessionRoom = (roleKeys, sessions, limit) => {
  const live = Array.isArray(sessions) ? sessions : [];
  const wanted = [...new Set(roleKeys)];
  // Several sessions can share one role (AWS starts a fresh one for a sign-in
  // that arrives before the role's cookie exists). The set opens in one — the
  // busiest, then the longest-lived.
  const keep = new Map();
  for (const s of live) {
    const k = sessionKeyOf(s);
    if (!wanted.includes(k)) continue;
    const cur = keep.get(k);
    if (!cur || (s.tabs || 0) > (cur.tabs || 0) ||
        ((s.tabs || 0) === (cur.tabs || 0) && (s.expiry || 0) > (cur.expiry || 0))) {
      keep.set(k, s);
    }
  }
  const reused = wanted.filter((k) => keep.has(k));
  const fresh = wanted.filter((k) => !keep.has(k));
  const free = Math.max(0, limit - live.length);
  return { reused, fresh, free, deficit: Math.max(0, fresh.length - free), keep };
};
