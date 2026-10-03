import { describe, it, expect } from "vitest";
import {
  LAUNCH_SET_MAX_TABS,
  launchSetRoleCount,
  normalizeLaunchSets,
  groupSessions,
  jumpHubs,
  parsePageMaxWidth,
  splitNameTail,
  planSessionRoom,
  sessionRoleKey,
  escapeHtml,
  sanitizeInput,
  parseAccountInfo,
  matchesAnyPattern,
  matchesRolePatterns,
  parseRegionLines,
  formatRegionLines,
  normalizeRegionList,
  isValidRegionCode,
  parseAccountNameLines,
  badAccountNameLines,
  formatAccountNameLines,
  normalizeAccountNames,
  parseAssumeProfileLines,
  formatAssumeProfileLines,
  normalizeAssumeProfiles,
  normalizeJumpRecents,
  normalizeTagList,
  parseAccountTagLines,
  badAccountTagLines,
  formatAccountTagLines,
  normalizeAccountTags,
  migrateAccountTags,
  normalizeChipOrder,
  orderByIds,
  tagKeyFor,
  searchMatches,
  parseQuery,
  matchesQuery,
  normalizeJumpDests,
  jumpDestKey,
  resolveServiceToken,
  serviceTokenForPath,
  parseJumpDestLines,
  formatJumpDestLines,
} from "../src/content/util.js";

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;"
    );
  });
  it("returns an empty string for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
  it("exposes sanitizeInput as the same escaper", () => {
    expect(sanitizeInput).toBe(escapeHtml);
  });
});

describe("parseAccountInfo", () => {
  it("parses 'Account: name (id)'", () => {
    expect(parseAccountInfo("Account: Foo Prod (123456789012)")).toEqual({
      name: "Foo Prod",
      id: "123456789012",
    });
  });
  it("recovers the id from a bare 12-digit account (no IAM alias)", () => {
    // AWS renders an alias-less account as just its number, with no "(id)".
    expect(parseAccountInfo("Account: 321098765432")).toEqual({
      name: "321098765432",
      id: "321098765432",
    });
    expect(parseAccountInfo("321098765432")).toEqual({
      name: "321098765432",
      id: "321098765432",
    });
  });
  it("strips the Account: prefix when there is no id", () => {
    expect(parseAccountInfo("Account: Bar")).toEqual({ name: "Bar", id: "" });
  });
  it("handles empty input", () => {
    expect(parseAccountInfo("")).toEqual({ name: "", id: "" });
  });
});

describe("matchesAnyPattern", () => {
  it("matches a case-insensitive substring of the account name", () => {
    expect(matchesAnyPattern(["prod"], "My-PROD-Account", "")).toBe(true);
    expect(matchesAnyPattern(["prod"], "dev-account", "")).toBe(false);
  });
  it("matches an exact 12-digit account id", () => {
    expect(matchesAnyPattern(["123456789012"], "x", "123456789012")).toBe(true);
    expect(matchesAnyPattern(["123456789012"], "x", "999999999999")).toBe(
      false
    );
  });
  it("does not treat the id pattern as a name substring", () => {
    // "1234" is not an exact id and must not match the name unless present.
    expect(matchesAnyPattern(["1234"], "prod", "123456789012")).toBe(false);
  });
  it("returns false for empty / blank pattern lists", () => {
    expect(matchesAnyPattern([], "anything", "1")).toBe(false);
    expect(matchesAnyPattern(null, "anything", "1")).toBe(false);
    expect(matchesAnyPattern(["", "  "], "name", "1")).toBe(false);
  });
});

describe("matchesRolePatterns", () => {
  it("matches a case-insensitive substring of the role name", () => {
    expect(matchesRolePatterns(["admin"], "MyAdminRole")).toBe(true);
    expect(matchesRolePatterns(["readonly"], "PowerUser")).toBe(false);
  });
  it("returns false for empty pattern lists", () => {
    expect(matchesRolePatterns([], "AdminRole")).toBe(false);
  });
});

describe("parseRegionLines", () => {
  it("parses plain codes and 'code: Label' lines, preserving order", () => {
    expect(
      parseRegionLines("us-east-1: US East (N. Virginia)\neu-west-1\n")
    ).toEqual([
      { id: "us-east-1", label: "US East (N. Virginia)" },
      { id: "eu-west-1", label: "eu-west-1" },
    ]);
  });
  it("lowercases codes, trims, skips blanks and invalid codes, dedupes", () => {
    expect(
      parseRegionLines("  US-WEST-2  \n\nnot a region!\nus-west-2: dup")
    ).toEqual([{ id: "us-west-2", label: "us-west-2" }]);
  });
  it("handles empty input", () => {
    expect(parseRegionLines("")).toEqual([]);
    expect(parseRegionLines(null)).toEqual([]);
  });
});

describe("formatRegionLines", () => {
  it("is the inverse of parseRegionLines and omits redundant labels", () => {
    const list = [
      { id: "us-east-1", label: "US East (N. Virginia)" },
      { id: "eu-west-1", label: "eu-west-1" },
    ];
    expect(formatRegionLines(list)).toBe(
      "us-east-1: US East (N. Virginia)\neu-west-1"
    );
    expect(parseRegionLines(formatRegionLines(list))).toEqual(list);
  });
});

