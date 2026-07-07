import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerForRouteHandler } from "@/lib/supabaseServer";
import { ROLE_HOME, type Role } from "@/lib/role";

export const runtime = "nodejs";

const VALID_ROLES: Role[] = ["citizen", "officer", "mayor"];

// POST /api/auth/signup
//   { email, password, displayName?, role? }
// Creates a real Supabase Auth user. The DB trigger (see supabase/auth.sql)
// automatically creates the matching profile row using the `display_name`
// and `role` passed in `user_metadata`.
export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim();
  const roleRaw = String(body.role ?? "citizen") as Role;
  const role: Role = VALID_ROLES.includes(roleRaw) ? roleRaw : "citizen";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true });
  const sb = await createSupabaseServerForRouteHandler(res);

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
        role,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If email confirmation is enabled in Supabase, no session yet.
  if (!data.session) {
    return NextResponse.json({
      ok: true,
      needsConfirmation: true,
      message:
        "Check your inbox — we sent a verification link. Click it, then sign in.",
    });
  }

  return NextResponse.json(
    { ok: true, redirect: ROLE_HOME[role], role },
    { headers: res.headers }
  );
}
