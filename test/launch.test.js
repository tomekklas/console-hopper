import { describe, it, expect } from "vitest";
import {
  isConsoleRelay,
  isSamlAction,
  sanitizeLaunchFields,
} from "../src/shared/launch.js";

const ARN = "arn:aws:iam::123456789012:role/ReadOnly";
const RELAY = "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1#hop=abc";

const fields = (overrides = {}) => {
  const base = {
    SAMLResponse: "PHNhbWxwOlJlc3BvbnNlPg==",
    RelayState: RELAY,
    roleIndex: ARN,
    name: "",
    portal: "",
  };
  return Object.entries({ ...base, ...overrides }).filter(([, v]) => v !== undefined);
};

describe("isSamlAction", () => {
  it("accepts the global and regional SAML endpoints", () => {
    expect(isSamlAction("https://signin.aws.amazon.com/saml")).toBe(true);
    expect(isSamlAction("https://eu-central-1.signin.aws.amazon.com/saml")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isSamlAction("http://signin.aws.amazon.com/saml")).toBe(false);
    expect(isSamlAction("https://signin.aws.amazon.com.evil.example/saml")).toBe(false);
    expect(isSamlAction("https://evil.example/signin.aws.amazon.com/saml")).toBe(false);
    expect(isSamlAction("https://signin.aws.amazon.com/saml?x=1")).toBe(false);
    expect(isSamlAction("")).toBe(false);
  });
});

describe("isConsoleRelay", () => {
  it("accepts AWS console hosts", () => {
    expect(isConsoleRelay(RELAY)).toBe(true);
    expect(isConsoleRelay("https://console.aws.amazon.com/")).toBe(true);
    expect(isConsoleRelay("https://123456789012-abcd.eu-west-1.console.aws.amazon.com/s3/")).toBe(true);
  });

  it("rejects other hosts and schemes", () => {
    expect(isConsoleRelay("https://console.aws.amazon.com.evil.example/")).toBe(false);
    expect(isConsoleRelay("https://evil.example/?console.aws.amazon.com")).toBe(false);
    expect(isConsoleRelay("http://eu-central-1.console.aws.amazon.com/")).toBe(false);
    expect(isConsoleRelay("javascript:alert(1)")).toBe(false);
    expect(isConsoleRelay("not a url")).toBe(false);
  });
});

describe("sanitizeLaunchFields", () => {
  it("passes a well-formed tab through unchanged", () => {
    expect(sanitizeLaunchFields(fields())).toEqual(fields());
  });

  it("needs exactly one SAML response, role and RelayState", () => {
    expect(sanitizeLaunchFields(fields({ SAMLResponse: undefined }))).toBeNull();
    expect(sanitizeLaunchFields(fields({ roleIndex: undefined }))).toBeNull();
    expect(sanitizeLaunchFields(fields({ RelayState: undefined }))).toBeNull();
    expect(sanitizeLaunchFields([...fields(), ["roleIndex", ARN]])).toBeNull();
  });

  it("refuses a RelayState that leaves the AWS console", () => {
    expect(sanitizeLaunchFields(fields({ RelayState: "https://evil.example/" }))).toBeNull();
  });

  it("refuses a roleIndex that isn't an IAM role ARN", () => {
    expect(sanitizeLaunchFields(fields({ roleIndex: "ReadOnly" }))).toBeNull();
  });

  it("refuses malformed pairs and odd field names", () => {
    expect(sanitizeLaunchFields("nope")).toBeNull();
    expect(sanitizeLaunchFields([...fields(), ["a", 1]])).toBeNull();
    expect(sanitizeLaunchFields([...fields(), ["bad name", "x"]])).toBeNull();
    expect(sanitizeLaunchFields([...fields(), ["only-one"]])).toBeNull();
  });
});
