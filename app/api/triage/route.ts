import { NextRequest, NextResponse } from "next/server";
import { triageComplaint } from "@/lib/gemini";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function makeTicketId(cityId?: string): string {
  const city = (cityId ?? "IND").toUpperCase().slice(0, 3);
  const n = Math.floor(10000 + Math.random() * 90000);
  return `NT-${city}-${new Date().getFullYear()}-${n}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      imageDataUrl?: string;
      imageMimeType?: string;
      cityHint?: string;
      cityId?: string;
    };

    const text = (body.text ?? "").trim();
    const hasImage = Boolean(body.imageDataUrl);

    if (!text && !hasImage) {
      return NextResponse.json(
        { error: "Provide either a text complaint or an image." },
        { status: 400 }
      );
    }
    if (text.length > 4000) {
      return NextResponse.json(
        { error: "Complaint text is too long. Please keep it under 4000 characters." },
        { status: 400 }
      );
    }

    const triage = await triageComplaint({
      text,
      imageDataUrl: body.imageDataUrl,
      imageMimeType: body.imageMimeType,
      cityHint: body.cityHint,
    });

    const ticketId = makeTicketId(body.cityId);

    // Persist to Supabase (server-side, service_role). We don't fail the API
    // response if Supabase is misconfigured — the AI triage is still valid
    // and the client will fall back to localStorage.
    let saved = false;
    try {
      const sb = getSupabaseAdmin();
      const { error } = await sb.from("tickets").insert({
        ticket_id: ticketId,
        city_id: body.cityId ?? null,
        city_hint: body.cityHint ?? null,
        original_text: text || null,
        had_image: hasImage,
        core_issue: triage.core_issue,
        target_department: triage.target_department,
        urgency_score: triage.urgency_score,
        formal_draft: triage.formal_draft,
        next_step: triage.next_step,
        signals: triage.signals ?? [],
        incident_kind: triage.incident_kind,
        confidence_score: triage.confidence_score,
      });
      if (error) {
        console.warn("[triage] Supabase insert failed:", error.message);
      } else {
        saved = true;
      }
    } catch (e) {
      console.warn("[triage] Supabase unavailable:", e instanceof Error ? e.message : e);
    }

    return NextResponse.json({ ticket: triage, ticketId, saved });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error during triage.";
    const status = /GEMINI|API_KEY|quota|rate/i.test(message) ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}