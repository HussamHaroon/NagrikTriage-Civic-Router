import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// POST /api/demo/clear
// Deletes every ticket owned by the logged-in user. Only the caller's own
// rows are touched — other users' tickets and the original seeded demo data
// (which has no owner) are left intact.
export async function POST() {
  let userId: string | null = null;
  try {
    const sbUser = await createSupabaseServer();
    const {
      data: { user },
    } = await sbUser.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // ignore
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in first." },
      { status: 401 }
    );
  }

  try {
    // Try the RLS-respecting client first.
    const sbUser = await createSupabaseServer();
    const { error } = await sbUser
      .from("tickets")
      .delete()
      .eq("owner_id", userId);

    if (error) {
      // Fallback to service_role.
      const sb = getSupabaseAdmin();
      const { error: err2 } = await sb
        .from("tickets")
        .delete()
        .eq("owner_id", userId);
      if (err2) {
        return NextResponse.json({ error: err2.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to clear data." },
      { status: 500 }
    );
  }
}
