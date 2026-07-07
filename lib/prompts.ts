// Single source of truth for the NagrikTriage AI pipeline.
// Both the text-only and image-augmented flows route through the same schema.

export const SYSTEM_PROMPT = `You are an expert Indian municipal civic routing AI.
The user will provide a complaint in any language (English, Hindi, Hinglish, or regional Indian languages).
Your job is to analyze it and return a STRICT JSON object only — no prose, no markdown, no backticks.

Rules:
1. Translate and summarize the core issue in MAX 5 words.
2. Identify the correct Indian municipal department (e.g., PWD, Jal Board / Municipal Water Board, Sanitation Department, BESCOM / Power DISCOM, Municipal Corporation, Health Department, Public Works, etc.).
3. Assign an urgency_score from 1-10 (10 being life-threatening or severe infrastructure failure).
4. Draft a formal, polite, 3-sentence English complaint ready to be emailed to the authorities. Include the inferred location context if visible in the input.
5. Provide ONE immediate "next_step" the citizen can take (attach a photo, call a helpline, post on ward portal, etc.).

Respond ONLY with valid JSON matching the schema exactly. Do not include any extra keys.`;

// JSON Schema for Structured Outputs (Gemini responseSchema).
// We hand Gemini a schema so it cannot hallucinate keys or return prose.
export const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    core_issue: { type: "string", description: "Concise summary, max 5 words" },
    target_department: {
      type: "string",
      description: "Indian municipal department name",
    },
    urgency_score: {
      type: "integer",
      description: "1-10 priority score, 10 most severe",
      minimum: 1,
      maximum: 10,
    },
    formal_draft: {
      type: "string",
      description: "3-sentence formal English complaint email",
    },
    next_step: {
      type: "string",
      description: "One immediate action the citizen should take",
    },
  },
  required: [
    "core_issue",
    "target_department",
    "urgency_score",
    "formal_draft",
    "next_step",
  ],
} as const;

export type TriageResult = {
  core_issue: string;
  target_department: string;
  urgency_score: number;
  formal_draft: string;
  next_step: string;
};

// Cheap runtime guard: if the model misbehaves we still return a sane shape
// instead of crashing the UI.
export function normalizeTriage(raw: unknown): TriageResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const need = [
    "core_issue",
    "target_department",
    "urgency_score",
    "formal_draft",
    "next_step",
  ];
  for (const k of need) {
    if (r[k] === undefined || r[k] === null) return null;
  }
  const score = Number(r.urgency_score);
  if (!Number.isFinite(score) || score < 1 || score > 10) return null;
  return {
    core_issue: String(r.core_issue).trim(),
    target_department: String(r.target_department).trim(),
    urgency_score: Math.max(1, Math.min(10, Math.round(score))),
    formal_draft: String(r.formal_draft).trim(),
    next_step: String(r.next_step).trim(),
  };
}