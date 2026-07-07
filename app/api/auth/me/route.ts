import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";

export const runtime = "nodejs";

// GET /api/auth/me
// Returns the current user's profile, or { user: null } if logged out.
export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ user: null });
  return NextResponse.json({ user: profile });
}
