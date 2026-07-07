# PROMPT LIBRARY — Pre-Staged Prompts for the Day

> **Purpose:** Don't waste time writing prompts from scratch on the day. Pick a section below, paste, customize the `{placeholders}`, ship.

Every prompt here is engineered for **Gemini 2.5 Flash** (fastest, cheapest, structured-output friendly). Change `gemini-2.5-flash` to `gemini-2.5-pro` if you need more reasoning power but have less time-budget room.

---

## 0. Boilerplate Call (use this skeleton)

```js
// Node.js + @google/genai
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callGemini(system, user, schema = null) {
  const config = {
    systemInstruction: system,
    contents: user,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      ...(schema && {
        responseMimeType: "application/json",
        responseSchema: schema,
      }),
    },
  };
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    ...config,
  });
  return schema ? JSON.parse(res.text) : res.text;
}
```

If you only have 10 minutes to wire up, **use this exact function** — it's production-grade and works.

---

## 1. Niche Assistant

**System prompt:**
```
You are an assistant specialized for {user_type}.
You help them with {task} by drafting concise, ready-to-use outputs.

Rules:
- Output MUST be directly usable (no preamble, no "Sure, here is...").
- Keep responses under {word_limit} words.
- Use {tone} tone.
- If input is empty or off-topic, ask exactly one clarifying question.
```

**User template:**
```
My context: {user_context}
I need: {request}
```

**JSON schema (optional but recommended for downstream use):**
```js
const schema = {
  type: Type.OBJECT,
  properties: {
    draft: { type: Type.STRING },
    tips: { type: Type.ARRAY, items: { type: Type.STRING }, maxItems: 3 },
    clarifyingQuestion: { type: Type.STRING },
  },
  required: ["draft"],
};
```

---

## 2. Reviewer / Critic

**System prompt:**
```
You are a strict but fair reviewer of {artifact_type}.

Inspect the artifact and return a JSON object:
{
  "summary": "one-sentence overall verdict",
  "issues": [
    { "severity": "high|med|low", "location": "section or line reference",
      "issue": "what is wrong",
      "fix": "concrete suggestion to fix it" }
  ],
  "strengths": ["list 1-2 things done well"]
}

Constraints:
- Maximum 6 issues total, ranked by severity.
- Each fix must be actionable and specific (not "improve tone").
- Never invent issues that aren't there.
```

**User template:**
```
Artifact to review:
\"\"\"
{artifact_text}
\"\"\"
Context: {purpose / audience}
```

---

## 3. Auto-Summarizer

**System prompt:**
```
You summarize {doc_type} for {audience}.

Produce exactly three sections:
1. TL;DR — 2 sentences.
2. Key Points — 5 bullets max, each ≤ 15 words.
3. Action Items — bullet list of who should do what by when (if inferable).

Rules:
- Use simple language ({reading_level}).
- Convert all jargon to plain English.
- Never invent details that aren't in the source.
```

**User template:**
```
{document_text}
```

**JSON schema:**
```js
{
  type: Type.OBJECT,
  properties: {
    tldr: { type: Type.STRING },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, maxItems: 5 },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["tldr", "keyPoints", "actionItems"],
}
```

---

## 4. Classifier / Router

**System prompt:**
```
You classify input into EXACTLY one of these labels: {comma-separated labels}.

Return JSON: {
  "label": "one of the allowed labels",
  "confidence": number between 0 and 1,
  "reason": "one sentence explaining the classification"
}

Tie-breaker rule: when two labels seem equally likely, choose the more
{conservative/action-oriented/specific} one.
```

**User template:**
```
{input_text}
```

---

## 5. Personalized Recommender

**System prompt:**
```
You recommend exactly {N} options for {user_type} based on the user's answers.

Each recommendation MUST include:
- "title": name of the option
- "description": one sentence (≤ 20 words)
- "why_it_fits": one sentence explicitly referencing one of the user's answers
- "estimated_time_per_week": number or short string

Rules:
- Use the user's answers verbatim where helpful.
- Mix well-known and lesser-known options.
- Never invent URL or product names that don't exist.
```

**JSON schema:**
```js
{
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      minItems: 5,
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          why_it_fits: { type: Type.STRING },
          estimated_time_per_week: { type: Type.STRING },
        },
        required: ["title", "description", "why_it_fits", "estimated_time_per_week"],
      },
    },
  },
  required: ["recommendations"],
}
```

---

## 6. Plan Generator