describe("normalizeRegionList", () => {
  it("keeps valid entries, drops junk, dedupes, defaults the label to the id", () => {
    expect(
      normalizeRegionList([
        { id: "US-EAST-1", label: "  " },
        { id: "us-east-1", label: "dup" },
        { id: "bad region" },
        null,
        "nope",
        { id: "eu-west-1", label: "Ireland" },
      ])
    ).toEqual([
      { id: "us-east-1", label: "us-east-1" },
      { id: "eu-west-1", label: "Ireland" },
    ]);
  });
  it("returns [] for non-arrays", () => {
    expect(normalizeRegionList(null)).toEqual([]);
    expect(normalizeRegionList("x")).toEqual([]);
  });
});

describe("isValidRegionCode", () => {
  it("accepts real region codes across partitions", () => {
    for (const code of ["us-east-1", "eu-central-1", "ap-southeast-2", "us-gov-east-1", "cn-north-1"]) {
      expect(isValidRegionCode(code)).toBe(true);
    }
  });
  it("rejects empty, non-string, and injection-shaped values", () => {
    expect(isValidRegionCode("")).toBe(false);
    expect(isValidRegionCode(null)).toBe(false);
    expect(isValidRegionCode(undefined)).toBe(false);
    // A dot, slash, space, or uppercase would let a value escape a host segment
    // or query value — all must be rejected.
    expect(isValidRegionCode("eu-central-1.evil.com")).toBe(false);
    expect(isValidRegionCode("us-east-1/path")).toBe(false);
    expect(isValidRegionCode("us east 1")).toBe(false);
    expect(isValidRegionCode("US-EAST-1")).toBe(false);
  });
});

describe("parseAccountNameLines", () => {
  it("parses 'id: Name' lines, skipping invalid ids and blanks", () => {
    expect(
      parseAccountNameLines(
        "123456789012: Prod Logging\nnot-an-id: x\n\n999999999999 : Sandbox"
      )
    ).toEqual({ "123456789012": "Prod Logging", "999999999999": "Sandbox" });
  });
  it("requires a 12-digit id and a non-empty name", () => {
    expect(parseAccountNameLines("123456789012:")).toEqual({});
    expect(parseAccountNameLines("12345: Too short")).toEqual({});
    expect(parseAccountNameLines("123456789012 no colon")).toEqual({});
  });
});

describe("formatAccountNameLines", () => {
  it("round-trips with parseAccountNameLines", () => {
    const map = { "123456789012": "Prod Logging", "999999999999": "Sandbox" };
    expect(parseAccountNameLines(formatAccountNameLines(map))).toEqual(map);
  });
});

describe("normalizeAccountNames", () => {
  it("keeps 12-digit id -> string-name pairs and trims, drops the rest", () => {
    expect(
      normalizeAccountNames({
        "123456789012": "  Prod  ",
        bad: "x",
        "999999999999": "",
        "111111111111": 5,
      })
    ).toEqual({ "123456789012": "Prod" });
  });
  it("returns {} for non-objects", () => {
    expect(normalizeAccountNames(null)).toEqual({});
    expect(normalizeAccountNames([])).toEqual({});
  });
});

describe("parseAssumeProfileLines", () => {
  it("parses 'name | hub | role', requiring a 12-digit hub and a role", () => {
    expect(
      parseAssumeProfileLines(
        "Acme Prod | 111111111111 | OrgAdmin\nbad | 123 | x\n\nAcme Dev | 222222222222 | OrgAdmin"
      )
    ).toEqual([
      { name: "Acme Prod", hub: "111111111111", role: "OrgAdmin" },
      { name: "Acme Dev", hub: "222222222222", role: "OrgAdmin" },
    ]);
  });
  it("skips lines missing a field and dedupes by name (case-insensitive)", () => {
    expect(parseAssumeProfileLines("Only Two | 111111111111")).toEqual([]);
    expect(
      parseAssumeProfileLines(
        "Acme | 111111111111 | R1\nacme | 222222222222 | R2"
      )
    ).toEqual([{ name: "Acme", hub: "111111111111", role: "R1" }]);
  });
  it("caps name at 64 and role at 128 characters", () => {
    const [p] = parseAssumeProfileLines(
      `${"N".repeat(100)} | 111111111111 | ${"R".repeat(200)}`
    );
    expect(p.name).toHaveLength(64);
    expect(p.role).toHaveLength(128);
  });
  it("takes an optional 4th field as the landing region, dropping bad ones", () => {
    expect(
      parseAssumeProfileLines(
        "Acme | 111111111111 | OrgAdmin | EU-CENTRAL-1\n" +
          "Globex | 222222222222 | OrgAdmin | not a region!\n" +
          "Initech | 333333333333 | OrgAdmin"
      )
    ).toEqual([
      { name: "Acme", hub: "111111111111", role: "OrgAdmin", region: "eu-central-1" },
      { name: "Globex", hub: "222222222222", role: "OrgAdmin" },
      { name: "Initech", hub: "333333333333", role: "OrgAdmin" },
    ]);
  });
  it("round-trips through formatAssumeProfileLines with and without a region", () => {
    const text = "Acme | 111111111111 | OrgAdmin | eu-central-1\nGlobex | 222222222222 | OrgAdmin";
    expect(formatAssumeProfileLines(parseAssumeProfileLines(text))).toBe(text);
  });
  it("takes an optional hub role as 'account/role'", () => {
    // Without it the first row for the account wins, which may be a role that
    // can't assume anything.
    expect(parseAssumeProfileLines("Acme | 111111111111/HubRole | OrgAdmin | eu-west-1")).toEqual([
      { name: "Acme", hub: "111111111111", role: "OrgAdmin", hubRole: "HubRole", region: "eu-west-1" },
    ]);
    // A bare account id still means "any role in that account".
    expect(parseAssumeProfileLines("Acme | 111111111111 | OrgAdmin")).toEqual([
      { name: "Acme", hub: "111111111111", role: "OrgAdmin" },
    ]);
  });
  it("round-trips a hub role", () => {
    const text = "Acme | 111111111111/CHHub | CHJump | eu-central-1";
    expect(formatAssumeProfileLines(parseAssumeProfileLines(text))).toBe(text);
  });
});

