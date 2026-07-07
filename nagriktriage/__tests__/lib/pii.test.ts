// =============================================================================
//  Tests for lib/pii.ts — client-side PII detection & masking.
// =============================================================================
import { describe, it, expect } from "vitest";
import { detectPii, maskPii, hasPii } from "@/lib/pii";

// ---------------------------------------------------------------------------
//  Phone number detection
// ---------------------------------------------------------------------------
describe("detectPii — Phone numbers", () => {
  it("detects a 10-digit Indian phone number", () => {
    const matches = detectPii("Call me at 9876543210");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Phone");
    expect(matches[0].original).toBe("9876543210");
  });

  it("detects phone with +91 prefix", () => {
    const matches = detectPii("My number is +91-9876543210");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Phone");
    expect(matches[0].original).toContain("9876543210");
  });

  it("detects phone with spaces around +91", () => {
    const matches = detectPii("Phone: +91 9876543210");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Phone");
  });

  it("detects multiple phone numbers", () => {
    const matches = detectPii("Call 9876543210 or 8765432109");
    expect(matches).toHaveLength(2);
  });

  it("masks phone leaving last 4 digits visible", () => {
    const matches = detectPii("9876543210");
    expect(matches[0].masked).toBe("•••••43210");
  });

  it("does not detect numbers starting with 0-5 (not Indian mobile)", () => {
    const matches = detectPii("Number is 1234567890");
    expect(matches).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
//  Aadhaar detection
// ---------------------------------------------------------------------------
describe("detectPii — Aadhaar-like IDs", () => {
  it("detects 12-digit Aadhaar number", () => {
    const matches = detectPii("Aadhaar: 1234 5678 9012");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Aadhaar-like ID");
  });

  it("detects Aadhaar with dashes", () => {
    const matches = detectPii("ID: 1234-5678-9012");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Aadhaar-like ID");
  });

  it("detects Aadhaar without separators", () => {
    const matches = detectPii("Aadhaar: 123456789012");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Aadhaar-like ID");
  });

  it("masks Aadhaar leaving last 4 digits", () => {
    const matches = detectPii("1234 5678 9012");
    expect(matches[0].masked).toBe("••••••••9012");
  });

  it("does not detect Aadhaar-like if digit count ≠ 12", () => {
    const matches = detectPii("Number: 1234 5678 901"); // only 11 digits
    expect(matches).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
//  Vehicle plate detection
// ---------------------------------------------------------------------------
describe("detectPii — Vehicle plates", () => {
  it("detects Indian vehicle plate format", () => {
    const matches = detectPii("Car: MH 12 AB 1234");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Vehicle plate");
  });

  it("detects plate without spaces", () => {
    const matches = detectPii("MH12AB1234 spotted");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Vehicle plate");
  });

  it("masks vehicle plate as [REDACTED-PLATE]", () => {
    const matches = detectPii("MH 12 AB 1234");
    expect(matches[0].masked).toBe("[REDACTED-PLATE]");
  });
});

// ---------------------------------------------------------------------------
//  Email detection
// ---------------------------------------------------------------------------
describe("detectPii — Email addresses", () => {
  it("detects an email address", () => {
    const matches = detectPii("Email: citizen@example.com");
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("Email");
    expect(matches[0].original).toBe("citizen@example.com");
  });

  it("masks email preserving domain", () => {
    const matches = detectPii("citizen@example.com");
    expect(matches[0].masked).toContain("@example.com");
    expect(matches[0].masked).not.toContain("citizen");
  });

  it("handles short email (2-char local part)", () => {
    const matches = detectPii("ab@example.com");
    expect(matches).toHaveLength(1);
    expect(matches[0].masked).toBe("••@example.com");
  });

  it("detects multiple emails", () => {
    const matches = detectPii("From a@test.com to b@example.com");
    expect(matches).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
//  hasPii
// ---------------------------------------------------------------------------
describe("hasPii", () => {
  it("returns true when PII is present", () => {
    expect(hasPii("Call 9876543210 now")).toBe(true);
  });

  it("returns false when no PII is present", () => {
    expect(hasPii("There is a pothole on the road")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasPii("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  maskPii
// ---------------------------------------------------------------------------
describe("maskPii", () => {
  it("masks phone numbers in text", () => {
    const result = maskPii("Call 9876543210 for help");
    expect(result).not.toContain("9876543210");
    expect(result).toContain("•••••43210");
  });

  it("masks Aadhaar in text", () => {
    const result = maskPii("Aadhaar 1234 5678 9012 is mine");
    expect(result).not.toContain("1234 5678 9012");
    expect(result).toContain("••••••••9012");
  });

  it("masks vehicle plates in text", () => {
    const result = maskPii("Vehicle MH 12 AB 1234 was seen");
    expect(result).not.toContain("MH 12 AB 1234");
    expect(result).toContain("[REDACTED-PLATE]");
  });

  it("returns text unchanged when no PII", () => {
    const text = "No personal info here, just a complaint about roads.";
    expect(maskPii(text)).toBe(text);
  });

  it("masks multiple PII types in one text", () => {
    const text = "Call 9876543210 or email rajesh@example.com about MH 12 AB 1234";
    const result = maskPii(text);
    expect(result).not.toContain("9876543210");
    expect(result).not.toContain("rajesh@example.com");
    expect(result).not.toContain("MH 12 AB 1234");
  });
});
