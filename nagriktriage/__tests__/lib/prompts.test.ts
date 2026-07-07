// =============================================================================
//  Tests for lib/prompts.ts — the AI pipeline's single source of truth.
// =============================================================================
import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  TRIAGE_SCHEMA,
  INCIDENT_KINDS,
  normalizeTriage,
  type TriageResult,
  type IncidentKind,
} from "@/lib/prompts";

// ---------------------------------------------------------------------------
//  SYSTEM_PROMPT
// ---------------------------------------------------------------------------
describe("SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it("mentions key instructions", () => {
    expect(SYSTEM_PROMPT).toContain("JSON");
    expect(SYSTEM_PROMPT).toContain("urgency_score");
    expect(SYSTEM_PROMPT).toContain("incident_kind");
    expect(SYSTEM_PROMPT).toContain("confidence_score");
    expect(SYSTEM_PROMPT).toContain("signals");
    expect(SYSTEM_PROMPT).toContain("formal_draft");
    expect(SYSTEM_PROMPT).toContain("next_step");
  });
});

// ---------------------------------------------------------------------------
//  TRIAGE_SCHEMA
// ---------------------------------------------------------------------------
describe("TRIAGE_SCHEMA", () => {
  it("has the correct type", () => {
    expect(TRIAGE_SCHEMA.type).toBe("object");
  });

  it("defines all required fields", () => {
    const required = [
      "core_issue",
      "target_department",
      "urgency_score",
      "formal_draft",
      "next_step",
      "signals",
      "incident_kind",
      "confidence_score",
    ];
    expect(TRIAGE_SCHEMA.required).toEqual(required);
  });

  it("has properties for every required field", () => {
    for (const key of TRIAGE_SCHEMA.required) {
      expect(TRIAGE_SCHEMA.properties).toHaveProperty(key);
    }
  });

  it("urgency_score is constrained to 1-10", () => {
    const us = TRIAGE_SCHEMA.properties.urgency_score;
    expect(us.type).toBe("integer");
    expect(us.minimum).toBe(1);
    expect(us.maximum).toBe(10);
  });

  it("signals is an array of strings", () => {
    expect(TRIAGE_SCHEMA.properties.signals.type).toBe("array");
    expect(TRIAGE_SCHEMA.properties.signals.items.type).toBe("string");
  });

  it("confidence_score is a number", () => {
    expect(TRIAGE_SCHEMA.properties.confidence_score.type).toBe("number");
  });
});

// ---------------------------------------------------------------------------
//  INCIDENT_KINDS
// ---------------------------------------------------------------------------
describe("INCIDENT_KINDS", () => {
  it("contains exactly the expected values", () => {
    expect(INCIDENT_KINDS).toEqual([
      "water",
      "power",
      "sanitation",
      "roads",
      "streetlight",
      "health",
      "fire",
      "police",
      "other",
    ]);
  });

  it("has 9 entries", () => {
    expect(INCIDENT_KINDS).toHaveLength(9);
  });

  it("each kind is a valid IncidentKind type", () => {
    const valid: IncidentKind[] = [
      "water", "power", "sanitation", "roads", "streetlight",
      "health", "fire", "police", "other",
    ];
    INCIDENT_KINDS.forEach((k) => {
      expect(valid).toContain(k);
    });
  });
});

