// Proxy (formerly "middleware" in Next 15 and earlier): refreshes the
// Supabase session on every request and hands the refreshed tokens back to
// the browser via cookies. This is the standard @supabase/ssr pattern and is
// required for sessions to persist across Server Components / Route Handlers.
//
// Next 16 renamed the file convention from `middleware.ts` to `proxy.ts`
// and the entrypoint export from `middleware` to `proxy`.

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, don't touch the request — the app still
  // works in "demo mode" off localStorage.
  if (!url || !anon) return NextResponse.next();

  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => {
          // Set on the outgoing response so the browser persists it.
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() refreshes the access token if it's about to expire and writes
  // the new cookies to `res`.
  await supabase.auth.getUser();

  return res;
}

export const config = {
  // Run on every path except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
