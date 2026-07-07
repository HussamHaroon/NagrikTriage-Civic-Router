// SERVER-ONLY Supabase client. Uses the service_role key which:
//   - bypasses Row Level Security
//   - can read/write any row in any table
//   - MUST stay on the server
//
// Only import this file from API routes or server components. Never from a
// "use client" file. The presence of `import "server-only"` makes that
// constraint a build-time error instead of a silent leak.

import "server-only";
import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}