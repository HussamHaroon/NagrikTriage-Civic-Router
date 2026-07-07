// Cookie-based "fake auth" for the demo. In production we'd use Supabase Auth
// or Clerk; here we just remember which persona the judge picked so the three
// dashboards feel distinct and personalized.

import "server-only";
import { cookies } from "next/headers";

export type Role = "citizen" | "officer" | "mayor";
const COOKIE = "nagrik_role";

const VALID: Role[] = ["citizen", "officer", "mayor"];

export async function readRoleCookie(): Promise<Role> {
  try {
    const store = await cookies();
    const c = store.get(COOKIE)?.value;
    if (c && (VALID as string[]).includes(c)) return c as Role;
  } catch {
    // outside request scope (e.g. RSC static prerender) → default
  }
  return "citizen";
}

export async function writeRoleCookie(role: Role) {
  try {
    const store = await cookies();
    store.set(COOKIE, role, {
      path: "/",
      httpOnly: false, // demo, so client-side role chip can read it too
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    // ignore during static prerender
  }
}

// Map a chosen role to the home route it should land on.
export const ROLE_HOME: Record<Role, string> = {
  citizen: "/citizen",
  officer: "/officer",
  mayor: "/mayor",
};

export const ROLE_LABEL: Record<Role, string> = {
  citizen: "Citizen",
  officer: "Nodal Officer",
  mayor: "City Administrator",
};