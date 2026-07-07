"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHistory, type HistoryEntry } from "@/lib/history";

type Stage = {
  key: string;
  title: string;
  hint: string;
  hoursFromStart: number;
};

const STAGES: Stage[] = [
  { key: "filed", title: "Filed", hint: "Submitted to municipal queue", hoursFromStart: 0 },
  { key: "ack", title: "Acknowledged", hint: "Officer received your ticket", hoursFromStart: 2 },
  { key: "assigned", title: "Assigned", hint: "Routed to field team", hoursFromStart: 18 },
  { key: "progress", title: "In progress", hint: "Work order created", hoursFromStart: 60 },
  { key: "resolved", title: "Resolved", hint: "Issue closed & verified", hoursFromStart: 120 },
];

function statusFromEntry(entry: HistoryEntry) {
  // Deterministic fake timeline based on age of the entry + urgency:
  // higher urgency = faster progression.
  const ageMs = Date.now() - entry.createdAt;
  const ageHours = ageMs / (1000 * 60 * 60);
  const speedup = 1 + (entry.urgency_score - 5) * 0.15; // 8 -> 1.45x
  const elapsed = ageHours * speedup;
  let reachedIdx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (elapsed >= STAGES[i].hoursFromStart) reachedIdx = i;
  }
  return reachedIdx;
}

export default function TrackPage() {
  const { entries, hydrated } = useHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(0);

  // pick most recent on load
  useEffect(() => {
    if (hydrated && entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id);
    }
  }, [hydrated, entries, selectedId]);

  // tick once per minute to animate progression
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const entry = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );
  const reached = entry ? statusFromEntry(entry) : 0;

  return (
    <main className="min-h-screen">
      <header className="px-5 sm:px-8 py-4 max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-900"
          >
            NT
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">Track ticket</div>
            <div className="text-xs text-slate-600">Smart Bharat · Status timeline</div>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition"
        >
          ← Back to NagrikTriage
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-16">
        <h1 className="text-3xl font-bold text-slate-900">Live status timeline</h1>
        <p className="mt-2 text-slate-700 max-w-2xl">
          We auto-route your complaint to the right department. Below is a simulated
          status feed showing how a real ticket progresses through the system.
        </p>

        {!hydrated && <div className="mt-6 text-sm text-slate-500">Loading…</div>}
        {hydrated && entries.length === 0 && (
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 text-slate-700">
            No tickets yet. <Link href="/" className="text-orange-600 underline">File one</Link> to see its timeline here.
          </div>
        )}

        {hydrated && entries.length > 0 && (
          <div className="mt-6 grid md:grid-cols-[280px_1fr] gap-6">
            <aside className="bg-white border border-slate-200 rounded-2xl p-3 self-start">
              <div className="text-xs font-semibold text-slate-500 uppercase px-2 pb-1">
                Your tickets
              </div>
              <ul className="space-y-1">
                {entries.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedId === e.id
                          ? "bg-orange-100 text-orange-900"
                          : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <div className="font-medium truncate">{e.core_issue}</div>
                      <div className="text-[10px] text-slate-500">{e.ticketId}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              {entry && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500">
                        Ticket {entry.ticketId}
                      </div>
                      <h2 className="mt-1 text-2xl font-bold text-slate-900">
                        {entry.core_issue}
                      </h2>
                      <div className="mt-1 text-sm text-slate-600">
                        {entry.target_department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Urgency</div>
                      <div className="text-lg font-bold text-slate-900">
                        {entry.urgency_score}/10
                      </div>
                    </div>
                  </div>

                  <ol className="mt-6 relative border-l-2 border-slate-200 ml-2">
                    {STAGES.map((s, i) => {
                      const done = i <= reached;
                      const active = i === reached && i < STAGES.length - 1;
                      return (
                        <li key={s.key} className="ml-6 mb-6 last:mb-0">
                          <span
                            className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ${
                              done
                                ? active
                                  ? "bg-orange-500 ring-orange-200 animate-pulse"
                                  : "bg-emerald-500 ring-emerald-200"
                                : "bg-slate-200 ring-slate-100"
                            }`}
                          />
                          <div
                            className={`text-sm font-semibold ${
                              done ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {s.title}
                            {active && (
                              <span className="ml-2 text-[10px] uppercase tracking-wide text-orange-600">
                                current
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs ${
                              done ? "text-slate-600" : "text-slate-400"
                            }`}
                          >
                            {s.hint}
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="mt-4 text-xs text-slate-500">
                    Simulated feed. In production this would query the municipal
                    ticketing system via a verified API.
                  </div>
                </>
              )}
              {!entry && (
                <div className="text-slate-500">Select a ticket to view its timeline.</div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}