describe("normalizeJumpRecents", () => {
  it("keeps valid entries, trims, drops junk, defaults missing fields", () => {
    expect(
      normalizeJumpRecents([
        { org: "  Acme  ", account: " 111111111111 ", label: "  prod  ", role: "  OrgAdmin  ", ts: 5 },
        { org: "Bad", account: "999", label: "x", ts: 1 },
        { account: "222222222222" },
        null,
        "nope",
      ])
    ).toEqual([
      { org: "Acme", account: "111111111111", label: "prod", role: "OrgAdmin", ts: 5 },
      { org: "", account: "222222222222", label: "", role: "", ts: 0 },
    ]);
  });
  it("caps the list at 6 entries and returns [] for non-arrays", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      org: "Acme",
      account: String(100000000000 + i),
      label: "x",
      ts: i,
    }));
    expect(normalizeJumpRecents(many)).toHaveLength(6);
    expect(normalizeJumpRecents(null)).toEqual([]);
    expect(normalizeJumpRecents({})).toEqual([]);
  });
});

describe("formatAssumeProfileLines", () => {
  it("round-trips with parseAssumeProfileLines", () => {
    const list = [
      { name: "Acme Prod", hub: "111111111111", role: "OrgAdmin" },
      { name: "Acme Dev", hub: "222222222222", role: "ReadOnly" },
    ];
    expect(parseAssumeProfileLines(formatAssumeProfileLines(list))).toEqual(list);
  });
});

describe("normalizeAssumeProfiles", () => {
  it("keeps valid {name,hub,role}, trims, drops junk, dedupes", () => {
    expect(
      normalizeAssumeProfiles([
        { name: "  Acme  ", hub: " 111111111111 ", role: " OrgAdmin " },
        { name: "acme", hub: "222222222222", role: "Dup" },
        { name: "Bad", hub: "999", role: "x" },
        { name: "NoRole", hub: "333333333333", role: "" },
        null,
        "nope",
      ])
    ).toEqual([{ name: "Acme", hub: "111111111111", role: "OrgAdmin" }]);
  });
  it("returns [] for non-arrays", () => {
    expect(normalizeAssumeProfiles(null)).toEqual([]);
    expect(normalizeAssumeProfiles({})).toEqual([]);
  });
});

describe("normalizeTagList", () => {
  it("trims, collapses whitespace, drops empties, caps length", () => {
    expect(normalizeTagList(["  palo   alto ", "", "  ", "x".repeat(60)])).toEqual([
      "palo alto",
      "x".repeat(40),
    ]);
  });
  it("dedupes case-insensitively, first spelling wins", () => {
    expect(normalizeTagList(["Palo Alto", "palo alto", "PALO ALTO"])).toEqual(["Palo Alto"]);
  });
  it("caps the number of tags per account", () => {
    const many = Array.from({ length: 30 }, (_, i) => `t${i}`);
    expect(normalizeTagList(many)).toHaveLength(24);
  });
  it("returns [] for non-arrays", () => {
    expect(normalizeTagList(null)).toEqual([]);
    expect(normalizeTagList("nope")).toEqual([]);
  });
});

describe("parseAccountTagLines", () => {
  it("parses 'id: tag, tag' lines", () => {
    expect(
      parseAccountTagLines("123456789012: palo alto, firewall, pci\n 210987654321 : splunk")
    ).toEqual({
      "123456789012": ["palo alto", "firewall", "pci"],
      "210987654321": ["splunk"],
    });
  });
  it("skips bad ids, missing colons, and empty tag lists", () => {
    expect(parseAccountTagLines("12345: too short")).toEqual({});
    expect(parseAccountTagLines("123456789012 no colon")).toEqual({});
    expect(parseAccountTagLines("123456789012: , ,")).toEqual({});
  });
});

describe("parseAccountTagLines — role keys", () => {
  it("accepts account/role keys alongside account-wide ones", () => {
    expect(
      parseAccountTagLines("123456789012/Admin: ops-1\n123456789012: pci\n123456789012/Bad Role: x")
    ).toEqual({ "123456789012/Admin": ["ops-1"], "123456789012": ["pci"] });
  });
  it("merges repeated keys", () => {
    expect(parseAccountTagLines("123456789012/Admin: a\n123456789012/Admin: b, A")).toEqual({
      "123456789012/Admin": ["a", "b"],
    });
  });
});