// ---------------------------------------------------------------------------
//  normalizeTriage() — the runtime guard
// ---------------------------------------------------------------------------
describe("normalizeTriage", () => {
  // A valid, complete triage result.
  const validInput: TriageResult = {
    core_issue: "Burst water pipe",
    target_department: "Jal Board",
    urgency_score: 8,
    formal_draft: "To the Executive Engineer...",
    next_step: "Call 1916 helpline",
    signals: ["burst pipe", "flooding"],
    incident_kind: "water",
    confidence_score: 0.92,
  };

  // --- happy path ---
  it("returns a valid TriageResult for correct input", () => {
    const result = normalizeTriage(validInput);
    expect(result).not.toBeNull();
    expect(result!.core_issue).toBe("Burst water pipe");
    expect(result!.target_department).toBe("Jal Board");
    expect(result!.urgency_score).toBe(8);
    expect(result!.formal_draft).toBe("To the Executive Engineer...");
    expect(result!.next_step).toBe("Call 1916 helpline");
    expect(result!.signals).toEqual(["burst pipe", "flooding"]);
    expect(result!.incident_kind).toBe("water");
    expect(result!.confidence_score).toBe(0.92);
  });

  // --- null / undefined / non-object ---
  it("returns null for null", () => {
    expect(normalizeTriage(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(normalizeTriage(undefined)).toBeNull();
  });

  it("returns null for a string", () => {
    expect(normalizeTriage("hello")).toBeNull();
  });

  it("returns null for a number", () => {
    expect(normalizeTriage(42)).toBeNull();
  });

  it("returns null for an array", () => {
    expect(normalizeTriage([1, 2, 3])).toBeNull();
  });

  // --- missing required fields ---
  it("returns null when core_issue is missing", () => {
    const { core_issue, ...rest } = validInput;
    expect(normalizeTriage(rest)).toBeNull();
  });

  it("returns null when target_department is missing", () => {
    const { target_department, ...rest } = validInput;
    expect(normalizeTriage(rest)).toBeNull();
  });

  it("returns null when urgency_score is missing", () => {
    const { urgency_score, ...rest } = validInput;
    expect(normalizeTriage(rest)).toBeNull();
  });

  it("returns null when formal_draft is missing", () => {
    const { formal_draft, ...rest } = validInput;
    expect(normalizeTriage(rest)).toBeNull();
  });

  it("returns null when next_step is missing", () => {
    const { next_step, ...rest } = validInput;
    expect(normalizeTriage(rest)).toBeNull();
  });

  // --- urgency_score bounds ---
  it("returns null when urgency_score is 0 (below min)", () => {
    expect(normalizeTriage({ ...validInput, urgency_score: 0 })).toBeNull();
  });

  it("returns null when urgency_score is 11 (above max)", () => {
    expect(normalizeTriage({ ...validInput, urgency_score: 11 })).toBeNull();
  });

  it("returns null when urgency_score is NaN", () => {
    expect(normalizeTriage({ ...validInput, urgency_score: NaN })).toBeNull();
  });

  it("returns null when urgency_score is Infinity", () => {
    expect(normalizeTriage({ ...validInput, urgency_score: Infinity })).toBeNull();
  });

  it("accepts urgency_score of 1 (min boundary)", () => {
    const result = normalizeTriage({ ...validInput, urgency_score: 1 });
    expect(result).not.toBeNull();
    expect(result!.urgency_score).toBe(1);
  });

  it("accepts urgency_score of 10 (max boundary)", () => {
    const result = normalizeTriage({ ...validInput, urgency_score: 10 });
    expect(result).not.toBeNull();
    expect(result!.urgency_score).toBe(10);
  });

  it("rounds fractional urgency_score", () => {
    const result = normalizeTriage({ ...validInput, urgency_score: 7.7 });
    expect(result).not.toBeNull();
    expect(result!.urgency_score).toBe(8);
  });

  it("clamps urgency_score to range (e.g. 0.5 → null)", () => {
    expect(normalizeTriage({ ...validInput, urgency_score: 0.5 })).toBeNull();
  });

  // --- signals ---
  it("defaults signals to empty array when missing", () => {
    const { signals, ...rest } = validInput;
    const result = normalizeTriage(rest);
    expect(result).not.toBeNull();
    expect(result!.signals).toEqual([]);
  });

  it("filters non-string signals", () => {
    const result = normalizeTriage({
      ...validInput,
      signals: ["ok", 42, null, { bad: true }, "good"] as any,
    });
    expect(result).not.toBeNull();
    expect(result!.signals).toEqual(["ok", "good"]);
  });

  it("trims signal strings", () => {
    const result = normalizeTriage({
      ...validInput,
      signals: ["  padded  "],
    });
    expect(result!.signals).toEqual(["padded"]);
  });

  it("filters empty string signals", () => {
    const result = normalizeTriage({
      ...validInput,
      signals: ["valid", "", "   ", "also valid"],
    });
    expect(result!.signals).toEqual(["valid", "also valid"]);
  });

  it("caps signals at 6 entries", () => {
    const result = normalizeTriage({
      ...validInput,
      signals: ["a", "b", "c", "d", "e", "f", "g", "h"],
    });
    expect(result!.signals).toHaveLength(6);
    expect(result!.signals).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  // --- incident_kind ---
  it("defaults incident_kind to 'other' when missing", () => {
    const { incident_kind, ...rest } = validInput;
    const result = normalizeTriage(rest);
    expect(result).not.toBeNull();
    expect(result!.incident_kind).toBe("other");
  });

  it("maps invalid incident_kind to 'other'", () => {
    const result = normalizeTriage({ ...validInput, incident_kind: "spaceship" });
    expect(result!.incident_kind).toBe("other");
  });

  it("normalizes incident_kind case (WATER → water)", () => {
    const result = normalizeTriage({ ...validInput, incident_kind: "WATER" });
    expect(result!.incident_kind).toBe("water");
  });

  it("accepts all valid incident kinds", () => {
    for (const kind of INCIDENT_KINDS) {
      const result = normalizeTriage({ ...validInput, incident_kind: kind });
      expect(result).not.toBeNull();
      expect(result!.incident_kind).toBe(kind);
    }
  });

  // --- confidence_score ---
  it("defaults confidence_score to 0.7 when missing", () => {
    const { confidence_score, ...rest } = validInput;
    const result = normalizeTriage(rest);
    expect(result!.confidence_score).toBe(0.7);
  });

  it("defaults confidence_score to 0.7 for NaN", () => {
    const result = normalizeTriage({ ...validInput, confidence_score: NaN });
    expect(result!.confidence_score).toBe(0.7);
  });

  it("accepts confidence_score of 0", () => {
    const result = normalizeTriage({ ...validInput, confidence_score: 0 });
    expect(result!.confidence_score).toBe(0);
  });

  it("accepts confidence_score of 1", () => {
    const result = normalizeTriage({ ...validInput, confidence_score: 1 });
    expect(result!.confidence_score).toBe(1);
  });

  it("defaults confidence_score for out-of-range (1.5)", () => {
    const result = normalizeTriage({ ...validInput, confidence_score: 1.5 });
    expect(result!.confidence_score).toBe(0.7);
  });

  it("defaults confidence_score for negative (-0.1)", () => {
    const result = normalizeTriage({ ...validInput, confidence_score: -0.1 });
    expect(result!.confidence_score).toBe(0.7);
  });

  // --- trimming ---
  it("trims whitespace from string fields", () => {
    const result = normalizeTriage({
      ...validInput,
      core_issue: "  padded  ",
      target_department: "  dept  ",
      formal_draft: "  draft  ",
      next_step: "  step  ",
    });
    expect(result!.core_issue).toBe("padded");
    expect(result!.target_department).toBe("dept");
    expect(result!.formal_draft).toBe("draft");
    expect(result!.next_step).toBe("step");
  });

  // --- extra fields ignored ---
  it("ignores extra fields not in the schema", () => {
    const input = {
      ...validInput,
      extra_field: "should be ignored",
      another: 42,
    };
    const result = normalizeTriage(input);
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("extra_field");
    expect(result).not.toHaveProperty("another");
  });

  // --- values that are null in required fields ---
  it("returns null when core_issue is explicitly null", () => {
    expect(normalizeTriage({ ...validInput, core_issue: null })).toBeNull();
  });

  it("returns null when target_department is explicitly undefined", () => {
    expect(normalizeTriage({ ...validInput, target_department: undefined })).toBeNull();
  });

  // --- string coercion ---
  it("coerces numeric fields to strings", () => {
    const result = normalizeTriage({
      ...validInput,
      core_issue: 123 as any,
    });
    expect(result).not.toBeNull();
    expect(result!.core_issue).toBe("123");
  });
});
