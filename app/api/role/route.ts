import { NextRequest, NextResponse } from "next/server";
import { writeRoleCookie, ROLE_HOME, type Role } from "@/lib/role";

export const runtime = "nodejs";

// POST /api/role { role: "citizen" | "officer" | "mayor" }
//
// Demo-only: sets a cookie and returns where the client should redirect.
// No auth. No DB. Just sets a session marker.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { role?: string };
    const role = body.role as Role;
    if (role !== "citizen" && role !== "officer" && role !== "mayor") {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    writeRoleCookie(role);
    return NextResponse.json({ ok: true, redirect: ROLE_HOME[role] });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}