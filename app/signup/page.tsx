"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Role = "citizen" | "officer" | "mayor";

const ROLE_OPTIONS: {
  id: Role;
  title: string;
  icon: string;
  subtitle: string;
  redirect: string;
  bg: string;
}[] = [
  { id: "citizen", title: "Citizen", icon: "🧑", subtitle: "Report issues.", redirect: "/citizen", bg: "from-orange-500 to-amber-500" },
  { id: "officer", title: "Nodal Officer", icon: "🧑‍💼", subtitle: "Department inbox.", redirect: "/officer", bg: "from-blue-500 to-indigo-600" },
  { id: "mayor", title: "City Administrator", icon: "🏛️", subtitle: "City analytics.", redirect: "/mayor", bg: "from-emerald-500 to-green-600" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("citizen");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Sign up failed.");
        return;
      }
      if (data.needsConfirmation) {
        setInfo(data.message);
        return;
      }
      router.push(data.redirect ?? "/citizen");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <Logo size={40} />
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">NagrikTriage</div>
            <div className="text-xs text-slate-600">Create your account</div>
          </div>
        </Link>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Get your own dashboard, ticket history, and city view.
          </p>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              I am a…
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`text-sm py-2.5 rounded-lg border transition ${
                    role === r.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-1">{r.icon}</span>
                  {r.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                minLength={6}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">At least 6 characters.</p>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {info && (
              <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-60 transition"
            >
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/signin" className="text-orange-600 hover:underline">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
