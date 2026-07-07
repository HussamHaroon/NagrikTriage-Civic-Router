import { NextResponse } from "next/server";
import { createSupabaseServerForRouteHandler } from "@/lib/supabaseServer";

export const runtime = "nodejs";

// POST /api/auth/signout
// Clears the Supabase session cookie and returns the user to the landing page.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  const sb = await createSupabaseServerForRouteHandler(res);
  await sb.auth.signOut();
  return res;
}
