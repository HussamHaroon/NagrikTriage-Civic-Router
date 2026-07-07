import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerForRouteHandler } from "@/lib/supabaseServer";
import { ROLE_HOME, type Role } from "@/lib/role";

export const runtime = "nodejs";

// POST /api/auth/signin
//   { email, password }
// Authenticates against Supabase Auth. On success the session is stored in
// cookies (set automatically by @supabase/ssr) and the client redirects to
// the dashboard for the user's role.
export async function POST(req: NextRequest) {
  let email: string | undefined;
  let password: string | undefined;
  try {
    const body = await req.json();
    email = body.email;
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true });
  const sb = await createSupabaseServerForRouteHandler(res);

  const { data, error } = await sb.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password: String(password),
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid email or password." },
      { status: 401 }
    );
  }

  // Determine role from profile (trigger should have created it).
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role as Role) ?? "citizen";
  return NextResponse.json({ ok: true, redirect: ROLE_HOME[role], role }, {
    headers: res.headers,
  });
}
