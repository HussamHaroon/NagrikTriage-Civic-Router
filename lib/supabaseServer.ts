// Server-side Supabase client that reads/writes the auth session through
// cookies. Used by Server Components, Route Handlers, and middleware.
//
// `@supabase/ssr` is the officially blessed package for Next.js App Router.
// The pattern below (createServerClient + a small cookie adapter) is the
// recommended setup from Supabase's docs.

import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }
  return { url, anon };
}

export async function createSupabaseServer() {
  const { url, anon } = env();
  const store = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          );
        } catch {
          // The `set` method was called from a Server Component that can't
          // mutate cookies. The middleware will refresh the session on the
          // next request. Safe to ignore.
        }
      },
    },
  });
}

// In Route Handlers (app/api/*) we can write cookies synchronously through
// a NextResponse, so expose a variant that lets the caller pass one in.
import type { NextResponse } from "next/server";

export async function createSupabaseServerForRouteHandler(
  res: NextResponse
) {
  const { url, anon } = env();
  const store = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => {
          store.set(name, value, options);
          res.cookies.set(name, value, options);
        });
      },
    },
  });
}
