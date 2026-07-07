# 🇮🇳 NagrikTriage — Smart Bharat Civic Companion

> **Tagline:** Turning messy, multilingual citizen frustration into structured, actionable government tickets.

NagrikTriage is a GenAI-powered civic triage platform built for the **Smart Bharat** problem statement. Citizens rant in Hinglish, Hindi, Tamil, Telugu, Bengali, Marathi, or English — by voice, text, or photo. NagrikTriage translates, classifies, scores urgency, and produces a formal complaint email ready to send to the **real** municipal department, in the citizen's city, with the **real** helpline number. Sub-3-second response on Gemini 2.5 Flash.

This is not a chatbot. It is an **active data pipeline**: speech-to-text → translation → classification → sentiment/urgency analysis → explainability → formal text generation, all wrapped in a two-sided marketplace (citizen view ↔ officer dashboard).

---

## ✨ Features

### Citizen side (`/`)
- 🗣️ **Multilingual input** — text, voice (Web Speech API), or photo
- 🏛️ **Auto department routing** — picks from a curated table of 8 Indian metros
- 🚨 **Urgency scoring 1–10** — color-coded badge (Red ≥8, Amber 4–7, Green ≤3)
- 🚑 **Emergency banner** — when urgency ≥ 8, surfaces 112 + city helplines as one-tap `tel:` links
- 🔍 **AI explainability panel** — "Why this score?" with extracted signals (e.g. *"live wire", "children nearby"*)
- 🆚 **Comparison view** — citizen rant vs. formal draft, side by side
- 📋 **Duplicate radar** — warns when neighbors filed the same issue
- ✉️ **Copy / WhatsApp / PNG / Audio** — four ways out: clipboard, WhatsApp deep-link, downloadable image, TTS read-aloud
- 🛡️ **PII detection** — auto-mask phone/Aadhaar/plate/email before sharing
- 🕒 **Local history** — last 16 tickets, ticket IDs (`NT-CITY-2026-NNNNN`)
- 🌐 **UI in 6 languages** — English, हिन्दी, தமிழ், বাংলা, తెలుగు, मराठी
- 📍 **Location pin** — `navigator.geolocation`, lat/lng forwarded to the AI for context

### Track side (`/track`)
- Live status timeline (Filed → Acknowledged → Assigned → In progress → Resolved)
- Speed scales with urgency (critical = faster progression)
- Per-ticket ID lookup, click any history entry to drill in

### Officer side (`/dashboard`)
- City heat-map (Leaflet + OpenStreetMap — **free, no API key**)
- Markers sized + colored by urgency, popups show ticket ID, kind, urgency
- Seeded synthetic complaints per city so the dashboard looks alive even before citizens file
- Per-department breakdown cards, real helplines/emails
- Aggregate stats: total, critical count, breakdown by incident kind

---

## 🧠 The AI Workflow

### System Prompt (excerpt — see `lib/prompts.ts` for full)

> You are an expert Indian municipal civic routing AI. The user will provide a complaint in any language. Your job is to analyze it and return a **strict JSON object**.
>
> 1. Summarize the core issue in max 5 words.
> 2. Identify the correct Indian municipal department.
> 3. Assign an `urgency_score` from 1–10 (10 = life-threatening).
> 4. Draft a formal, polite, 3-sentence English complaint.
> 5. Provide one immediate `next_step` for the citizen.
> 6. List 2–4 short "signals" — the specific evidence that drove your urgency score.
> 7. Classify the `incident_kind` (water | power | sanitation | roads | streetlight | health | fire | police | other).
> 8. Provide a `confidence_score` between 0 and 1.

### JSON Output Schema

```json
{
  "core_issue": "Live electric wire",
  "target_department": "BSES / Tata Power Delhi",
  "urgency_score": 10,
  "formal_draft": "To the concerned authority, …",
  "next_step": "Call 112 immediately and stay 10 meters away.",
  "signals": ["live wire on footpath", "sparks visible", "children walk past"],
  "incident_kind": "power",
  "confidence_score": 0.92
}
```

The schema is enforced server-side via Gemini's `responseSchema` and re-validated with a runtime guard (`normalizeTriage`) so malformed AI output never crashes the UI.

---

## 🚀 Quick Start

```bash
# 1. Install
cd nagriktriage
npm install

# 2. Add your Gemini API key
cp .env.local.example .env.local
# then edit .env.local and set GEMINI_API_KEY=...
# Get a free key at: https://aistudio.google.com/apikey

# 3. Run dev server
npm run dev
# open http://localhost:3000

# 4. Production build
npm run build
npm start
```

