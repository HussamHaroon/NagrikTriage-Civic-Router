"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const ROLES = [
  {
    id: "citizen",
    title: "Citizen",
    icon: "🧑",
    blurb:
      "File a complaint in your native language — text, voice, or photo. Get a routed, formal ticket in 3 seconds.",
    color: "from-orange-400 to-amber-500",
    accent: "bg-orange-50 border-orange-200 text-orange-900",
    redirect: "/citizen",
  },
  {
    id: "officer",
    title: "Nodal Officer",
    icon: "🧑‍💼",
    blurb:
      "See only the tickets routed to your department, AI-summarized and sorted by urgency. No sorting, no translation, no triage.",
    color: "from-blue-400 to-indigo-500",
    accent: "bg-blue-50 border-blue-200 text-blue-900",
    redirect: "/officer",
  },
  {
    id: "mayor",
    title: "City Administrator",
    icon: "🏛️",
    blurb:
      "Watch the city in real time. Heatmap, category spikes, ward-by-ward trends, and AI-flagged emergencies.",
    color: "from-emerald-400 to-green-600",
    accent: "bg-emerald-50 border-emerald-200 text-emerald-900",
    redirect: "/mayor",
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pickRole = async (id: "citizen" | "officer" | "mayor", redirect: string) => {
    setBusyId(id);
    try {
      await fetch("/api/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: id }),
      });
    } catch {
      // ignore — cookie is a nice-to-have for the demo
    }
    router.push(redirect);
  };

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-900"
          >
            NT
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">NagrikTriage</div>
            <div className="text-xs text-slate-600">Smart Bharat Civic Companion</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="text-sm px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Sign In →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium border border-orange-200">
          🇮🇳 Smart Bharat Hackathon · Powered by Gemini 2.5 Flash
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
          Civic frustration,{" "}
          <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-green-700 bg-clip-text text-transparent">
            routed in 3 seconds.
          </span>
        </h1>
        <p className="mt-4 text-slate-700 max-w-2xl mx-auto text-base sm:text-lg">
          NagrikTriage turns messy, multilingual complaints — Hinglish, Tamil, Bengali, Telugu, Marathi,
          Hindi, or English — into structured government tickets with the right department, real helpline,
          and a polite formal email ready to send.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signin"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            Get started
          </Link>
          <Link
            href="/citizen"
            className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-medium hover:bg-slate-50 transition"
          >
            Try the citizen demo →
          </Link>
        </div>
      </section>

      {/* 3 personas */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 mt-14">
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pick your role to continue
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => pickRole(r.id as "citizen" | "officer" | "mayor", r.redirect)}
              disabled={busyId !== null}
              className={`group text-left p-5 rounded-2xl border ${r.accent} hover:shadow-lg transition disabled:opacity-60`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl shadow-md`}
              >
                {r.icon}
              </div>
              <div className="mt-3 text-lg font-bold">{r.title}</div>
              <p className="mt-1 text-sm leading-relaxed opacity-90">{r.blurb}</p>
              <div className="mt-3 inline-flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform">
                {busyId === r.id ? "Opening…" : "Continue →"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 mt-16 grid md:grid-cols-3 gap-4">
        {[
          { icon: "🌍", title: "Multilingual by default", body: "Voice, text, or photo — in 6 Indian languages and any English/Hinglish dialect." },
          { icon: "🏛️", title: "Real municipal routing", body: "8 metros with real helplines, plus national defaults for every other city." },
          { icon: "🚨", title: "AI explainability", body: "Every urgency score is backed by extracted signals you can audit." },
          { icon: "🗺️", title: "Two-sided platform", body: "Citizens file, officers sort by department, mayors see ward spikes." },
          { icon: "🛡️", title: "Privacy by design", body: "PII auto-masking, opt-in geolocation, server-side persistence." },
          { icon: "🆓", title: "100% free-tier", body: "Gemini Flash, Leaflet + OSM, Web Speech API, html-to-image. No paid keys." },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="mt-2 font-semibold text-slate-900">{f.title}</div>
            <p className="mt-1 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 mt-16 pb-10 text-center text-xs text-slate-500">
        Built for Smart Bharat · Powered by Gemini · Citizen language: any.
      </footer>
    </main>
  );
}