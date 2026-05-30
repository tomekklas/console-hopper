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
