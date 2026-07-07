// =============================================================================
//  Tests for lib/history.ts — duplicate detection & ticket ID generation.
// =============================================================================
// Note: useHistory() is a React hook that needs React Testing Library.
// These tests cover the pure functions only.

import { describe, it, expect } from "vitest";
import { findDuplicates, makeTicketId, type HistoryEntry } from "@/lib/history";

// ---------------------------------------------------------------------------
//  makeTicketId
// ---------------------------------------------------------------------------
describe("makeTicketId", () => {
  it("starts with 'NT-'", () => {
    expect(makeTicketId()).toMatch(/^NT-/);
  });

  it("includes the city code when provided", () => {
    const id = makeTicketId("delhi");
    expect(id).toMatch(/^NT-DEL-/);
  });

  it("uses 'IND' when no city is provided", () => {
    const id = makeTicketId();
    expect(id).toMatch(/^NT-IND-/);
  });

  it("includes the current year", () => {
    const year = new Date().getFullYear().toString();
    expect(makeTicketId()).toContain(year);
  });

  it("has a 5-digit random number suffix", () => {
    const id = makeTicketId();
    // NT-XXX-YYYY-NNNNN
    const parts = id.split("-");
    expect(parts.length).toBe(4);
    expect(parts[3]).toHaveLength(5);
    expect(Number(parts[3])).toBeGreaterThanOrEqual(10000);
    expect(Number(parts[3])).toBeLessThanOrEqual(99999);
  });

  it("truncates city code to 3 chars uppercase", () => {
    expect(makeTicketId("bengaluru")).toMatch(/^NT-BEN-/);
  });

  it("generates different IDs on each call (probabilistic)", () => {
    const ids = new Set(Array.from({ length: 50 }, () => makeTicketId()));
    // With 90000 possible suffixes, 50 calls should give unique values.
    expect(ids.size).toBeGreaterThan(40);
  });
});

// ---------------------------------------------------------------------------
//  findDuplicates — Jaccard-based duplicate detection
// ---------------------------------------------------------------------------
describe("findDuplicates", () => {
  const makeEntry = (
    core_issue: string,
    incident_kind: HistoryEntry["incident_kind"]
  ): Pick<HistoryEntry, "core_issue" | "incident_kind"> => ({
    core_issue,
    incident_kind,
  });

  const existing: HistoryEntry[] = [
    {
      id: "1", createdAt: 1, ticketId: "NT-DEL-2026-10000",
      originalText: "", hadImage: false,
      core_issue: "burst water pipe on main road",
      incident_kind: "water",
      target_department: "Jal Board", urgency_score: 8,
      formal_draft: "Dear sir,", next_step: "Call helpline",
      signals: [], confidence_score: 0.9,
    },
    {
      id: "2", createdAt: 2, ticketId: "NT-DEL-2026-10001",
      originalText: "", hadImage: false,
      core_issue: "streetlight broken at night",
      incident_kind: "streetlight",
      target_department: "MCD", urgency_score: 4,
      formal_draft: "Dear sir,", next_step: "File complaint",
      signals: [], confidence_score: 0.8,
    },
    {
      id: "3", createdAt: 3, ticketId: "NT-DEL-2026-10002",
      originalText: "", hadImage: false,
      core_issue: "water supply disruption for 3 days",
      incident_kind: "water",
      target_department: "Jal Board", urgency_score: 9,
      formal_draft: "Dear sir,", next_step: "Call helpline",
      signals: [], confidence_score: 0.95,
    },
  ];

  it("finds duplicates with same incident_kind and high overlap", () => {
    const newEntry = makeEntry("burst water pipe on main road today", "water");
    const dupes = findDuplicates(newEntry, existing);
    expect(dupes).toHaveLength(1);
    expect(dupes[0].id).toBe("1");
  });

  it("does not match across different incident_kind", () => {
    const newEntry = makeEntry("burst water pipe on main road", "sanitation");
    const dupes = findDuplicates(newEntry, existing);
    expect(dupes).toHaveLength(0);
  });

  it("finds duplicates for loosely similar water complaints", () => {
    const newEntry = makeEntry("water supply disruption 3 days area", "water");
    const dupes = findDuplicates(newEntry, existing);
    // Should match "water supply disruption for 3 days" (id: 3)
    expect(dupes.length).toBeGreaterThanOrEqual(1);
  });

  it("does not match completely different complaints", () => {
    const newEntry = makeEntry("garbage dump near park", "water");
    const dupes = findDuplicates(newEntry, existing);
    expect(dupes).toHaveLength(0);
  });

  it("returns empty array when no existing entries", () => {
    const newEntry = makeEntry("burst water pipe", "water");
    expect(findDuplicates(newEntry, [])).toHaveLength(0);
  });

  it("caps results at 4", () => {
    // Create many similar entries
    const manyExisting: HistoryEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), createdAt: i, ticketId: `NT-DEL-2026-1000${i}`,
      originalText: "", hadImage: false,
      core_issue: "water pipe burst flooding street",
      incident_kind: "water" as const,
      target_department: "Jal Board", urgency_score: 8,
      formal_draft: "Dear sir,", next_step: "Call",
      signals: [], confidence_score: 0.9,
    }));
    const newEntry = makeEntry("water pipe burst flooding street", "water");
    const dupes = findDuplicates(newEntry, manyExisting);
    expect(dupes.length).toBeLessThanOrEqual(4);
  });

  it("returns an empty array for short words that are filtered out", () => {
    const newEntry = makeEntry("a an the", "water");
    const dupes = findDuplicates(newEntry, existing);
    // Short words (<3 chars) are filtered in the tokenizer
    expect(dupes).toHaveLength(0);
  });
});