describe("tagKeyFor", () => {
  it("builds account/role keys and rejects bad parts", () => {
    expect(tagKeyFor("123456789012", "ReadOnly")).toBe("123456789012/ReadOnly");
    expect(tagKeyFor("12345", "ReadOnly")).toBe("");
    expect(tagKeyFor("123456789012", "")).toBe("");
    expect(tagKeyFor("123456789012", "has space")).toBe("");
  });
});

describe("migrateAccountTags", () => {
  it("copies an account-wide tag onto each listed role and drops the account key", () => {
    const { map, changed } = migrateAccountTags(
      { "123456789012": ["pci"], "123456789012/Admin": ["ops-1"], "210987654321": ["splunk"] },
      [
        { account: "123456789012", role: "Admin" },
        { account: "123456789012", role: "ReadOnly" },
      ]
    );
    expect(changed).toBe(true);
    expect(map).toEqual({
      "123456789012/Admin": ["ops-1", "pci"],
      "123456789012/ReadOnly": ["pci"],
      "210987654321": ["splunk"],
    });
  });
  it("reports no change when nothing is account-wide or listed", () => {
    expect(migrateAccountTags({ "123456789012/Admin": ["a"] }, []).changed).toBe(false);
    expect(migrateAccountTags({ "210987654321": ["a"] }, [{ account: "123456789012", role: "X" }]).changed).toBe(false);
  });
});

describe("formatAccountTagLines", () => {
  it("round-trips with parseAccountTagLines", () => {
    const map = { "123456789012": ["palo alto", "pci"], "210987654321": ["splunk"] };
    expect(parseAccountTagLines(formatAccountTagLines(map))).toEqual(map);
  });
  it("returns '' for non-objects", () => {
    expect(formatAccountTagLines(null)).toBe("");
    expect(formatAccountTagLines([])).toBe("");
  });
});

describe("normalizeAccountTags", () => {
  it("keeps valid entries, drops bad ids and empty tag lists", () => {
    expect(
      normalizeAccountTags({
        "123456789012": [" palo alto ", "palo alto", ""],
        99999: ["bad id"],
        "210987654321": [],
      })
    ).toEqual({ "123456789012": ["palo alto"] });
  });
  it("returns {} for non-objects", () => {
    expect(normalizeAccountTags(null)).toEqual({});
    expect(normalizeAccountTags([])).toEqual({});
  });
});

describe("searchMatches", () => {
  it("is separator-insensitive for unquoted terms", () => {
    expect(searchMatches("test 123", "xx test123 yy")).toBe(true);
    expect(searchMatches("test123", "a test 123 b")).toBe(true);
    expect(searchMatches("us-east-1", "region useast1 here")).toBe(true);
  });
  it("does not over-match unrelated numbers", () => {
    expect(searchMatches("test 123", "test13")).toBe(false);
  });
  it("quoted terms match an exact literal substring", () => {
    expect(searchMatches('"test 123"', "a test 123 b")).toBe(true);
    expect(searchMatches('"test 123"', "test123")).toBe(false);
  });
  it("empty term matches everything", () => {
    expect(searchMatches("", "anything")).toBe(true);
    expect(searchMatches("   ", "anything")).toBe(true);
  });
});

const QF = new Set(["tag", "tags", "role", "name", "account", "acct", "id"]);

describe("parseQuery", () => {
  it("splits AND-ed field terms", () => {
    expect(parseQuery("tag:pci role:admin", QF)).toEqual([
      { field: "tag", negate: false, values: [{ text: "pci", quoted: false }] },
      { field: "role", negate: false, values: [{ text: "admin", quoted: false }] },
    ]);
  });
  it("comma = OR within a field", () => {
    expect(parseQuery("tag:pci,hipaa", QF)[0].values).toEqual([
      { text: "pci", quoted: false },
      { text: "hipaa", quoted: false },
    ]);
  });
  it("leading - negates", () => {
    expect(parseQuery("-role:readonly", QF)[0]).toMatchObject({ field: "role", negate: true });
  });
  it("keeps quoted phrases, bare and scoped", () => {
    expect(parseQuery('"palo alto"', QF)).toEqual([
      { field: "", negate: false, values: [{ text: "palo alto", quoted: true }] },
    ]);
    expect(parseQuery('tag:"cost center"', QF)[0]).toMatchObject({
      field: "tag",
      values: [{ text: "cost center", quoted: true }],
    });
  });
  it("leaves unknown prefixes as bare terms", () => {
    expect(parseQuery("arn:aws", new Set(["tag"]))).toEqual([
      { field: "", negate: false, values: [{ text: "arn:aws", quoted: false }] },
    ]);
  });
  it("bare multi-word becomes AND-ed terms", () => {
    expect(parseQuery("palo alto", QF)).toHaveLength(2);
  });
});

