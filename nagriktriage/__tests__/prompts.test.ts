import { describe, it, expect } from "vitest";
import {
  normalizeTriage,
  INCIDENT_KINDS,
  TRIAGE_SCHEMA,
  SYSTEM_PROMPT,
  type TriageResult,
} from "../lib/prompts";

describe("normalizeTriage()", () => {
  const validRaw: TriageResult = {
    core_issue: "Broken water pipeline",
    target_department: "Delhi Jal Board",
    urgency_score: 8,
    formal_draft: "To the authority, I am reporting a broken pipeline...",
    next_step: "Submit draft to portal.",
    signals: ["leakage on road"],
    incident_kind: "water",
    confidence_score: 0.95,
  };

  it("extracts all fields from a well-formed model response", () => {
    const result = normalizeTriage(validRaw);
    expect(result).not.toBeNull();
    expect(result?.target_department).toBe("Delhi Jal Board");
    expect(result?.urgency_score).toBe(8);
    expect(result?.incident_kind).toBe("water");
    expect(result?.confidence_score).toBe(0.95);
  });

  it("returns null when input is null or non-object", () => {
    expect(normalizeTriage(null)).toBeNull();
    expect(normalizeTriage(undefined)).toBeNull();
    expect(normalizeTriage("string")).toBeNull();
    expect(normalizeTriage(42)).toBeNull();
    expect(normalizeTriage(true)).toBeNull();
  });

  it("returns null when a required string field is missing", () => {
    const missing: any = { ...validRaw };
    delete missing.core_issue;
    expect(normalizeTriage(missing)).toBeNull();

    const missingDept: any = { ...validRaw };
    delete missingDept.target_department;
    expect(normalizeTriage(missingDept)).toBeNull();

    const missingDraft: any = { ...validRaw };
    delete missingDraft.formal_draft;
    expect(normalizeTriage(missingDraft)).toBeNull();
  });

  it("returns null when urgency_score is missing or out of range", () => {
    const noScore: any = { ...validRaw };
    delete noScore.urgency_score;
    expect(normalizeTriage(noScore)).toBeNull();

    const tooLow: any = { ...validRaw, urgency_score: 0 };
    expect(normalizeTriage(tooLow)).toBeNull();

    const tooHigh: any = { ...validRaw, urgency_score: 11 };
    expect(normalizeTriage(tooHigh)).toBeNull();

    const notNumber: any = { ...validRaw, urgency_score: "eight" };
    expect(normalizeTriage(notNumber)).toBeNull();

    const nan: any = { ...validRaw, urgency_score: Number.NaN };
    expect(normalizeTriage(nan)).toBeNull();
  });

  it("clamps urgency_score into the 1..10 range and rounds it", () => {
    const result = normalizeTriage({ ...validRaw, urgency_score: 7.4 });
    expect(result?.urgency_score).toBe(7);

    const high = normalizeTriage({ ...validRaw, urgency_score: 9.6 });
    expect(high?.urgency_score).toBe(10);
  });

  it("falls back to incident_kind='other' for unknown values", () => {
    const result = normalizeTriage({ ...validRaw, incident_kind: "made-up-kind" });
    expect(result?.incident_kind).toBe("other");

    const missing = normalizeTriage({
      ...validRaw,
      incident_kind: undefined as unknown as string,
    });
    expect(missing?.incident_kind).toBe("other");
  });

  it("normalizes incident_kind casing/whitespace", () => {
    const result = normalizeTriage({ ...validRaw, incident_kind: "  WATER  " });
    expect(result?.incident_kind).toBe("water");
  });

  it("accepts every documented IncidentKind", () => {
    for (const kind of INCIDENT_KINDS) {
      const result = normalizeTriage({ ...validRaw, incident_kind: kind });
      expect(result?.incident_kind).toBe(kind);
    }
  });

  it("falls back to default confidence_score (0.7) when missing/invalid", () => {
    const missing = normalizeTriage({
      ...validRaw,
      confidence_score: undefined as unknown as number,
    });
    expect(missing?.confidence_score).toBe(0.7);

    const neg = normalizeTriage({ ...validRaw, confidence_score: -0.1 });
    expect(neg?.confidence_score).toBe(0.7);

    const over = normalizeTriage({ ...validRaw, confidence_score: 1.5 });
    expect(over?.confidence_score).toBe(0.7);
  });

  it("defaults signals to [] when missing or not an array", () => {
    const missing = normalizeTriage({
      ...validRaw,
      signals: undefined as unknown as string[],
    });
    expect(missing?.signals).toEqual([]);

    const wrongType = normalizeTriage({
      ...validRaw,
      signals: "not an array" as unknown as string[],
    });
    expect(wrongType?.signals).toEqual([]);
  });

  it("filters non-string signals, trims whitespace, and caps the list at 6", () => {
    const raw: any = {
      ...validRaw,
      signals: [
        "  valid signal  ",
        "",
        "another",
        42 as any,
        null as any,
        "x",
        "y",
        "z",
        "w",
      ],
    };
    const result = normalizeTriage(raw);
    expect(result?.signals.length).toBeLessThanOrEqual(6);
    expect(result?.signals).toContain("valid signal");
    expect(result?.signals).toContain("another");
  });

  it("trims string fields of leading/trailing whitespace", () => {
    const result = normalizeTriage({
      ...validRaw,
      core_issue: "  Burst main  ",
      target_department: "  Jal Board  ",
    });
    expect(result?.core_issue).toBe("Burst main");
    expect(result?.target_department).toBe("Jal Board");
  });
});

describe("TRIAGE_SCHEMA", () => {
  it("declares every required field", () => {
    expect(TRIAGE_SCHEMA.required).toEqual(
      expect.arrayContaining([
        "core_issue",
        "target_department",
        "urgency_score",
        "formal_draft",
        "next_step",
        "signals",
        "incident_kind",
        "confidence_score",
      ])
    );
  });

  it("constrains urgency_score to 1..10 integer", () => {
    const score = TRIAGE_SCHEMA.properties.urgency_score as Record<string, unknown>;
    expect(score.minimum).toBe(1);
    expect(score.maximum).toBe(10);
    expect(score.type).toBe("integer");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("mentions JSON-only output requirement", () => {
    expect(SYSTEM_PROMPT).toMatch(/JSON/i);
  });

  it("lists allowed incident kinds", () => {
    expect(SYSTEM_PROMPT).toContain("water");
    expect(SYSTEM_PROMPT).toContain("power");
    expect(SYSTEM_PROMPT).toContain("fire");
  });
});