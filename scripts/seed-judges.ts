// Seed script: creates the three "hackathon judge" demo accounts used by the
// Sign In page's one-click role buttons.
//
// Run with:
//   npm run seed:judges
//
// Loads .env.local automatically (tsx doesn't, so we do it here).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader — no dependency on dotenv.
try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // no .env.local — fall through to env check below
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "JudgeDemo2026!";

const JUDGES = [
  {
    email: "judge.citizen@nagriktriage.in",
    display_name: "Judge · Citizen",
    role: "citizen" as const,
  },
  {
    email: "judge.officer@nagriktriage.in",
    display_name: "Judge · Nodal Officer",
    role: "officer" as const,
  },
  {
    email: "judge.mayor@nagriktriage.in",
    display_name: "Judge · City Administrator",
    role: "mayor" as const,
  },
];

async function main() {
  for (const j of JUDGES) {
    // Look up first; if the user already exists, recreate via admin API.
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === j.email);

    if (found) {
      // Update password + metadata to keep it deterministic.
      const { error } = await supabase.auth.admin.updateUserById(found.id, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: j.display_name, role: j.role },
      });
      // Make sure the profile row reflects the role.
      await supabase
        .from("profiles")
        .upsert({
          id: found.id,
          email: j.email,
          display_name: j.display_name,
          role: j.role,
        });
      console.log(
        error ? `✗ ${j.email}: ${error.message}` : `↻ ${j.email} (updated)`
      );
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: j.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: j.display_name, role: j.role },
    });
    if (error) {
      console.log(`✗ ${j.email}: ${error.message}`);
      continue;
    }
    // The trigger should also create the profile row, but we upsert to be
    // safe in case the trigger hasn't been installed yet.
    await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: j.email,
        display_name: j.display_name,
        role: j.role,
      });
    console.log(`✓ ${j.email} created`);
  }
  console.log("\nDone. Judges can sign in with password:", PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