describe("matchesQuery", () => {
  const fields = {
    _all: "acme-net palo alto 658181310701 poweruser pci",
    tag: "palo alto pci",
    role: "poweruser",
    name: "acme-net",
    id: "658181310701",
    account: "acme-net 658181310701",
    acct: "acme-net 658181310701",
  };
  const q = (s) => matchesQuery(parseQuery(s, QF), fields);
  it("matches a field term", () => expect(q("tag:pci")).toBe(true));
  it("misses an absent field value", () => expect(q("tag:hipaa")).toBe(false));
  it("ANDs across terms", () => {
    expect(q("tag:pci role:poweruser")).toBe(true);
    expect(q("tag:pci role:readonly")).toBe(false);
  });
  it("ORs comma values within a field", () => expect(q("tag:hipaa,pci")).toBe(true));
  it("excludes with a leading -", () => {
    expect(q("-tag:hipaa")).toBe(true);
    expect(q("-tag:pci")).toBe(false);
  });
  it("bare terms hit the full text, separator-insensitive", () => {
    expect(q("palo poweruser")).toBe(true);
    expect(q("paloalto")).toBe(true);
  });
  it("a quoted scoped value is exact", () => {
    expect(q('tag:"palo alto"')).toBe(true);
    expect(q('tag:"palo  alto"')).toBe(false);
  });
});

// Region codes reach a URL *host* (`https://<region>.console.aws.amazon.com`),
// so these are the shapes a hostile settings import would try.
describe("isValidRegionCode as a URL-host guard", () => {
  it("rejects values that would bend the sign-in host", () => {
    for (const bad of [
      "evil.com/",
      "eu-central-1.evil.com",
      "eu-central-1/../..",
      "eu central 1",
      "eu_central_1",
      "EU-CENTRAL-1",
      "eu-central-1?x=1",
      "eu-central-1#frag",
      "//evil.com",
      "",
    ]) {
      expect(isValidRegionCode(bad)).toBe(false);
    }
  });
  it("accepts every partition's real codes", () => {
    for (const ok of ["us-east-1", "eu-central-1", "us-gov-west-1", "cn-northwest-1", "ap-southeast-4"]) {
      expect(isValidRegionCode(ok)).toBe(true);
    }
  });
});

// --- Jump destinations (1.5.0) ---

const SVC = [
  { id: "cloudwatch", name: "CloudWatch", path: "cloudwatch/home?region={region}" },
  { id: "rds", name: "RDS", path: "rds/home?region={region}" },
];

describe("normalizeJumpDests", () => {
  it("keeps valid entries and fills defaults", () => {
    const out = normalizeJumpDests([
      { name: "Payments", account: "484848484848", profile: "Org A", region: "eu-west-1", service: "rds/home?region={region}", label: "db failover" },
    ]);
    expect(out).toEqual([
      { name: "Payments", account: "484848484848", profile: "Org A", region: "eu-west-1", service: "rds/home?region={region}", label: "db failover" },
    ]);
  });
  it("drops entries without a 12-digit account or a profile", () => {
    expect(normalizeJumpDests([
      { account: "123", profile: "Org A" },
      { account: "484848484848", profile: "" },
      "junk",
      null,
    ])).toEqual([]);
  });
  it("dedupes by account+profile (case-insensitive profile)", () => {
    const out = normalizeJumpDests([
      { account: "484848484848", profile: "Org A", name: "first" },
      { account: "484848484848", profile: "org a", name: "second" },
      { account: "484848484848", profile: "Org B", name: "third" },
    ]);
    expect(out.map((d) => d.name)).toEqual(["first", "third"]);
  });
  it("drops malformed regions and unsafe service paths, keeps the entry", () => {
    const out = normalizeJumpDests([
      { account: "484848484848", profile: "Org A", region: "EVIL.COM/", service: "/absolute/path" },
      { account: "111111111111", profile: "Org A", service: "a/../../etc" },
    ]);
    expect(out[0].region).toBe("");
    expect(out[0].service).toBe("");
    expect(out[1].service).toBe("");
  });
  it("keeps real console deep links: # and : are legal in service paths", () => {
    const out = normalizeJumpDests([
      { account: "484848484848", profile: "Org A", service: "ec2/home?region={region}#Instances:" },
      { account: "111111111111", profile: "Org A", service: "cloudformation/home?region={region}#/stacks" },
    ]);
    expect(out[0].service).toBe("ec2/home?region={region}#Instances:");
    expect(out[1].service).toBe("cloudformation/home?region={region}#/stacks");
  });
  it("swaps the Import delimiter '|' out of names and labels", () => {
    const out = normalizeJumpDests([
      { account: "484848484848", profile: "Org A", name: "Payments | EU", label: "a | b" },
    ]);
    expect(out[0].name).toBe("Payments ¦ EU");
    expect(out[0].label).toBe("a ¦ b");
  });
  it("caps names/labels and the list length", () => {
    const long = "x".repeat(200);
    const many = Array.from({ length: 120 }, (_, i) => ({
      account: String(100000000000 + i), profile: "Org A", name: long, label: long,
    }));
    const out = normalizeJumpDests(many);
    expect(out.length).toBe(100);
    expect(out[0].name.length).toBe(64);
    expect(out[0].label.length).toBe(120);
  });
});

describe("jumpDestKey", () => {
  it("is stable, ARN-unlike, and unambiguous for awkward profiles", () => {
    expect(jumpDestKey("484848484848", "Org A")).toBe("jump::484848484848::Org%20A");
    // encodeURIComponent leaves no ":" in the profile part, so the "::"
    // separators can't be forged by a profile name.
    expect(jumpDestKey("484848484848", "a::b").split("::").length).toBe(3);
    expect(jumpDestKey("484848484848", "x").startsWith("jump::")).toBe(true);
  });
});

