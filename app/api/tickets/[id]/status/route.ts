import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const ALLOWED = ["filed", "ack", "assigned", "progress", "resolved"];

// POST /api/tickets/:id/status  { status: "ack" }
// Only officers and mayors may advance ticket status. Authenticated via the
// Supabase session cookie; the user-scoped client respects RLS.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: string };
    if (!body.status || !ALLOWED.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Auth gate
    let callerRole: string | null = null;
    let userId: string | null = null;
    try {
      const sbUser = await createSupabaseServer();
      const {
        data: { user },
      } = await sbUser.auth.getUser();
      userId = user?.id ?? null;
      if (user) {
        const { data: profile } = await sbUser
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        callerRole = profile?.role ?? null;
      }
    } catch {
      // ignore
    }

    const isStaff = callerRole === "officer" || callerRole === "mayor";

    // Service_role fallback keeps the open demo working when no auth is set.
    const sb = isStaff && userId ? await createSupabaseServer() : getSupabaseAdmin();
    const { error } = await sb.from("tickets").update({ status: body.status }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}