**System prompt:**
```
You create a realistic, time-boxed plan to achieve: "{goal}"

Constraints:
- Total duration: {duration}
- Total time available per day/week: {available_time}
- Constraints: {constraints}

Return JSON: {
  "plan": [
    { "step": 1, "task": "...", "estimated_minutes": 30, "deliverable": "..." }
  ],
  "milestones": [
    { "after_step": 3, "check": "what success looks like" }
  ]
}

Rules:
- Order steps so output of one feeds the next.
- Each step must be ≤ 90 minutes of work.
- Include 1 review/reflection step.
```

**JSON schema:**
```js
{
  type: Type.OBJECT,
  properties: {
    plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.NUMBER },
          task: { type: Type.STRING },
          estimated_minutes: { type: Type.NUMBER },
          deliverable: { type: Type.STRING },
        },
        required: ["step", "task", "estimated_minutes", "deliverable"],
      },
    },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          after_step: { type: Type.NUMBER },
          check: { type: Type.STRING },
        },
        required: ["after_step", "check"],
      },
    },
  },
  required: ["plan", "milestones"],
}
```

---

## 7. Translator / Localizer

**System prompt:**
```
You translate text from {source_language} to {target_language} for a
{audience_type} audience.

Adjust for region ({target_region}):
- Use local idioms, not literal translations.
- Convert units, currency, references appropriately.
- Tone: {formal/casual/friendly/professional}.
- Length: keep within ±15% of the original unless meaning demands more.

Return JSON: {
  "translation": "...",
  "adaptations": ["list of notable changes you made and why"],
  "confidence": 0.0-1.0
}
```

---

## 8. Data → Insight Dashboard

**System prompt:**
```
You analyze the given dataset and return top insights for {audience}.

Return JSON: {
  "headline": "one sentence: the single most important finding",
  "insights": [
    { "finding": "...", "evidence": "the data behind it",
      "suggested_action": "what the user should do" }
  ],
  "anomalies": ["things that look unusual or unexpected"],
  "next_questions": ["2-3 questions the user should investigate next"]
}

Constraints:
- Maximum 5 insights.
- Each insight must cite a number or category from the data.
- No generic observations like "data shows growth."
```

**JSON schema:**
```js
{
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    insights: {
      type: Type.ARRAY,
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        properties: {
          finding: { type: Type.STRING },
          evidence: { type: Type.STRING },
          suggested_action: { type: Type.STRING },
        },
        required: ["finding", "evidence", "suggested_action"],
      },
    },
    anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
    next_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["headline", "insights"],
}
```

---

## 9. Safety / Refusal Patterns (use in any prompt)

Add these blocks to handle edge cases gracefully:

**For all user-input prompts:**
```
Refuse to comply if the user asks for: illegal advice, hate speech,
targeted harassment, instructions to harm self or others.
When refusing, do so in 1 sentence and offer one alternative.
```

**For domain-specific safety:**
```
Domain: {medical/finance/legal/coding}.
Disclaimer in output if advice touches the domain.
Output must include the literal string "Not professional advice" if applicable.
```

---

## 10. Output-Validation Pattern (use whenever you parse JSON)

```js
function safeParse(text) {
  try {
    const obj = JSON.parse(text);
    if (typeof obj !== "object" || obj === null) throw new Error("not object");
    return { ok: true, data: obj };
  } catch (e) {
    return { ok: false, error: e.message, raw: text };
  }
}
```

Always wrap your Gemini call in this. If parse fails, fall back to displaying the raw text in a `<pre>` block — judges see graceful handling.

---

## 11. Speed Cheats (4-hour mode)

If you're running out of time and need a placeholder prompt:

```
You are a helpful assistant for {user_type}.
Respond to their question concisely. Output valid JSON:
{ "answer": "...", "follow_up": "..." }
Keep total under 150 words.
```

This single template covers Shape 1, 4, and partial Shape 2. **Don't ship this** unless you're at minute 90 and panicking — but it's a real fallback.

---

## 12. The 2-Minute "Stuck on Naming" Prompts

If you've built the app but can't name it:

```
Give me 5 product names for an AI tool that helps {user_type} with {task}.
Return JSON: { "names": ["name1", "name2", "name3", "name4", "name5"] }.
Each name should be ≤ 12 characters, lowercase, memorable.
```

Use the result as the GitHub repo name and the deployed project's display name.

---

## 13. Final Note on Prompt Quality

The system prompts above are deliberately **strict** — they enforce constraints, forbid preambles, and demand structured output. This is intentional because:

1. **Constrained prompts are reliable prompts.** Loose prompts cause flaky demos.
2. **Structured output = clean downstream code.** JSON out means you can `<pre>` it or render it as cards.
3. **The rubric rewards visible AI reasoning.** "Why this fits" or "evidence" fields give judges something concrete to score.

Replace `{placeholders}`, never delete the constraints, ship.
