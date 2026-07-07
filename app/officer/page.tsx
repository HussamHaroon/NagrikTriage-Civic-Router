"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CITIES, type CityRecord } from "@/lib/cities";
import { speak } from "@/lib/useSpeech";
import UserChip from "@/components/UserChip";
import Logo from "@/components/Logo";

type DbTicket = {
  id: string;
  created_at: string;
  ticket_id: string;
  city_id: string | null;
  city_hint: string | null;
  original_text: string | null;
  had_image: boolean;
  core_issue: string;
  target_department: string;
  urgency_score: number;
  formal_draft: string;
  next_step: string;
  signals: string[] | null;
  incident_kind: string;
  confidence_score: number;
  status: string;
};

const DEPT_KINDS: Record<string, string[]> = {
  "Jal Board": ["water"],
  "Electricity / DISCOM": ["power"],
  "Sanitation / MCD": ["sanitation"],
  "Roads / PWD": ["roads"],
  "Streetlight": ["streetlight"],
  "Health": ["health"],
  "Fire Service": ["fire"],
  "Police": ["police"],
};

const DEPT_LIST = Object.keys(DEPT_KINDS);

function urgencyTone(u: number) {
  if (u >= 8) return { label: "Critical", classes: "bg-red-100 text-red-800 border-red-300" };
  if (u >= 4) return { label: "Moderate", classes: "bg-amber-100 text-amber-800 border-amber-300" };
  return { label: "Low", classes: "bg-emerald-100 text-emerald-800 border-emerald-300" };
}

function fmtTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_NEXT: Record<string, string> = {
  filed: "ack",
  ack: "assigned",
  assigned: "progress",
  progress: "resolved",
};

