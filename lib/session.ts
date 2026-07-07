// Convenience wrapper: returns the logged-in user + their profile in one call.
// Use from Server Components or Route Handlers.

import "server-only";
import { createSupabaseServer } from "./supabaseServer";

export type SessionProfile = {
  userId: string;
  email: string;
  displayName: string;
  role: "citizen" | "officer" | "mayor";
  cityId: string | null;
};

export async function getSessionProfile(): Promise<SessionProfile | null> {
  try {
    const sb = await createSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) return null;

    // Profiles are created by a DB trigger on signup, but the row may be
    // lagging behind right after first login. Fall back to user metadata.
    const { data: profile } = await sb
      .from("profiles")
      .select("display_name, role, city_id")
      .eq("id", user.id)
      .single();

    return {
      userId: user.id,
      email: user.email ?? "",
      displayName:
        profile?.display_name ??
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Resident",
      role: (profile?.role as SessionProfile["role"]) ?? "citizen",
      cityId: profile?.city_id ?? null,
    };
  } catch {
    // Supabase not configured → no session.
    return null;
  }
}