---

## 🏗️ Architecture

```
app/
├── layout.tsx              # Root layout, metadata, font
├── page.tsx                # Citizen UI (hero, input, result, history, share, TTS, PII)
├── globals.css             # Tailwind + custom keyframes
├── track/page.tsx          # Live status timeline
├── dashboard/page.tsx      # Officer view: Leaflet map + per-city stats
└── api/triage/route.ts     # POST /api/triage — server-side Gemini call

lib/
├── prompts.ts              # System prompt, JSON schema, runtime normalizer
├── gemini.ts               # Gemini client (text + image parts, responseSchema)
├── history.ts              # localStorage history hook + duplicate detection
├── cities.ts               # 8 cities × real departments + helplines + map centers
├── useSpeech.ts            # Web Speech API (STT + TTS) hook
├── pii.ts                  # Phone/Aadhaar/plate/email detection + masking
└── i18n.ts                 # UI strings for 6 languages
```

**Separation of concerns:** UI (`page.tsx`) → API route (`route.ts`) → Gemini SDK (`gemini.ts`) → Render.

**Error handling:** empty inputs, oversized payloads, missing API key, malformed AI responses are all caught and surfaced to the UI as readable messages. Status codes: 400 (client), 502 (Gemini), 500 (unexpected).

---

## 🛡️ Rubric Defense

| Pillar | How NagrikTriage scores |
|---|---|
| **Innovation** | Not a FAQ chatbot — an *active two-sided triage agent*. Citizen ↔ Officer. Speech → text → schema-constrained JSON → real municipal routing. |
| **Problem alignment** | Directly addresses *Smart Bharat*: report public issues + multilingual + transparency + accessibility + tracking + dashboard. |
| **AI usage** | Gemini 2.5 Flash is used as an **intelligent data pipeline** (translate → classify → score → explain → generate), not a conversational wrapper. Strict JSON schema enforced via `responseSchema`. Also: Web Speech API for STT and TTS. |
| **Code quality** | Strict separation of concerns. Runtime guard normalizes AI output. Empty / oversized / malformed inputs handled. TypeScript strict mode. |
| **Usability** | Zero learning curve. Citizen speaks/types how they speak. 8 example buttons across 6 languages. 1-click copy / WhatsApp / image / audio. |
| **Safety** | PII auto-detection before copy/share. Emergency banner with `tel:` deep-links for urgency ≥ 8. Geolocation opt-in only. |
| **Performance** | Lightweight `gemini-2.5-flash` for sub-3s responses. Static prerendering on `/`, `/track`, `/dashboard`. Edge-ready on Vercel. |
| **Cost** | **Free-tier safe.** Leaflet + OpenStreetMap (no Mapbox key). Web Speech API (browser-native). `html-to-image` (client-side). localStorage (no server DB). |
| **Impact** | Reduces a ~15-minute draft-and-research task to **~3 seconds**, bridging the literacy, language, and procedural gap between citizens and the government. |

---

## 🔒 Privacy

- No complaint text, images, or history is ever stored on a server.
- Uploaded images are sent to Gemini as base64 over HTTPS for inference and discarded immediately.
- History is kept in the browser's `localStorage` only. "Clear all" removes it.
- PII is detected and masked client-side before any copy / share / download action.
- Geolocation is opt-in via explicit button click.

---

## 🗺️ Free-Tier Architecture Notes

| Need | Free choice | Why |
|---|---|---|
| Map | Leaflet + OpenStreetMap tiles | No Mapbox/Google key, no billing |
| Speech → text | Web Speech API | Browser-native, free |
| Text → speech | `speechSynthesis` | Browser-native, free |
| Image export | `html-to-image` (client-side) | No server, no API |
| Share | `wa.me` deep-link | Free, opens user's WhatsApp |
| Storage | `localStorage` | No DB, no auth |
| Tracking | localStorage + deterministic timeline | Realistic-looking demo without a server |

---

## 🧪 Local Development Notes

- Node 18+ required.
- The Gemini SDK is invoked server-side only; `GEMINI_API_KEY` is never exposed to the client bundle.
- Tailwind v4 is configured via `@tailwindcss/postcss` — no `tailwind.config.js` needed.
- Voice input works best in Chrome/Edge; Safari supports Web Speech with quirks; Firefox does not. The UI shows a friendly fallback message if unsupported.
- The dashboard map requires the user's browser to load OSM tiles (no API key, attribution shown).

---

## 📜 License

MIT — Devengers, 2026.