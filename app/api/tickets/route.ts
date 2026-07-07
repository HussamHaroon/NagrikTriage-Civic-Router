import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

// GET /api/tickets?role=officer&dept=water&cityId=delhi&limit=100
// GET /api/tickets?role=mayor&cityId=delhi
// GET /api/tickets?role=citizen
//
// Behaviour:
//   - Logged-in citizens see ONLY their own tickets (RLS-enforced).
//   - Logged-in officers/mayors see every ticket in their city.
//   - Anonymous (demo) callers fall back to the service_role client and see
//     the seeded demo data so the dashboards still render before login.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const role = sp.get("role") ?? "citizen";
  const dept = sp.get("dept"); // e.g. "water"
  const cityId = sp.get("cityId");
  const limit = Math.min(500, Number(sp.get("limit") ?? "100"));

  // Resolve caller identity & profile (if any).
  let userId: string | null = null;
  let callerRole: "citizen" | "officer" | "mayor" | null = null;
  try {
    const sbUser = await createSupabaseServer();
    const {
      data: { user },
    } = await sbUser.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await sbUser
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      callerRole = (profile?.role as any) ?? "citizen";
    }
  } catch {
    // Supabase not configured — anonymous demo path below.
  }

  try {
    // Authed citizens should only ever see their own rows. Officers/mayors
    // see the wider inbox, scoped by city/department filters as before.
    const useUserClient = userId && (callerRole !== "officer" && callerRole !== "mayor");
    const sb = useUserClient ? await createSupabaseServer() : getSupabaseAdmin();

    let q = sb.from("tickets").select("*").order("created_at", { ascending: false }).limit(limit);

    if (useUserClient) {
      q = q.eq("owner_id", userId);
    } else {
      if (cityId && cityId !== "other") q = q.eq("city_id", cityId);
      if (dept) q = q.eq("incident_kind", dept);
    }

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tickets: data ?? [], role: callerRole ?? role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase not configured";
    // Soft-fail: return empty list so dashboards can still render demo data.
    return NextResponse.json({ tickets: [], note: msg }, { status: 200 });
  }
}