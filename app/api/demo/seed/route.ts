import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// POST /api/demo/seed
// Inserts a handful of demo tickets for the logged-in user so the citizen
// dashboard / officer inbox / mayor view look populated for a hackathon
// judge in one click. The rows are owned by the caller so RLS shows them.
//
// Each call generates fresh ticket_ids so it can be run repeatedly.
function randId(cityId: string) {
  const city = (cityId || "IND").toUpperCase().slice(0, 3);
  const n = Math.floor(10000 + Math.random() * 90000);
  return `NT-${city}-${new Date().getFullYear()}-${n}`;
}

type Demo = {
  city_id: string;
  city_hint: string;
  core_issue: string;
  target_department: string;
  urgency_score: number;
  formal_draft: string;
  next_step: string;
  signals: string[];
  incident_kind: string;
  confidence_score: number;
  status: string;
};

const DEMO: Demo[] = [
  {
    city_id: "delhi",
    city_hint: "Delhi, NCR",
    core_issue: "Burst water main on Linking Road",
    target_department: "Delhi Jal Board",
    urgency_score: 9,
    formal_draft:
      "To the Executive Engineer, Delhi Jal Board: A burst water main on Linking Road near Lajpat Nagar is flooding the footpath and disrupting traffic for the last 6 hours. Immediate shutoff and repair is requested.",
    next_step: "Call DJB helpline 1916 and report exact landmark.",
    signals: ["water main burst", "traffic disruption", "6 hours ongoing"],
    incident_kind: "water",
    confidence_score: 0.94,
    status: "filed",
  },
  {
    city_id: "delhi",
    city_hint: "Delhi, NCR",
    core_issue: "Garbage pile up near community park",
    target_department: "Municipal Corporation of Delhi",
    urgency_score: 5,
    formal_draft:
      "To the Sanitation Officer, MCD: An uncollected garbage pile on 5th Avenue Road near the community park is causing foul smell and attracting stray dogs.",
    next_step: "Log a sanitation ticket on the MCD portal.",
    signals: ["garbage 7 days", "park nearby", "stray dogs"],
    incident_kind: "sanitation",
    confidence_score: 0.86,
    status: "ack",
  },
  {
    city_id: "mumbai",
    city_hint: "Mumbai, Maharashtra",
    core_issue: "Power outage 3 days in ward F-North",
    target_department: "BEST / Adani Electricity",
    urgency_score: 8,
    formal_draft:
      "To the Zonal Engineer, Adani Electricity Mumbai: Ward F-North has experienced continuous power outage for the last 3 days, affecting residents including senior citizens and patients on home medical equipment.",
    next_step: "Call Adani helpline 19122 and request restoration timeline.",
    signals: ["3 day outage", "hospital patients", "senior citizens"],
    incident_kind: "power",
    confidence_score: 0.93,
    status: "assigned",
  },
  {
    city_id: "mumbai",
    city_hint: "Mumbai, Maharashtra",
    core_issue: "Pothole near primary school entrance",
    target_department: "BMC (Brihanmumbai Municipal Corporation)",
    urgency_score: 7,
    formal_draft:
      "To the Roads Department, BMC: A large pothole on SV Road near the primary school entrance is a safety hazard for schoolchildren arriving in the morning.",
    next_step: "Mark with reflective cones and schedule repair within 48 hours.",
    signals: ["school zone", "large pothole", "morning rush"],
    incident_kind: "roads",
    confidence_score: 0.9,
    status: "progress",
  },
  {
    city_id: "bengaluru",
    city_hint: "Bengaluru, Karnataka",
    core_issue: "Brown foul-smelling water supply, illnesses reported",
    target_department: "BWSSB",
    urgency_score: 10,
    formal_draft:
      "To the Engineer, BWSSB: Residents of Ward 82 (HSR Layout) report brown, foul-smelling water supply for the past 48 hours with multiple cases of stomach illness reported.",
    next_step: "Issue public boil-water advisory and test supply immediately.",
    signals: ["contamination", "illness reported", "48 hours"],
    incident_kind: "water",
    confidence_score: 0.96,
    status: "resolved",
  },
  {
    city_id: "delhi",
    city_hint: "Delhi, NCR",
    core_issue: "Streetlight out for two weeks",
    target_department: "Municipal Corporation of Delhi",
    urgency_score: 4,
    formal_draft:
      "To the Electrical Wing, MCD: Streetlights on 4th Cross have been non-functional for two weeks, making the area unsafe after dark.",
    next_step: "File a streetlight complaint on the MCD portal.",
    signals: ["streetlight 14 days", "unsafe at night"],
    incident_kind: "streetlight",
    confidence_score: 0.88,
    status: "filed",
  },
];

export async function POST() {
  // Resolve the caller. Anonymous callers can't own tickets, so bail.
  let userId: string | null = null;
  try {
    const sbUser = await createSupabaseServer();
    const {
      data: { user },
    } = await sbUser.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Supabase not configured.
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in first — demo tickets are owned by your account." },
      { status: 401 }
    );
  }

  // Insert through the user-scoped client so RLS enforces ownership. If
  // something goes wrong there, fall back to the service_role admin client
  // (still stamping owner_id) so a misconfigured policy doesn't block judges.
  const rows = DEMO.map((d) => ({ ...d, ticket_id: randId(d.city_id), owner_id: userId }));

  try {
    const sbUser = await createSupabaseServer();
    const { error } = await sbUser.from("tickets").insert(rows);
    if (error) {
      // Fallback: admin client (bypasses RLS, still sets owner_id).
      const sb = getSupabaseAdmin();
      const { error: err2 } = await sb.from("tickets").insert(rows);
      if (err2) {
        return NextResponse.json({ error: err2.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to seed demo data." },
      { status: 500 }
    );
  }
}
