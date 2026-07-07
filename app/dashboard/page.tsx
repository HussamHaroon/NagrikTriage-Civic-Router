"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useHistory, type HistoryEntry } from "@/lib/history";
import { CITIES, type CityRecord } from "@/lib/cities";
import type { IncidentKind } from "@/lib/prompts";
import Logo from "@/components/Logo";

// Deterministic seed → jittered lat/lng near city center, so the map looks
// populated without us storing real coordinates.
function pseudoGeo(city: CityRecord, idx: number): [number, number] {
  const seed = (city.id.charCodeAt(0) * 31 + idx * 17) % 1000;
  const dLat = ((seed % 100) - 50) / 600; // ~±0.08°
  const dLng = (((seed * 7) % 100) - 50) / 600;
  return [city.center[0] + dLat, city.center[1] + dLng];
}

function urgencyColor(u: number): string {
  if (u >= 8) return "#dc2626";
  if (u >= 4) return "#f59e0b";
  return "#10b981";
}

const KIND_LABEL: Record<IncidentKind, string> = {
  water: "💧 Water",
  power: "⚡ Power",
  sanitation: "🗑️ Sanitation",
  roads: "🛣️ Roads",
  streetlight: "💡 Streetlight",
  health: "🏥 Health",
  fire: "🔥 Fire",
  police: "🚓 Police",
  other: "📋 Other",
};

export default function DashboardPage() {
  const { entries, hydrated } = useHistory();
  const [cityId, setCityId] = useState<string>("delhi");
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const layerRef = useRef<any | null>(null);

  const city = useMemo(() => CITIES.find((c) => c.id === cityId) ?? CITIES[0], [cityId]);

  // Synthesize a citywide complaint view: real entries + seeded markers so the
  // map looks alive even before users file complaints.
  const tickets: (HistoryEntry & { synthetic: boolean; lat: number; lng: number })[] = useMemo(() => {
    const real = entries.map((e, i) => {
      const useCity = e.cityId ?? cityId;
      const c = CITIES.find((x) => x.id === useCity) ?? city;
      const [lat, lng] = e.geo ? [e.geo.lat, e.geo.lng] : pseudoGeo(c, i);
      return { ...e, synthetic: false, lat, lng };
    });
    // Seeded synthetic complaints per city to make the dashboard feel real.
    const syntheticKinds: IncidentKind[] = [
      "water",
      "power",
      "sanitation",
      "roads",
      "streetlight",
      "health",
      "water",
      "sanitation",
    ];
    const synth = syntheticKinds.map((k, i) => {
      const [lat, lng] = pseudoGeo(city, i + 100);
      const urg = [3, 9, 5, 7, 2, 8, 6, 4][i] ?? 5;
      return {
        id: `syn-${city.id}-${i}`,
        ticketId: `NT-${city.id.toUpperCase()}-S-${i}`,
        createdAt: Date.now() - i * 3600_000,
        core_issue: ["Burst pipeline", "Power outage", "Garbage pile", "Pothole", "Dark street", "Dengue cluster", "Drainage choke", "Broken bench"][i] ?? "Civic issue",
        target_department: city.departments[0]?.name ?? "Municipal",
        urgency_score: urg,
        formal_draft: "",
        next_step: "",
        signals: [],
        incident_kind: k,
        confidence_score: 0.85,
        originalText: "",
        hadImage: false,
        synthetic: true,
        lat,
        lng,
      } as HistoryEntry & { synthetic: boolean; lat: number; lng: number };
    });
    return [...real, ...synth];
  }, [entries, cityId, city]);

  // Stats
  const stats = useMemo(() => {
    const byKind: Record<string, number> = {};
    let critical = 0;
    for (const t of tickets) {
      byKind[t.incident_kind] = (byKind[t.incident_kind] ?? 0) + 1;
      if (t.urgency_score >= 8) critical++;
    }
    return { total: tickets.length, byKind, critical };
  }, [tickets]);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapDivRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(mapDivRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView(city.center, 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      if (layerRef.current) {
        layerRef.current.clearLayers();
      } else {
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      for (const t of tickets) {
        const marker = L.circleMarker([t.lat, t.lng], {
          radius: Math.max(5, Math.min(15, t.urgency_score)),
          color: urgencyColor(t.urgency_score),
          fillColor: urgencyColor(t.urgency_score),
          fillOpacity: 0.6,
          weight: 2,
        });
        marker.bindPopup(
          `<div style="font-family:system-ui;min-width:180px">
            <div style="font-size:11px;color:#475569;text-transform:uppercase">${t.ticketId}</div>
            <div style="font-weight:600;color:#0f172a;margin-top:2px">${t.core_issue}</div>
            <div style="font-size:12px;color:#334155;margin-top:4px">${KIND_LABEL[t.incident_kind] ?? t.incident_kind} · Urgency ${t.urgency_score}/10</div>
            ${t.synthetic ? '<div style="font-size:10px;color:#94a3b8;margin-top:4px">seeded demo data</div>' : ""}
          </div>`
        );
        marker.addTo(layerRef.current);
      }
      mapRef.current.setView(city.center, 12);
    })();
    return () => {
      cancelled = true;
    };
  }, [tickets, city]);

  return (
    <main className="min-h-screen">
      <header className="px-5 sm:px-8 py-4 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">Officer dashboard</div>
            <div className="text-xs text-slate-600">
              Citizen view → Officer view · {city.name}
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition"
        >
          ← Citizen view
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-16 grid lg:grid-cols-[1fr_320px] gap-6">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-700">City:</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              Heat-style markers show urgency (red ≥ 8, amber 4–7, green ≤ 3)
            </span>
          </div>

          <div
            ref={mapDivRef}
            className="rounded-2xl border border-slate-200 shadow-md overflow-hidden bg-slate-100"
            style={{ height: 520 }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.byKind)
              .sort((a, b) => b[1] - a[1])
              .map(([kind, n]) => (
                <div
                  key={kind}
                  className="bg-white border border-slate-200 rounded-xl p-3"
                >
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    {KIND_LABEL[kind as IncidentKind] ?? kind}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{n}</div>
                </div>
              ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Total in queue
            </div>
            <div className="text-4xl font-bold text-slate-900 mt-1">
              {hydrated ? stats.total : "—"}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Critical (urgency ≥ 8):{" "}
              <span className="font-semibold text-red-600">
                {hydrated ? stats.critical : "—"}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Departments — {city.name}
            </div>
            <ul className="mt-2 space-y-2">
              {city.departments.map((d) => (
                <li key={d.name} className="text-sm">
                  <div className="font-medium text-slate-900">{d.name}</div>
                  {(d.helpline || d.email) && (
                    <div className="text-xs text-slate-500">
                      {d.helpline ? `📞 ${d.helpline}` : ""}
                      {d.helpline && d.email ? " · " : ""}
                      {d.email ? d.email : ""}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed">
            Map tiles © OpenStreetMap contributors. Marker geometry is demo data;
            real deployment would ingest verified municipal records.
          </div>
        </aside>
      </div>
    </main>
  );
}