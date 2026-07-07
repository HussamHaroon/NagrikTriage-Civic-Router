# 🧠 NagrikTriage — Prompt Workflow & Strategy

This document details the exact prompt engineering design, JSON contracts, and Gemini workflows utilized in **NagrikTriage**.

## 1. System Prompt

This is the system instruction sent to the model with every request, specifying the routing rules, classification rules, translation instructions, and safety parameters:

```text
You are an expert Indian municipal civic routing AI.
The user will provide a complaint in any language (English, Hindi, Hinglish, or regional Indian languages).
Your job is to analyze it and return a STRICT JSON object only — no prose, no markdown, no backticks.

Rules:
1. Translate and summarize the core issue in MAX 5 words.
2. Identify the correct Indian municipal department (e.g., PWD, Jal Board / Municipal Water Board, Sanitation Department, BESCOM / Power DISCOM, Municipal Corporation, Health Department, Public Works, etc.).
3. Assign an urgency_score from 1-10 (10 being life-threatening or severe infrastructure failure).
4. Draft a formal, polite, 3-sentence English complaint ready to be emailed to the authorities. Include the inferred location context if visible in the input.
5. Provide ONE immediate "next_step" the citizen can take (attach a photo, call a helpline, post on ward portal, etc.).
6. List 2-4 short "signals" — the specific evidence in the input that drove your urgency score. Each signal must be a short phrase (max 8 words). Example: ["power outage 3+ days", "hospital nearby", "children at risk"].
7. Classify the incident_kind into exactly ONE of: water, power, sanitation, roads, streetlight, health, fire, police, other.
8. Provide a confidence_score between 0 and 1 indicating how certain you are in the classification and urgency. Lower if input is vague, higher if specific.

Respond ONLY with valid JSON matching the schema exactly. Do not include any extra keys.
```

---

## 2. Structured JSON Output Schema

We use Gemini's native `responseSchema` validation (via `@google/generative-ai` SDK) to enforce a strict output contract. This guarantees type safety downstream and prevents LLM formatting leakage:

```json
{
  "type": "object",
  "properties": {
    "core_issue": {
      "type": "string",
      "description": "Concise summary, max 5 words"
    },
    "target_department": {
      "type": "string",
      "description": "Indian municipal department name"
    },
    "urgency_score": {
      "type": "integer",
      "description": "1-10 priority score, 10 most severe",
      "minimum": 1,
      "maximum": 10
    },
    "formal_draft": {
      "type": "string",
      "description": "3-sentence formal English complaint email"
    },
    "next_step": {
      "type": "string",
      "description": "One immediate action the citizen should take"
    },
    "signals": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Short evidence phrases that drove the urgency score"
    },
    "incident_kind": {
      "type": "string",
      "description": "One of: water, power, sanitation, roads, streetlight, health, fire, police, other"
    },
    "confidence_score": {
      "type": "number",
      "description": "0-1 confidence in the classification"
    }
  },
  "required": [
    "core_issue",
    "target_department",
    "urgency_score",
    "formal_draft",
    "next_step",
    "signals",
    "incident_kind",
    "confidence_score"
  ]
}
```

---

## 3. Multimodal Prompt Construction (Text & Image)

### A. Text-Only Complaint Flow
When a citizen types or records voice inputs, we combine the complaint text with their selected location context (e.g. city) and pass it directly to Gemini.
* **User Input Example:** `"Bhai, Palam flyover ke neeche sewer block hai aur pani road par aa raha hai, bahut gandi smell hai."`
* **Appended Location Context:** `"\nCitizen's city: Delhi."`

### B. Multimodal Image Triage Flow
If a citizen uploads a photo of the incident (e.g., a pothole or a broken transformer) without typing any text, we pass the image as an inline base64 data part to the model along with the following instructional user prompt:
* **Multimodal User Prompt:**
  ```text
  Analyze this image. Identify the civic / municipal issue visible (e.g., broken pipeline, garbage dump, damaged streetlight, pothole). If there is no visible civic issue, describe what you see and suggest the likely complaint category based on the strongest visual evidence. Then triage it as if the user had typed that complaint.
  ```
* **Appended Location Context:** `"\nCitizen's city: Mumbai."`

---

## 4. Verbatim Input/Output Executions

### Example 1: Multilingual Hinglish input
* **Input Text:** `"Mera paani nahi aa raha 3 din se in Rohini, please help, bad smell also coming from tap"`
* **Location Hint:** `Delhi`
* **Model Output JSON:**
```json
{
  "core_issue": "Water supply issues and contamination",
  "target_department": "Delhi Jal Board (DJB)",
  "urgency_score": 8,
  "formal_draft": "To the Delhi Jal Board authority, I am writing to report that there has been no water supply in our locality in Rohini for the past three days. Furthermore, the water that occasionally flows has a strong, unpleasant smell, suggesting contamination. I request immediate inspection and resolution of this issue to restore clean water supply. Thank you.",
  "next_step": "Submit this draft to the local ward portal and request water tanker supply in the interim.",
  "signals": [
    "no water supply for 3 days",
    "tap water smells bad",
    "Rohini locality",
    "potential contamination health hazard"
  ],
  "incident_kind": "water",
  "confidence_score": 0.95
}
```

### Example 2: Multimodal Visual Input (Citizen uploads a photo of a garbage heap)
* **Input Photo:** (Image showing garbage piles blocking a street corner)
* **Location Hint:** `Bengaluru`
* **Model Output JSON:**
```json
{
  "core_issue": "Street blocked by garbage dump",
  "target_department": "Bruhat Bengaluru Mahanagara Palike (BBMP) Solid Waste Management",
  "urgency_score": 7,
  "formal_draft": "To the concerned BBMP authority, I am writing to report a major accumulation of municipal solid waste blocking the street corner. This accumulation is causing strong odors and attracting stray animals, creating unsanitary conditions for the residents. I request the immediate dispatch of a garbage clearance team to clean the area. Thank you.",
  "next_step": "Report the issue on the BBMP Sahaaya portal with the photo attached.",
  "signals": [
    "uncollected garbage pile",
    "blocking street corner",
    "sanitary risk",
    "odor and animal attraction"
  ],
  "incident_kind": "sanitation",
  "confidence_score": 0.9
}
```

---

## 5. Safety, Fallback & Verification Guardrails

1. **Deterministic Structured Parsing**: The client/server utilizes a try-catch loop to handle raw JSON strings. If JSON parsing fails (extremely rare with `responseSchema`), a regex pattern matching `/\{[\s\S]*\}/` extracts the object, preventing raw markdown backticks from breaking the pipeline.
2. **Runtime Verification Guard (`normalizeTriage`)**: A strict TypeScript function checks that all essential fields (`core_issue`, `target_department`, `urgency_score`, `formal_draft`, `next_step`) exist and that `urgency_score` is a valid integer between 1 and 10. If validation fails, the app fumbles back to a clean mock response indicating the issue, protecting the UI from crashing.
3. **Safety Refusal Handling**: Standard safety boundaries are configured via Gemini's API parameters to prevent jailbreaking or irrelevant off-topic inputs from generating municipal tickets.
