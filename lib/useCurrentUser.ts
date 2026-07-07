"use client";

import { useEffect, useState, useCallback } from "react";

export type CurrentUser = {
  userId: string;
  email: string;
  displayName: string;
  role: "citizen" | "officer" | "mayor";
  cityId: string | null;
} | null;

// Fetches the logged-in user from /api/auth/me (a server-side cookie read).
// Returns `loading` until the first request resolves.
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  return { user, loading, signOut, refresh };
}
