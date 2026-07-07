import { NextRequest, NextResponse } from "next/server";
import { triageComplaint } from "@/lib/gemini";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

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

    // Look up the logged-in user so we can stamp owner_id. Falls back to
    // service_role insert (no owner) when the caller is anonymous — that
    // keeps the no-auth demo path working.
    let ownerId: string | null = null;
    try {
      const sbUser = await createSupabaseServer();
      const {
        data: { user },
      } = await sbUser.auth.getUser();
      ownerId = user?.id ?? null;
    } catch {
      // ignore — anonymous
    }

    // Persist to Supabase. We use the user-scoped client when authenticated
    // (so RLS enforces the owner_id = auth.uid() rule), otherwise fall back
    // to the service_role admin client for anonymous demo inserts.
    let saved = false;
    try {
      const insertPayload = {
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
        owner_id: ownerId,
      };

      let insertError;
      if (ownerId) {
        // Authed path: respect RLS.
        const sbUser = await createSupabaseServer();
        ({ error: insertError } = await sbUser.from("tickets").insert(insertPayload));
      } else {
        // Anonymous demo path: bypass RLS with service_role.
        const sb = getSupabaseAdmin();
        ({ error: insertError } = await sb.from("tickets").insert(insertPayload));
      }

      if (insertError) {
        console.warn("[triage] Supabase insert failed:", insertError.message);
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