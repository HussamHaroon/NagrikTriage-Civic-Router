"use client";

import { useEffect, useState, useCallback } from "react";
import type { TriageResult } from "./prompts";

export type HistoryEntry = TriageResult & {
  id: string;
  createdAt: number;
  originalText: string;
  hadImage: boolean;
};

const STORAGE_KEY = "nagriktriage.history.v1";
const MAX_ENTRIES = 8;

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
    // Quota exceeded / private mode — fail silently; the UI is still useful
    // without persistence.
  }
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
    (entry: Omit<HistoryEntry, "id" | "createdAt">) => {
      const next: HistoryEntry = {
        ...entry,
        id:
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)),
        createdAt: Date.now(),
      };
      setEntries((prev) => {
        const merged = [next, ...prev].slice(0, MAX_ENTRIES);
        writeStorage(merged);
        return merged;
      });
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