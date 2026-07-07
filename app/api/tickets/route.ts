import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// GET /api/tickets?role=officer&dept=water&cityId=delhi&limit=100
// GET /api/tickets?role=mayor&cityId=delhi
// GET /api/tickets?role=citizen
//
// This is a tiny server-side filter. It does not authenticate users — for a
// real deployment you'd gate this behind auth + RLS. For the hackathon demo
// the data is open to anyone with the URL, which is fine.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const role = sp.get("role") ?? "citizen";
  const dept = sp.get("dept"); // e.g. "water"
  const cityId = sp.get("cityId");
  const limit = Math.min(500, Number(sp.get("limit") ?? "100"));

  try {
    const sb = getSupabaseAdmin();
    let q = sb.from("tickets").select("*").order("created_at", { ascending: false }).limit(limit);

    if (cityId && cityId !== "other") q = q.eq("city_id", cityId);
    if (dept) q = q.eq("incident_kind", dept);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tickets: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase not configured";
    // Soft-fail: return empty list so dashboards can still render demo data.
    return NextResponse.json({ tickets: [], note: msg }, { status: 200 });
  }
}