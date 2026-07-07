"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

const ROLE_BADGE: Record<string, string> = {
  citizen: "bg-orange-100 text-orange-800 border-orange-200",
  officer: "bg-blue-100 text-blue-800 border-blue-200",
  mayor: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const ROLE_LABEL: Record<string, string> = {
  citizen: "Citizen",
  officer: "Nodal Officer",
  mayor: "City Administrator",
};

// Compact account chip + sign-out for the dashboard header.
// Shows the user's name + role when logged in, or a "Sign in" link otherwise.
// For hackathon judge convenience, the dropdown also exposes one-click
// "Add demo data" and "Clear my data" actions.
export default function UserChip() {
  const { user, loading, signOut } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [demoBusy, setDemoBusy] = useState<"seed" | "clear" | null>(null);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = () => {
      setOpen(false);
      setDemoMsg(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  if (loading) {
    return <span className="text-xs text-slate-400 px-3 py-1.5">…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className="text-sm px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 transition"
      >
        Sign in
      </Link>
    );
  }

  // Add demo tickets owned by this user (hackathon judge shortcut).
  const seedDemo = async () => {
    setDemoBusy("seed");
    setDemoMsg(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDemoMsg(data?.error ?? "Could not add demo data.");
      } else {
        setDemoMsg(`Added ${data.inserted ?? 0} demo tickets.`);
        router.refresh();
      }
    } catch {
      setDemoMsg("Network error.");
    } finally {
      setDemoBusy(null);
    }
  };

  // Delete every ticket owned by this user. Other users' data and the
  // original owner-less seed rows are untouched.
  const clearDemo = async () => {
    setDemoBusy("clear");
    setDemoMsg(null);
    try {
      const res = await fetch("/api/demo/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDemoMsg(data?.error ?? "Could not clear data.");
      } else {
        setDemoMsg("Cleared your tickets.");
        router.refresh();
      }
    } catch {
      setDemoMsg("Network error.");
    } finally {
      setDemoBusy(null);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-200 shadow-sm transition"
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase">
          {user.displayName.slice(0, 1)}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-xs font-semibold text-slate-900 truncate max-w-[140px]">
            {user.displayName}
          </span>
          <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">
            {user.email}
          </span>
        </span>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            ROLE_BADGE[user.role] ?? ROLE_BADGE.citizen
          }`}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
          <div className="px-2 py-1.5">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {user.displayName}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
          </div>

          {/* Demo data controls — handy for hackathon judges */}
          <div className="border-t border-slate-100 my-1" />
          <div className="px-2 py-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Demo data
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={seedDemo}
                disabled={demoBusy !== null}
                className="text-xs px-2 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition"
              >
                {demoBusy === "seed" ? "Adding…" : "+ Add demo"}
              </button>
              <button
                type="button"
                onClick={clearDemo}
                disabled={demoBusy !== null}
                className="text-xs px-2 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
              >
                {demoBusy === "clear" ? "Clearing…" : "✕ Clear"}
              </button>
            </div>
            {demoMsg && (
              <div className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                {demoMsg}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 my-1" />
          <Link
            href="/signin"
            className="block px-2 py-1.5 text-sm rounded-lg hover:bg-slate-50 text-slate-700"
            onClick={() => setOpen(false)}
          >
            Switch account
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
