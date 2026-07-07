import { describe, it, expect } from "vitest";
import {
  findDuplicates,
  makeTicketId,
  type HistoryEntry,
} from "../lib/history";

function makeEntry(partial: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "test-" + Math.random().toString(36).slice(2),
    createdAt: Date.now(),
    ticketId: "NT-IND-2026-12345",
    cityId: "delhi",
    originalText: "Burst pipe",
    hadImage: false,
    core_issue: "Burst water main",
    target_department: "Delhi Jal Board",
    urgency_score: 9,
    formal_draft: "draft",
    next_step: "call helpline",
    signals: ["leak"],
    incident_kind: "water",
    confidence_score: 0.9,
    ...partial,
  };
}

describe("findDuplicates()", () => {
  it("returns matches with the same incident_kind", () => {
    const existing: HistoryEntry[] = [
      makeEntry({ core_issue: "Burst water main near park" }),
    ];
    const found = findDuplicates(
      { core_issue: "Burst water main leaking", incident_kind: "water" },
      existing
    );
    expect(found).toHaveLength(1);
  });

  it("skips entries from a different incident_kind", () => {
    const existing: HistoryEntry[] = [
      makeEntry({
        core_issue: "Burst water main near park",
        incident_kind: "power",
      }),
    ];
    const found = findDuplicates(
      { core_issue: "Burst water main leaking", incident_kind: "water" },
      existing
    );
    expect(found).toHaveLength(0);
  });

  it("requires >0.4 Jaccard similarity on core_issue", () => {
    const existing: HistoryEntry[] = [
      makeEntry({ core_issue: "Burst water pipe flooding road" }),
      makeEntry({ core_issue: "Garbage pile near park attracting dogs" }),
    ];
    const found = findDuplicates(
      { core_issue: "Burst pipe flooding street", incident_kind: "water" },
      existing
    );
    // Only the water one matches; the garbage one is filtered by kind + low overlap.
    expect(found).toHaveLength(1);
    expect(found[0].core_issue).toContain("Burst water pipe");
  });

  it("returns at most 4 results", () => {
    const existing: HistoryEntry[] = Array.from({ length: 10 }, () =>
      makeEntry({ core_issue: "Burst water main flooding road" })
    );
    const found = findDuplicates(
      { core_issue: "Burst water main flooding road", incident_kind: "water" },
      existing
    );
    expect(found.length).toBeLessThanOrEqual(4);
  });

  it("ignores very short tokens (length <= 2) when computing similarity", () => {
    // Short tokens like "of", "in", "is" should be ignored, so two texts
    // sharing only stopwords still count as dissimilar.
    const existing: HistoryEntry[] = [
      makeEntry({ core_issue: "of in is at on" }),
    ];
    const found = findDuplicates(
      { core_issue: "of in is at on to be", incident_kind: "water" },
      existing
    );
    expect(found).toHaveLength(0);
  });

  it("treats puncutation as whitespace for tokenization", () => {
    const existing: HistoryEntry[] = [
      makeEntry({ core_issue: "Burst water-main, flooding road!" }),
    ];
    const found = findDuplicates(
      { core_issue: "Burst watermain flooding road", incident_kind: "water" },
      existing
    );
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty array for empty existing list", () => {
    expect(
      findDuplicates(
        { core_issue: "Burst water main", incident_kind: "water" },
        []
      )
    ).toEqual([]);
  });
});

describe("makeTicketId()", () => {
  it("returns an NT-CITY-YEAR-NNNNN id", () => {
    const id = makeTicketId("delhi");
    expect(id).toMatch(/^NT-DEL-\d{4}-\d{5}$/);
  });

  it("defaults to IND when no cityId is supplied", () => {
    const id = makeTicketId();
    expect(id).toMatch(/^NT-IND-\d{4}-\d{5}$/);
  });

  it("truncates long cityIds to 3 characters", () => {
    const id = makeTicketId("longcityname");
    expect(id).toMatch(/^NT-LON-\d{4}-\d{5}$/);
  });

  it("uppercases city ids", () => {
    const id = makeTicketId("mumbai");
    expect(id.startsWith("NT-MUM-")).toBe(true);
  });

  it("produces a unique-ish 5-digit numeric suffix", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 25; i++) ids.add(makeTicketId("delhi"));
    // Almost always >1 unique, but at minimum the format is correct.
    for (const id of ids) expect(id).toMatch(/^NT-DEL-\d{4}-\d{5}$/);
    expect(ids.size).toBeGreaterThan(1);
  });
});