"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Role = "citizen" | "officer" | "mayor";

// Each demo persona has a real account seeded in Supabase (see
// scripts/seed-judges.ts). Picking a role just pre-fills the form so judges
// don't have to type credentials — but real users can also type their own.
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
    email: "judge.citizen@nagriktriage.in",
    password: "JudgeDemo2026!",
    redirect: "/citizen",
    bg: "from-orange-500 to-amber-500",
  },
  {
    id: "officer",
    title: "Nodal Officer",
    icon: "🧑‍💼",
    subtitle: "Department inbox, AI-sorted.",
    email: "judge.officer@nagriktriage.in",
    password: "JudgeDemo2026!",
    redirect: "/officer",
    bg: "from-blue-500 to-indigo-600",
  },
  {
    id: "mayor",
    title: "City Administrator",
    icon: "🏛️",
    subtitle: "City heatmap, ward spikes, KPIs.",
    email: "judge.mayor@nagriktriage.in",
    password: "JudgeDemo2026!",
    redirect: "/mayor",
    bg: "from-emerald-500 to-green-600",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role>("citizen");
  const [email, setEmail] = useState(ROLE_OPTIONS[0].email);
  const [password, setPassword] = useState(ROLE_OPTIONS[0].password);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectRole = (id: Role) => {
    setSelected(id);
    setError(null);
    const opt = ROLE_OPTIONS.find((r) => r.id === id);
    if (opt) {
      setEmail(opt.email);
      setPassword(opt.password);
    }
  };

  const signIn = async (override?: { email?: string; password?: string; redirect?: string }) => {
    setBusy(true);
    setError(null);
    const opt = ROLE_OPTIONS.find((r) => r.id === selected)!;
    const creds = {
      email: override?.email ?? email,
      password: override?.password ?? password,
    };
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Sign in failed.");
        return;
      }
      const redirect = override?.redirect ?? data.redirect ?? opt.redirect;
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn();
  };

  // One-click "judge" entry — logs in as the citizen judge persona and
  // lands on the citizen dashboard. (The selectRole UI above still lets
  // a judge land on officer/mayor if they want.)
  const signInAsJudge = () => {
    signIn({ redirect: "/citizen" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-center">
        {/* Brand panel */}
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Logo size={40} />
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
            Sign in with your own account, or jump straight in as a hackathon
            judge. Each role gets its own dashboard, its own data, and its own
            view of the city.
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
                autoComplete="email"
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
                autoComplete="current-password"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Pick a role above to pre-fill judge credentials, or type your own.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-60 transition"
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* One-click judge entry */}
          <div className="mt-4">
            <button
              type="button"
              onClick={signInAsJudge}
              disabled={busy}
              className="w-full px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium border border-slate-900 hover:bg-slate-800 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              <span>🏆</span>
              {busy ? "Signing in…" : "Sign in as hackathon judge"}
            </button>
            <p className="mt-1 text-center text-[11px] text-slate-500">
              Skips the form — logs you straight in as the citizen judge persona.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              New here?{" "}
              <Link href="/signup" className="text-orange-600 hover:underline">
                Create an account
              </Link>
            </span>
            <Link href="/" className="text-slate-500 hover:underline">
              ← Landing page
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
