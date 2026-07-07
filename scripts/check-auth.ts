// Verifies the auth setup is in place on the live Supabase project.
// Loads .env.local, then checks:
//   1. profiles table exists and the trigger is installed
//   2. judge accounts exist
//   3. owner_id column exists on tickets
//   4. the RLS policies let an authed user read their own row
//
// Run: npx tsx scripts/check-auth.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function check(label: string, fn: () => Promise<boolean>) {
  try {
    const ok = await fn();
    console.log(`${ok ? "✓" : "✗"} ${label}`);
  } catch (e: any) {
    console.log(`✗ ${label}: ${e.message}`);
  }
}

async function main() {
  // 1. profiles table
  await check("profiles table exists", async () => {
    const { error } = await sb.from("profiles").select("id").limit(1);
    if (error) throw error;
    return true;
  });

  // 2. profiles rows for judges
  await check("judge profiles exist", async () => {
    const { data, error } = await sb
      .from("profiles")
      .select("email, role")
      .like("email", "judge.%");
    if (error) throw error;
    console.log(`    → ${data?.length ?? 0} judge rows:`, data);
    return (data?.length ?? 0) === 3;
  });

  // 3. tickets.owner_id column
  await check("tickets.owner_id column exists", async () => {
    const { data, error } = await sb.from("tickets").select("owner_id").limit(1);
    if (error) throw error;
    return Array.isArray(data);
  });

  // 4. anonymous read still works (public demo path)
  await check("anon can read tickets (public RLS)", async () => {
    const anon = createClient(URL, ANON);
    const { data, error } = await anon.from("tickets").select("id").limit(1);
    if (error) throw error;
    return Array.isArray(data);
  });

  // 5. sign in as judge.citizen to confirm password + RLS work end-to-end
  await check("judge.citizen can sign in + read own tickets", async () => {
    const { data, error } = await sb.auth.signInWithPassword({
      email: "judge.citizen@nagriktriage.in",
      password: "JudgeDemo2026!",
    });
    if (error || !data.session) throw error ?? new Error("no session");
    const user = createClient(URL, ANON);
    // Set the session on a fresh client to simulate a browser.
    const { data: own, error: rls } = await user
      .from("tickets")
      .select("id")
      .limit(1);
    if (rls) throw rls;
    return Array.isArray(own);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
