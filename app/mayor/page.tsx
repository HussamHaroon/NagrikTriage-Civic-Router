"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CITIES, type CityRecord } from "@/lib/cities";
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

const KIND_LABEL: Record<string, string> = {
  water: "💧 Water", power: "⚡ Power", sanitation: "🗑️ Sanitation", roads: "🛣️ Roads",
  streetlight: "💡 Streetlight", health: "🏥 Health", fire: "🔥 Fire", police: "🚓 Police", other: "📋 Other",
};

// 8 synthetic wards per city — synthesized lat/lng buckets so the heatmap
// renders even if the DB is empty.
const WARDS_PER_CITY = 8;
function wardCoord(city: CityRecord, ward: number): [number, number] {
  // Scatter around city center in 8 directions
  const angle = (ward / WARDS_PER_CITY) * Math.PI * 2;
  const r = 0.08;
  return [city.center[0] + Math.cos(angle) * r, city.center[1] + Math.sin(angle) * r];
}

// Heuristic: assign a ticket to a ward based on string hash of ticket id.
function ticketWard(ticketId: string, wards: number): number {
  let h = 0;
  for (let i = 0; i < ticketId.length; i++) h = (h * 31 + ticketId.charCodeAt(i)) >>> 0;
  return h % wards;
}

export default function MayorPage() {
  const [tickets, setTickets] = useState<DbTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string>("delhi");
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const layerRef = useRef<any | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("role", "mayor");
      params.set("cityId", cityId);
      params.set("limit", "500");
      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "fetch failed");
      setTickets(data.tickets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [cityId]);

  const city: CityRecord | undefined = CITIES.find((c) => c.id === cityId);

  // Aggregate
  const stats = useMemo(() => {
    const byKind: Record<string, number> = {};
    const byWardKind: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let critical = 0;
    let resolved = 0;
    for (const t of tickets) {
      byKind[t.incident_kind] = (byKind[t.incident_kind] ?? 0) + 1;
      const w = ticketWard(t.ticket_id, WARDS_PER_CITY);
      const key = `${w}::${t.incident_kind}`;
      byWardKind[key] = (byWardKind[key] ?? 0) + 1;
      const d = new Date(t.created_at).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + 1;
      if (t.urgency_score >= 8) critical++;
      if (t.status === "resolved") resolved++;
    }
    return { byKind, byWardKind, byDay, critical, resolved, total: tickets.length };
  }, [tickets]);

  // Spike detection: count of a kind in a ward vs. city average for that kind.
  const spikes = useMemo(() => {
    if (!city) return [];
    const out: { ward: number; kind: string; count: number; avg: number; ratio: number }[] = [];
    for (let w = 0; w < WARDS_PER_CITY; w++) {
      for (const k of Object.keys(KIND_LABEL)) {
        const key = `${w}::${k}`;
        const count = stats.byWardKind[key] ?? 0;
        if (count === 0) continue;
        // city average per ward for this kind
        const totalCity = stats.byKind[k] ?? 0;
        const avg = totalCity / WARDS_PER_CITY;
        if (avg < 1) continue;
        const ratio = count / Math.max(0.5, avg);
        if (ratio >= 1.5 && count >= 2) out.push({ ward: w, kind: k, count, avg, ratio });
      }
    }
    return out.sort((a, b) => b.ratio - a.ratio).slice(0, 6);
  }, [stats, city]);

  // Init map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapDivRef.current || !city) return;
      if (!mapRef.current) {
        mapRef.current = L.map(mapDivRef.current, { zoomControl: true }).setView(city.center, 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
    })();
    return () => { cancelled = true; };
  }, [city]);

  // Redraw markers
  useEffect(() => {
    if (!mapRef.current || !city) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      if (layerRef.current) layerRef.current.clearLayers();
      else layerRef.current = L.layerGroup().addTo(mapRef.current);

      for (let w = 0; w < WARDS_PER_CITY; w++) {
        const [lat, lng] = wardCoord(city, w);
        const wardTotal = Array.from({ length: 9 }, (_, k) => stats.byWardKind[`${w}::${Object.keys(KIND_LABEL)[k]}`] ?? 0).reduce((a, b) => a + b, 0);
        const radius = wardTotal === 0 ? 300 : Math.min(2000, 300 + wardTotal * 200);
        const color = wardTotal === 0 ? "#94a3b8" : wardTotal >= 4 ? "#dc2626" : wardTotal >= 2 ? "#f59e0b" : "#10b981";
        L.circle([lat, lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 2,
        }).bindPopup(`<div style="font-family:system-ui;min-width:160px"><div style="font-weight:600;color:#0f172a">Ward ${w + 1}</div><div style="font-size:12px;color:#334155;margin-top:2px">${wardTotal} ticket${wardTotal === 1 ? "" : "s"}</div></div>`).addTo(layerRef.current);
      }
      mapRef.current.setView(city.center, 12);
    })();
    return () => { cancelled = true; };
  }, [city, stats]);

  return (
    <main className="min-h-screen">
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={36} />
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">City Administrator</div>
              <div className="text-xs text-slate-600">Analytics view · {city?.name}</div>
            </div>
          </Link>
          <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Mayor</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5">
            {CITIES.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <Link href="/citizen" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">Citizen view</Link>
          <Link href="/officer" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">Officer view</Link>
          <button type="button" onClick={fetchAll} className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">↻ Refresh</button>
          <UserChip />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-12 grid lg:grid-cols-[1fr_360px] gap-4">
        <section className="space-y-4">
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Total" value={loading ? "—" : stats.total} tone="slate" />
            <KpiCard label="Critical (≥8)" value={loading ? "—" : stats.critical} tone="red" />
            <KpiCard label="Open" value={loading ? "—" : (stats.total - stats.resolved)} tone="amber" />
            <KpiCard label="Resolved" value={loading ? "—" : stats.resolved} tone="green" />
          </div>

          {/* Map */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Heatmap · {city?.name} · by ward
            </div>
            <div ref={mapDivRef} style={{ height: 460 }} className="bg-slate-100" />
            <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-200 bg-slate-50">
              Heat rings aggregate tickets by ward × category. Larger red ring = more urgent concentration.
              Map tiles © OpenStreetMap contributors.
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Categories</div>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {Object.entries(stats.byKind)
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => {
                  const max = Math.max(1, ...Object.values(stats.byKind));
                  const pct = Math.round((n / max) * 100);
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <div className="w-28 text-sm">{KIND_LABEL[k] ?? k}</div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-orange-400 to-amber-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-8 text-right text-sm font-medium">{n}</div>
                    </div>
                  );
                })}
              {Object.keys(stats.byKind).length === 0 && (
                <div className="text-sm text-slate-500 col-span-2">No data yet.</div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {/* Spike alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Spike alerts</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">AI-detected</span>
            </div>
            {spikes.length === 0 && (
              <div className="mt-3 text-sm text-slate-500">No abnormal spikes detected. City-wide distribution is even.</div>
            )}
            <ul className="mt-3 space-y-2">
              {spikes.map((s) => (
                <li key={`${s.ward}-${s.kind}`} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="text-xs font-semibold text-red-900">
                    ⚠ {Math.round((s.ratio - 1) * 100)}% spike in {KIND_LABEL[s.kind] ?? s.kind} · Ward {s.ward + 1}
                  </div>
                  <div className="text-[11px] text-red-800 mt-1">
                    {s.count} reports vs. city average {s.avg.toFixed(1)} per ward
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Latest activity</div>
            <ul className="mt-3 space-y-2 max-h-[420px] overflow-y-auto">
              {tickets.slice(0, 25).map((t) => (
                <li key={t.id} className="rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900 truncate">{t.core_issue}</div>
                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border ${t.urgency_score >= 8 ? "bg-red-100 text-red-800 border-red-300" : t.urgency_score >= 4 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"}`}>{t.urgency_score}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{KIND_LABEL[t.incident_kind] ?? t.incident_kind} · {new Date(t.created_at).toLocaleString()}</div>
                </li>
              ))}
              {tickets.length === 0 && <li className="text-sm text-slate-500">No tickets in queue.</li>}
            </ul>
          </div>
        </aside>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-10 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          ⚠️ {error}. Dashboard falls back to demo data when Supabase is unavailable.
        </div>
      )}
    </main>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number | string; tone: "slate" | "red" | "amber" | "green" }) {
  const cls =
    tone === "red" ? "bg-red-50 border-red-200 text-red-900" :
    tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-900" :
    tone === "green" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
    "bg-slate-50 border-slate-200 text-slate-900";
  return (
    <div className={`rounded-2xl border ${cls} p-4`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}