describe("resolveServiceToken / serviceTokenForPath", () => {
  it("resolves by id, name, or literal path", () => {
    expect(resolveServiceToken("rds", SVC)).toBe("rds/home?region={region}");
    expect(resolveServiceToken("CloudWatch", SVC)).toBe("cloudwatch/home?region={region}");
    expect(resolveServiceToken("rds/home?region={region}", SVC)).toBe("rds/home?region={region}");
  });
  it("maps console/empty to the console home and unknowns to null", () => {
    expect(resolveServiceToken("", SVC)).toBe("");
    expect(resolveServiceToken("Console only", SVC)).toBe("");
    expect(resolveServiceToken("nope", SVC)).toBe(null);
  });
  it("prefers the display name on the way back out", () => {
    expect(serviceTokenForPath("rds/home?region={region}", SVC)).toBe("RDS");
    expect(serviceTokenForPath("gone/home", SVC)).toBe("gone/home");
    expect(serviceTokenForPath("", SVC)).toBe("");
  });
});

describe("parseJumpDestLines / formatJumpDestLines", () => {
  it("parses the full positional form", () => {
    const out = parseJumpDestLines(
      "Payments prod | 484848484848 | Org A | eu-west-1 | rds | db failover check",
      SVC
    );
    expect(out).toEqual([{
      name: "Payments prod", account: "484848484848", profile: "Org A",
      region: "eu-west-1", service: "rds/home?region={region}", label: "db failover check",
    }]);
  });
  it("accepts the bare-account shorthand and empty middle slots", () => {
    const out = parseJumpDestLines(
      "606060606060 | Org B\nCost | 505050505050 | Org A | | CloudWatch",
      SVC
    );
    expect(out[0]).toMatchObject({ name: "", account: "606060606060", profile: "Org B" });
    expect(out[1]).toMatchObject({ name: "Cost", region: "", service: "cloudwatch/home?region={region}" });
  });
  it("keeps pipe-split label tails (sanitized) and drops unknown service tokens", () => {
    const out = parseJumpDestLines(
      "X | 484848484848 | Org A | eu-west-1 | wat | a | b",
      SVC
    );
    expect(out[0].service).toBe("");
    expect(out[0].label).toBe("a ¦ b");
  });
  it("does not shift when a name merely looks like an account id", () => {
    const out = parseJumpDestLines("111111111111 | 222222222222 | Org A", SVC);
    expect(out[0]).toMatchObject({
      name: "111111111111",
      account: "222222222222",
      profile: "Org A",
    });
  });
  it("skips blank and invalid lines", () => {
    expect(parseJumpDestLines("\n\nnot enough\n123 | Org A\n", SVC)).toEqual([]);
  });
  it("round-trips through format and back", () => {
    const list = [
      { name: "Payments prod", account: "484848484848", profile: "Org A", region: "eu-west-1", service: "rds/home?region={region}", label: "db failover" },
      { name: "", account: "606060606060", profile: "Org B", region: "", service: "", label: "" },
    ];
    const text = formatJumpDestLines(list, SVC);
    expect(text.split("\n")[1]).toBe("606060606060 | Org B");
    expect(parseJumpDestLines(text, SVC)).toEqual(list);
  });
});

describe("normalizeLaunchSets", () => {
  const ARN = "arn:aws:iam::123456789012:role/ReadOnly";
  const ARN2 = "arn:aws:iam::210987654321:role/Admin";
  const good = {
    id: "ab12",
    name: "OPS-1234",
    group: "OPS-1234",
    tabs: [
      { roleArn: ARN, service: "ec2/home?region={region}#Instances:", region: "eu-west-1" },
      { roleArn: ARN, service: "iam/home", region: "" },
      { roleArn: ARN2, service: "", region: "eu-central-1" },
    ],
    lastUsed: 1700000000000,
  };

  it("keeps a well-formed set as is", () => {
    expect(normalizeLaunchSets([good])).toEqual([good]);
  });

  it("keeps archived: true and drops any other archived value", () => {
    expect(normalizeLaunchSets([{ ...good, archived: true }])).toEqual([{ ...good, archived: true }]);
    expect(normalizeLaunchSets([{ ...good, archived: "yes" }])).toEqual([good]);
  });

  it("returns [] for non-arrays", () => {
    expect(normalizeLaunchSets(null)).toEqual([]);
    expect(normalizeLaunchSets({})).toEqual([]);
  });

  it("drops sets without an id, a name or any valid tab, and duplicate ids", () => {
    const out = normalizeLaunchSets([
      { ...good, id: "" },
      { ...good, id: "BAD ID" },
      { ...good, id: "x1", name: "  " },
      { ...good, id: "x2", tabs: [{ roleArn: "nope" }] },
      good,
      { ...good, name: "dup" },
    ]);
    expect(out.map((s) => s.name)).toEqual(["OPS-1234"]);
  });

  it("blanks unsafe service paths and bad regions instead of keeping them", () => {
    const [s] = normalizeLaunchSets([
      { ...good, tabs: [{ roleArn: ARN, service: "//evil.example/", region: "eu-west-1.evil" }] },
    ]);
    expect(s.tabs).toEqual([{ roleArn: ARN, service: "", region: "" }]);
  });

  it("defaults the tab group to the name, and keeps an explicit empty group", () => {
    const noGroup = { ...good };
    delete noGroup.group;
    expect(normalizeLaunchSets([noGroup])[0].group).toBe("OPS-1234");
    expect(normalizeLaunchSets([{ ...good, group: "" }])[0].group).toBe("");
  });

  it("caps tabs per set", () => {
    const tabs = Array.from({ length: LAUNCH_SET_MAX_TABS + 5 }, () => ({ roleArn: ARN }));
    expect(normalizeLaunchSets([{ ...good, tabs }])[0].tabs).toHaveLength(LAUNCH_SET_MAX_TABS);
  });

  it("counts distinct roles, not tabs", () => {
    expect(launchSetRoleCount(good)).toBe(2);
    expect(launchSetRoleCount(null)).toBe(0);
  });
});

