"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Role = "citizen" | "officer" | "mayor";

const ROLE_OPTIONS: {
  id: Role;
  title: string;
  icon: string;
  subtitle: string;
  email: string;
  password: string;
  redirect: string;
  bg: string;
}[] = [
  {
    id: "citizen",
    title: "Citizen",
    icon: "🧑",
    subtitle: "Report an issue, get a ticket.",
    email: "priya@delhi.in",
    password: "•••••••••",
    redirect: "/citizen",
    bg: "from-orange-500 to-amber-500",
  },
  {
    id: "officer",
    title: "Nodal Officer",
    icon: "🧑‍💼",
    subtitle: "Department inbox, AI-sorted.",
    email: "officer.jalboard@delhi.gov.in",
    password: "••••••••••",
    redirect: "/officer",
    bg: "from-blue-500 to-indigo-600",
  },
  {
    id: "mayor",
    title: "City Administrator",
    icon: "🏛️",
    subtitle: "City heatmap, ward spikes, KPIs.",
    email: "mayor@mcd.gov.in",
    password: "••••••••••",
    redirect: "/mayor",
    bg: "from-emerald-500 to-green-600",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role>("citizen");
  const [email, setEmail] = useState("priya@delhi.in");
  const [password, setPassword] = useState("•••••••••");
  const [busy, setBusy] = useState(false);

  const selectRole = (id: Role) => {
    setSelected(id);
    const opt = ROLE_OPTIONS.find((r) => r.id === id);
    if (opt) {
      setEmail(opt.email);
      setPassword(opt.password);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const opt = ROLE_OPTIONS.find((r) => r.id === selected)!;
    try {
      await fetch("/api/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      });
    } catch {
      // best-effort
    }
    router.push(opt.redirect);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-center">
        {/* Brand panel */}
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-900">
              NT
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">NagrikTriage</div>
              <div className="text-xs text-slate-600">Smart Bharat Civic Companion</div>
            </div>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            One platform,{" "}
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-green-700 bg-clip-text text-transparent">
              three users.
            </span>
          </h1>
          <p className="mt-3 text-slate-700">
            The same AI triage pipeline, but the experience adapts to who you are:
            a citizen with a complaint, a government officer with an inbox, or a
            mayor with a city to watch.
          </p>
          <div className="mt-6 grid gap-3">
            {ROLE_OPTIONS.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border bg-white/70 backdrop-blur shadow-sm ${
                  selected === r.id ? "ring-2 ring-orange-300 border-orange-300" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${r.bg} flex items-center justify-center text-lg`}>
                    {r.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-600">{r.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Form panel */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Continue as
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRole(r.id)}
                className={`text-sm py-2.5 rounded-lg border transition ${
                  selected === r.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="mr-1">{r.icon}</span>
                {r.title}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Demo mode — any input is accepted. Real auth would verify against Supabase.
              </p>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-60 transition"
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>

            <div className="text-center text-xs text-slate-500">
              Or{" "}
              <Link href="/" className="text-orange-600 hover:underline">
                browse the landing page
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}