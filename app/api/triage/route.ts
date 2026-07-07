import { NextRequest, NextResponse } from "next/server";
import { triageComplaint } from "@/lib/gemini";

export const runtime = "nodejs";
// Edge-ready: this route runs server-side. We keep it nodejs because the
// Gemini SDK is a Node-targeted client.

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      imageDataUrl?: string;
      imageMimeType?: string;
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
    });

    return NextResponse.json({ ticket: triage });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error during triage.";
    // Map GEMINI-related failures to 502 so the UI can show "service issue".
    const status = /GEMINI|API_KEY|quota|rate/i.test(message) ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}