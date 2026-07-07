// Browser-side Supabase client. Uses the publishable/anon key, which is
// designed to be embedded in the browser. All access is constrained by
// Row Level Security policies on the database.
//
// ⚠️  NEVER use the service_role key on the client. Service role bypasses
//     every security rule; leaking it is equivalent to publishing your DB.

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Don't throw at import time — only when actually used.
    return null;
  }
  return createBrowserClient(url, key);
}

export const SUPABASE_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);