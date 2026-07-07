"use client";

import { useEffect, useState, useCallback } from "react";
import type { TriageResult } from "./prompts";

export type HistoryEntry = TriageResult & {
  id: string;
  createdAt: number;
  ticketId: string; // NT-CITY-NNNNN
  cityId?: string;
  originalText: string;
  hadImage: boolean;
  // For duplicate detection / map
  geo?: { lat: number; lng: number } | null;
};

const STORAGE_KEY = "nagriktriage.history.v2";
const MAX_ENTRIES = 16;

// Cheap duplicate detection: same incident_kind + 50%+ token overlap on
// core_issue. Server-side this would be a real DB; for the hackathon
// localStorage is plenty.
function jaccard(a: string, b: string): number {
  const tok = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  const A = tok(a);
  const B = tok(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function findDuplicates(
  newEntry: Pick<HistoryEntry, "core_issue" | "incident_kind">,
  existing: HistoryEntry[]
): HistoryEntry[] {
  return existing
    .filter((e) => e.incident_kind === newEntry.incident_kind)
    .filter((e) => jaccard(e.core_issue, newEntry.core_issue) > 0.4)
    .slice(0, 4);
}

function readStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.createdAt === "number" &&
        typeof e.core_issue === "string"
    );
  } catch {
    return [];
  }
}

function writeStorage(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota / private mode — fail silently
  }
}

export function makeTicketId(cityId?: string): string {
  const city = (cityId ?? "IND").toUpperCase().slice(0, 3);
  const n = Math.floor(10000 + Math.random() * 90000);
  return `NT-${city}-${new Date().getFullYear()}-${n}`;
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(readStorage());
    setHydrated(true);
  }, []);

  // Cross-tab sync.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setEntries(readStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEntry = useCallback(
    (entry: Omit<HistoryEntry, "id" | "createdAt" | "ticketId">) => {
      const next: HistoryEntry = {
        ...entry,
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        createdAt: Date.now(),
        ticketId: makeTicketId(entry.cityId),
      };
      setEntries((prev) => {
        const merged = [next, ...prev].slice(0, MAX_ENTRIES);
        writeStorage(merged);
        return merged;
      });
      return next;
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const merged = prev.filter((e) => e.id !== id);
      writeStorage(merged);
      return merged;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    writeStorage([]);
  }, []);

  return { entries, addEntry, removeEntry, clearAll, hydrated };
}