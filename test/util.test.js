import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizeInput,
  parseAccountInfo,
  matchesAnyPattern,
  matchesRolePatterns,
  parseRegionLines,
  formatRegionLines,
  normalizeRegionList,
  parseAccountNameLines,
  formatAccountNameLines,
  normalizeAccountNames,
  parseAssumeProfileLines,
  formatAssumeProfileLines,
  normalizeAssumeProfiles,
  normalizeJumpRecents,
  normalizeTagList,
  parseAccountTagLines,
  formatAccountTagLines,
  normalizeAccountTags,
  searchMatches,
  parseQuery,
  matchesQuery,
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
