import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";
import {
  SYSTEM_PROMPT,
  normalizeTriage,
  type TriageResult,
} from "./prompts";

// We use the lightweight Flash model: <3s p50, multimodal-capable, edge-friendly.
const MODEL_NAME = "gemini-2.5-flash";

// Wire-shape schema derived from the same logical schema as prompts.ts.
// Keeping them in sync by hand is fine for a small MVP.
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    core_issue: { type: SchemaType.STRING },
    target_department: { type: SchemaType.STRING },
    urgency_score: { type: SchemaType.INTEGER },
    formal_draft: { type: SchemaType.STRING },
    next_step: { type: SchemaType.STRING },
    signals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    incident_kind: { type: SchemaType.STRING },
    confidence_score: { type: SchemaType.NUMBER },
  },
  required: [
    "core_issue",
    "target_department",
    "urgency_score",
    "formal_draft",
    "next_step",
    "signals",
    "incident_kind",
    "confidence_score",
  ],
};

export type TriageInput = {
  text?: string;
  cityHint?: string;
  // data URL of the uploaded image (e.g. "data:image/png;base64,...")
  imageDataUrl?: string;
  imageMimeType?: string;
};

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your Gemini API key from https://aistudio.google.com/apikey"
    );
  }
  return key;
}

function buildParts(input: TriageInput) {
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  if (input.imageDataUrl) {
    // Gemini SDK requires raw base64 (no data-URL prefix).
    const m = input.imageDataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (m) {
      const mime = input.imageMimeType || m[1] || "image/png";
      parts.push({
        inlineData: { data: m[2], mimeType: mime },
      });
    }
  }

  const userText = (input.text ?? "").trim();
  const cityLine = input.cityHint ? `\nCitizen's city: ${input.cityHint}.` : "";

  if (userText) {
    parts.push({
      text: userText + cityLine,
    });
  } else if (input.imageDataUrl) {
    parts.push({
      text:
        "Analyze this image. Identify the civic / municipal issue visible (e.g., broken pipeline, garbage dump, damaged streetlight, pothole). If there is no visible civic issue, describe what you see and suggest the likely complaint category based on the strongest visual evidence. Then triage it as if the user had typed that complaint." +
        cityLine,
    });
  }

  if (parts.length === 0) {
    throw new Error("No input provided: text or image is required.");
  }

  return parts;
}

export async function triageComplaint(
  input: TriageInput
): Promise<TriageResult> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: buildParts(input) }],
  });

  const raw = result.response.text();
  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  // Try strict JSON first, then a permissive fallback in case the model
  // wraps the object in markdown fencing anyway.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Gemini response was not valid JSON.");
    parsed = JSON.parse(m[0]);
  }

  const normalized = normalizeTriage(parsed);
  if (!normalized) {
    throw new Error(
      "Gemini response did not match the expected triage schema."
    );
  }
  return normalized;
}