describe("splitNameTail", () => {
  it("keeps the words that tell same-prefix names apart", () => {
    expect(splitNameTail("cutspace-landingzone-workload-payments-prod")).toEqual(["cutspace-landingzone-workload-", "payments-prod"]);
    expect(splitNameTail("cutspace-landingzone-workload-ledger-staging")).toEqual(["cutspace-landingzone-workload-", "ledger-staging"]);
    expect(splitNameTail("cutspace-landingzone-shared-network-hub")).toEqual(["cutspace-landingzone-shared-", "network-hub"]);
  });

  it("breaks words at case changes too", () => {
    expect(splitNameTail("LandingZone-PlatformReadOnly")).toEqual(["LandingZone-", "PlatformReadOnly"]);
    expect(splitNameTail("AWSReservedSSO_PlatformAdministrator_19c2")).toEqual(["AWSReservedSSO_Platform", "Administrator_19c2"]);
  });

  it("falls back to the last 12 characters", () => {
    expect(splitNameTail("abcdefghijklmnopqrstuvwxyz")).toEqual(["abcdefghijklmn", "opqrstuvwxyz"]);
    expect(splitNameTail("prefix-averyveryveryverylongfinalwordthatgoesonandon")[1]).toHaveLength(12);
  });

  it("leaves short names whole, and always splits losslessly", () => {
    expect(splitNameTail("mgmt")).toEqual(["mgmt", ""]);
    expect(splitNameTail("prod-payments-eu")).toEqual(["prod-payments-eu", ""]);
    expect(splitNameTail(null)).toEqual(["", ""]);
    for (const n of ["cutspace-landingzone-security-audit", "OrganizationAccountAccessRole", "a.b.c.d.e.f.g.h.i.j.k.l"]) {
      expect(splitNameTail(n).join("")).toBe(n);
    }
  });
});

describe("parsePageMaxWidth", () => {
  it("takes a share of the window or pixels", () => {
    expect(parsePageMaxWidth("90%")).toEqual({ text: "90%", unit: "%", value: 90 });
    expect(parsePageMaxWidth(" 75 % ")).toEqual({ text: "75%", unit: "%", value: 75 });
    expect(parsePageMaxWidth("1600px")).toEqual({ text: "1600px", unit: "px", value: 1600 });
    expect(parsePageMaxWidth("1600 PX")).toEqual({ text: "1600px", unit: "px", value: 1600 });
  });

  it("reads a bare number as a percentage up to 100, pixels above", () => {
    expect(parsePageMaxWidth("85")).toEqual({ text: "85%", unit: "%", value: 85 });
    expect(parsePageMaxWidth("1800")).toEqual({ text: "1800px", unit: "px", value: 1800 });
  });

  it("refuses widths that are too narrow, too wide or not widths", () => {
    for (const bad of ["40%", "101%", "900px", "6000px", "wide", "", null, "90vw", "-90%", "1e3"]) {
      expect(parsePageMaxWidth(bad)).toBeNull();
    }
  });
});

describe("sessionRoleKey", () => {
  it("keys a role by account and bare role name, dropping any path", () => {
    expect(sessionRoleKey("arn:aws:iam::123456789012:role/ReadOnly")).toBe("123456789012/ReadOnly");
    expect(sessionRoleKey("arn:aws:iam::123456789012:role/team/ops/Admin")).toBe("123456789012/Admin");
    expect(sessionRoleKey("arn:aws-us-gov:iam::123456789012:role/Dev")).toBe("123456789012/Dev");
    expect(sessionRoleKey("nope")).toBe("");
  });
});

