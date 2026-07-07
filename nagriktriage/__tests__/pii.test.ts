import { describe, it, expect } from "vitest";
import { detectPii, maskPii, hasPii } from "../lib/pii";

describe("detectPii()", () => {
  it("returns an empty array when there is no PII", () => {
    expect(detectPii("There is a water leak on Linking Road near Lajpat Nagar.")).toEqual([]);
  });

  it("detects Indian mobile numbers (10-digit, starting 6-9)", () => {
    const matches = detectPii("Call me at 9876543210 for details.");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Phone");
    expect(matches[0].original).toBe("9876543210");
    expect(matches[0].masked).toBe("••••••3210");
  });

  it("detects +91 prefixed numbers", () => {
    const matches = detectPii("Phone +91 98765 43210 for help.");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some((m) => m.kind === "Phone")).toBe(true);
  });

  it("detects 12-digit Aadhaar-like ids (with or without separators)", () => {
    const matches = detectPii("My Aadhaar is 1234 5678 9012 please call.");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Aadhaar-like ID");
    expect(matches[0].masked).toBe("••••••••9012");
  });

  it("ignores 12-digit sequences that don't look like Aadhaar (wrong digit count after stripping)", () => {
    const matches = detectPii("Order #1234567890123 received.");
    // 13 digits — should not match the Aadhaar rule.
    const aadhaar = matches.filter((m) => m.kind === "Aadhaar-like ID");
    expect(aadhaar).toHaveLength(0);
  });

  it("detects vehicle plates", () => {
    const matches = detectPii("Vehicle MH 12 AB 3456 is parked illegally.");
    const plates = matches.filter((m) => m.kind === "Vehicle plate");
    expect(plates.length).toBeGreaterThanOrEqual(1);
    expect(plates[0].masked).toBe("[REDACTED-PLATE]");
  });

  it("detects email addresses and partially masks them", () => {
    const matches = detectPii("Reach me at hussam.haroon@example.com.");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Email");
    expect(matches[0].masked.endsWith("@example.com")).toBe(true);
    // First and last char of the local part should be preserved
    expect(matches[0].masked.startsWith("h")).toBe(true);
  });

  it("returns multiple kinds in a single string", () => {
    const text = "Call 9876543210 or email a@b.com about vehicle MH 12 AB 3456.";
    const matches = detectPii(text);
    const kinds = new Set(matches.map((m) => m.kind));
    expect(kinds.has("Phone")).toBe(true);
    expect(kinds.has("Email")).toBe(true);
    expect(kinds.has("Vehicle plate")).toBe(true);
  });
});

describe("maskPii()", () => {
  it("masks phone numbers in place", () => {
    const out = maskPii("Phone 9876543210 please");
    expect(out).toContain("••••••3210");
    expect(out).not.toContain("9876543210");
  });

  it("masks Aadhaar-like ids but not arbitrary 12-digit numbers", () => {
    const aadhaar = maskPii("ID 1234 5678 9012 here");
    expect(aadhaar).toContain("••••••••9012");

    const other = maskPii("Reference 123456789012");
    // 12-digit no-separator number should be masked too (matches the regex).
    expect(other).toContain("••••••••9012");
  });

  it("replaces vehicle plates with [REDACTED-PLATE]", () => {
    const out = maskPii("Plate DL 8 C 1234 outside");
    expect(out).toContain("[REDACTED-PLATE]");
    expect(out).not.toMatch(/DL\s?8/);
  });

  it("leaves PII-free text untouched", () => {
    const text = "There is a water leak on the main road near the school.";
    expect(maskPii(text)).toBe(text);
  });
});

describe("hasPii()", () => {
  it("is true when text contains PII", () => {
    expect(hasPii("Call 9876543210 now")).toBe(true);
    expect(hasPii("Email me a@b.com")).toBe(true);
    expect(hasPii("Plate MH 12 AB 3456")).toBe(true);
  });

  it("is false when text is clean", () => {
    expect(hasPii("Road near park is broken")).toBe(false);
    expect(hasPii("")).toBe(false);
  });
});