export default function OfficerPage() {
  const [tickets, setTickets] = useState<DbTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dept, setDept] = useState<string>("Jal Board");
  const [cityId, setCityId] = useState<string>("delhi");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<DbTicket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const kinds = DEPT_KINDS[dept] ?? [];
      const params = new URLSearchParams();
      params.set("role", "officer");
      params.set("cityId", cityId);
      // OR match across kinds for this dept
      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "fetch failed");
      const filtered: DbTicket[] = (data.tickets ?? []).filter((t: DbTicket) =>
        kinds.length === 0 ? true : kinds.includes(t.incident_kind)
      );
      setTickets(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, cityId]);

  const advance = async (t: DbTicket) => {
    const next = STATUS_NEXT[t.status];
    if (!next) return;
    // Optimistic update
    setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    if (selected?.id === t.id) setSelected((s) => (s ? { ...s, status: next } : s));
    try {
      await fetch("/api/tickets/" + t.id + "/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } catch {
      // ignore — soft failure for demo
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const stats = useMemo(() => {
    const out = { total: tickets.length, critical: 0, open: 0, resolved: 0 };
    for (const t of tickets) {
      if (t.urgency_score >= 8) out.critical++;
      if (t.status !== "resolved") out.open++;
      if (t.status === "resolved") out.resolved++;
    }
    return out;
  }, [tickets]);

  const city: CityRecord | undefined = CITIES.find((c) => c.id === cityId);

  return (
    <main className="min-h-screen">
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={36} />
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">Officer inbox</div>
              <div className="text-xs text-slate-600">AI-routed complaints · {dept} · {city?.name}</div>
            </div>
          </Link>
          <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Nodal Officer</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/citizen" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">Citizen view</Link>
          <Link href="/mayor" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">Mayor view</Link>
          <button type="button" onClick={fetchTickets} className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">↻ Refresh</button>
          <UserChip />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-12">
        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600">Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="mt-1 text-sm rounded-lg border border-slate-300 px-3 py-2">
              {DEPT_LIST.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600">City</label>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="mt-1 text-sm rounded-lg border border-slate-300 px-3 py-2">
              {CITIES.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 text-sm rounded-lg border border-slate-300 px-3 py-2">
              <option value="all">All</option>
              <option value="filed">Filed</option>
              <option value="ack">Acknowledged</option>
              <option value="assigned">Assigned</option>
              <option value="progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <KpiPill label="Total" value={stats.total} />
            <KpiPill label="Critical" value={stats.critical} tone="red" />
            <KpiPill label="Open" value={stats.open} tone="amber" />
            <KpiPill label="Resolved" value={stats.resolved} tone="green" />
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            ⚠️ {error}. The dashboard falls back to a local demo dataset.
          </div>
        )}

        <div className="mt-4 grid lg:grid-cols-[1fr_420px] gap-4">
          {/* Inbox */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              AI inbox · sorted by urgency
            </div>
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No tickets routed to this department. Refresh after a citizen files.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const tn = urgencyTone(t.urgency_score);
                  const active = selected?.id === t.id;
                  return (
                    <li key={t.id}>
                      <button type="button" onClick={() => setSelected(t)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${active ? "bg-blue-50" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-slate-500 font-mono">{t.ticket_id}</div>
                            <div className="font-semibold text-slate-900 truncate">{t.core_issue}</div>
                            <div className="text-xs text-slate-600 mt-0.5 truncate">
                              {t.target_department} · {fmtTime(t.created_at)} · {t.status}
                              {t.signals && t.signals.length > 0 && (
                                <span className="ml-2 text-slate-500">· {t.signals.length} signal{t.signals.length === 1 ? "" : "s"}</span>
                              )}
                            </div>
                          </div>
                          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${tn.classes}`}>{t.urgency_score}/10</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Detail */}
          <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 self-start lg:sticky lg:top-4">
            {!selected && (
              <div className="text-sm text-slate-500">Select a ticket to view the AI-formatted complaint.</div>
            )}
            {selected && (() => {
              const tn = urgencyTone(selected.urgency_score);
              return (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 font-mono">{selected.ticket_id}</div>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">{selected.core_issue}</h2>
                      <div className="text-xs text-slate-500 mt-1">{selected.target_department} · {selected.city_hint ?? selected.city_id ?? "Unknown location"}</div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${tn.classes}`}>{selected.urgency_score}/10</span>
                  </div>

                  {selected.signals && selected.signals.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selected.signals.map((s, i) => (<span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">{s}</span>))}
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Formal draft</div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-3">{selected.formal_draft}</pre>
                  </div>

                  <div className="mt-3 text-xs text-slate-700"><span className="font-semibold">Next step:</span> {selected.next_step}</div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => advance(selected)} disabled={!STATUS_NEXT[selected.status]} className="text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
                      Advance to "{STATUS_NEXT[selected.status] ?? "done"}"
                    </button>
                    <button type="button" onClick={() => speak(selected.formal_draft, "en-IN")} className="text-xs px-3 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 transition">🔊 Read</button>
                    <Link href={`/track`} className="text-xs px-3 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition">Open tracker</Link>
                  </div>

                  <div className="mt-4 text-[11px] text-slate-500">
                    Citizen language: original text was AI-classified to <span className="font-medium">{selected.incident_kind}</span> with {Math.round(selected.confidence_score * 100)}% confidence.
                  </div>
                </div>
              );
            })()}
          </aside>
        </div>
      </div>
    </main>
  );
}

function KpiPill({ label, value, tone }: { label: string; value: number; tone?: "red" | "amber" | "green" }) {
  const cls =
    tone === "red" ? "bg-red-50 text-red-800 border-red-200" :
    tone === "amber" ? "bg-amber-50 text-amber-800 border-amber-200" :
    tone === "green" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
    "bg-slate-50 text-slate-800 border-slate-200";
  return (
    <div className={`px-3 py-2 rounded-lg border text-xs ${cls}`}>
      <div className="font-semibold text-lg leading-none">{value}</div>
      <div className="opacity-80">{label}</div>
    </div>
  );
}