describe("jump-aware sessions", () => {
  const profiles = [{ name: "Acme", hub: "900000000001", hubRole: "OrgAdmin", role: "OrgAccess" }];
  const hub = { differentiator: "900000000001-h", account: "900000000001", role: "OrgAdmin", tabs: 0, expiry: 5000, authTime: 100 };
  const jumped = { differentiator: "300000000003-j", account: "300000000003", role: "OrgAccess", tabs: 2, expiry: 4000, authTime: 200 };
  const other = { differentiator: "400000000004-o", account: "400000000004", role: "Auditor", tabs: 0, expiry: 3000, authTime: 50 };

  it("pairs a jumped session with the hub it came through", () => {
    const hubs = jumpHubs([hub, jumped, other], profiles);
    expect(hubs.get(jumped)).toBe(hub);
    expect(hubs.size).toBe(1);
  });

  it("only pairs with a hub session that started first, and the right hub role", () => {
    expect(jumpHubs([{ ...hub, authTime: 300 }, jumped], profiles).size).toBe(0);
    expect(jumpHubs([{ ...hub, role: "ReadOnly" }, jumped], profiles).size).toBe(0);
    // No hub role in the profile: any session in the hub account will do.
    expect(jumpHubs([{ ...hub, role: "ReadOnly" }, jumped], [{ ...profiles[0], hubRole: undefined }]).size).toBe(1);
  });

  it("never takes a session of a directly sign-in-able role for a jump", () => {
    // ReadOnly in 300000000003 is also a direct role, so its session is direct.
    const direct = { ...jumped, role: "OrgAccess" };
    expect(jumpHubs([hub, direct], profiles, new Set(["300000000003/OrgAccess"])).size).toBe(0);
    expect(jumpHubs([hub, direct], profiles, ["300000000003/OrgAccess"]).size).toBe(0);
    const units = groupSessions([hub, direct], profiles, new Set(["300000000003/OrgAccess"]));
    expect(units).toHaveLength(2);
    expect(units.every((u) => !u.hub)).toBe(true);
  });

  it("groups a hub and its jumped session into one unit", () => {
    const units = groupSessions([hub, jumped, other], profiles);
    expect(units).toHaveLength(2);
    const pair = units.find((u) => u.hub === hub);
    expect(pair.ids).toEqual(["900000000001-h", "300000000003-j"]);
    expect(pair.tabs).toBe(2);
    expect(pair.expiry).toBe(4000);
  });
});

describe("planSessionRoom", () => {
  const sess = (n, role, extra = {}) => ({
    differentiator: `11111111111${n}-s${n}`,
    account: `11111111111${n}`,
    role,
    tabs: 0,
    expiry: 1000 + n,
    ...extra,
  });
  const keys = (...n) => n.map((i) => `22222222222${i}/Role`);

  it("needs nothing when the set fits beside the live sessions", () => {
    expect(planSessionRoom(keys(1, 2, 3), [sess(1, "A"), sess(2, "B")], 5)).toMatchObject({ free: 3, deficit: 0 });
  });

  it("2 live + 5 new: two sessions must go", () => {
    expect(planSessionRoom(keys(1, 2, 3, 4, 5), [sess(1, "A"), sess(2, "B")], 5)).toMatchObject({ free: 3, deficit: 2 });
  });

  it("a role that's already live opens in its session and needs no slot", () => {
    const mine = { differentiator: "222222222221-x", account: "222222222221", role: "Role", tabs: 2, expiry: 1 };
    const plan = planSessionRoom(keys(1, 2, 3), [mine, sess(1, "A"), sess(2, "B"), sess(3, "C")], 5);
    expect(plan).toMatchObject({ reused: keys(1), fresh: keys(2, 3), free: 1, deficit: 1 });
    expect(plan.keep.get(keys(1)[0])).toBe(mine);
  });

  it("opens in the busiest of two sessions of one role", () => {
    const busy = { differentiator: "222222222221-a", account: "222222222221", role: "Role", tabs: 3, expiry: 1 };
    const dup = { differentiator: "222222222221-b", account: "222222222221", role: "Role", tabs: 0, expiry: 2 };
    expect(planSessionRoom(keys(1), [dup, busy], 5).keep.get(keys(1)[0])).toBe(busy);
  });

  it("copes with a missing session list", () => {
    expect(planSessionRoom(keys(1), null, 5)).toMatchObject({ free: 5, deficit: 0, reused: [], fresh: keys(1) });
  });
});

describe("normalizeChipOrder", () => {
  it("keeps known groups with unique string ids", () => {
    expect(normalizeChipOrder({ tag: ["b", "a", "b", 3, ""], org: [], nope: ["x"], env: "x" })).toEqual({ tag: ["b", "a"] });
  });
  it("returns {} for non-objects", () => {
    expect(normalizeChipOrder(null)).toEqual({});
    expect(normalizeChipOrder([])).toEqual({});
  });
});

describe("orderByIds", () => {
  const id = (x) => x;
  it("puts placed items in stored order, others after", () => {
    expect(orderByIds(["a", "b", "c", "d"], ["c", "a"], id)).toEqual(["c", "a", "b", "d"]);
  });
  it("puts unplaced items first with newFirst", () => {
    expect(orderByIds(["a", "b", "c", "d"], ["c", "a"], id, { newFirst: true })).toEqual(["b", "d", "c", "a"]);
  });
  it("ignores stored ids that no longer exist", () => {
    expect(orderByIds(["a", "b"], ["z", "b"], id)).toEqual(["b", "a"]);
  });
});

describe("bad bulk-editor lines", () => {
  it("names Account Names lines the parser would drop", () => {
    const text = "123456789012: Prod\n\n210987654321=Logs\n12345: Short\n999999999999:\nno colon";
    expect(badAccountNameLines(text)).toEqual([3, 4, 6]);
    expect(badAccountNameLines("123456789012: Prod\n  \n")).toEqual([]);
  });

  it("names Tags lines the parser would drop", () => {
    const text = "123456789012/Admin: pci, ops\n123456789012: shared\narn:aws:iam::123456789012:role/Admin: x\nops, pci";
    expect(badAccountTagLines(text)).toEqual([3, 4]);
    expect(badAccountTagLines("")).toEqual([]);
  });
});
