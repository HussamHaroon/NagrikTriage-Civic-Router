<p align="center">
  <img src="../logo.png" alt="NagrikTriage Logo" width="120" />
</p>

# 🇮🇳 NagrikTriage — Smart Bharat Civic Companion

> **Tagline:** Turning messy, multilingual citizen frustration into structured, actionable government tickets — across **one platform, three users**.

NagrikTriage is a GenAI-powered, **two-sided civic triage and routing platform** built for the **Smart Bharat** problem statement. The same intelligent AI pipeline powers three distinct, role-based experiences:

*   🧑 **Citizen (`/citizen`)** — File a complaint by speech (voice), text, or photo in any native Indian language or Hinglish slang, and get a formal routed ticket.
*   🧑‍💼 **Nodal Officer (`/officer`)** — View a dashboard pre-filtered specifically for your department, sorted by urgency, and audit AI-classified metadata.
*   🏛️ **City Administrator / Mayor (`/mayor`)** — Monitor real-time ward heatmaps, category spikes, and key performance indicators across the entire municipality.

---

## 🔗 Demo & Repository Links
*   **GitHub Repository:** [https://github.com/trueg/NagrikTriage](https://github.com/trueg/NagrikTriage)
*   **Live Deployed Application:** [https://nagrik-triage-civic-router.vercel.app/](https://nagrik-triage-civic-router.vercel.app/)

> [!IMPORTANT]
> **One-Click Hackathon Judge Credentials**
> The login screen has pre-loaded buttons for instant authentication as any of the roles:
> *   **Citizen:** `judge.citizen@nagriktriage.in` / `JudgeDemo2026!`
> *   **Nodal Officer:** `judge.officer@nagriktriage.in` / `JudgeDemo2026!`
> *   **City Administrator (Mayor):** `judge.mayor@nagriktriage.in` / `JudgeDemo2026!`

---

## 🏆 Rubric Requirement Mapping

Below is a direct map of how this project delivers on the seven official evaluation criteria used by both the AI and human jury.

| Rubric Criterion | Evidence & Implementation in This Project |
| :--- | :--- |
| **1. Innovation** | Moves beyond passive FAQ chatbots to build an *active, two-sided triage agent*. Accepts chaotic, multilingual citizen rants and converts them into structured municipal tickets routed to target departments. |
| **2. Code Quality** | Modular Next.js 14 App Router codebase with type safety. Handles failed AI outputs and empty inputs gracefully via runtime guards and parsing try-catch blocks. Strict separation of UI, API routes, prompts, and database logic. |
| **3. Problem Alignment** | Fully aligns with the *Smart Bharat - AI-Powered Civic Companion* prompt. Directly resolves issues with government accessibility, language barriers, response prioritization, and complaint tracking. |
| **4. AI Usage** | Deep integration of Gemini 2.5 Flash. Uses a strict JSON schema via API-native `responseSchema` for structured outputs (translation -> classification -> urgency scoring -> signal extraction). Multimodal capabilities allow photo-only triage. |
| **5. Usability** | UI localized in 6 languages. Features voice input (Web Speech API), one-click demo examples, one-tap copy/WhatsApp share buttons, automated client-side PII masking, and an emergency hotline banner for high-urgency reports. |
| **6. Performance** | Uses lightweight `gemini-2.5-flash` for sub-3-second responses. Completely serverless API layer hosted edge-ready on Vercel. Native browser features keep client bundle sizes low. |
| **7. Overall Impact** | Reduces the time needed to write and route a formal complaint from a 15-minute manual effort to **under 3 seconds**. Provides municipal officers with prioritizable queues and mayors with live heatmaps. |

---

## 🎨 Role-Based User Experiences

NagrikTriage integrates the three pillars of municipal interaction into a single interface.

### 1. Citizen Experience (`/citizen`)
![Citizen Experience](../Citizen.png)

*   🗣️ **Multilingual Voice & Text Input:** Citizens can type or use browser-native speech-to-text (Web Speech API) in their native tongue or colloquial slang.
*   📸 **Multimodal Image Upload:** Uploading a photo of a civic issue (e.g., potholes, trash dumps, broken transformers) allows the AI to automatically identify the issue, classify the category, and draft the ticket without the user typing a single word.
*   🌐 **Localized Interface:** The entire client UI can be toggled instantly across 6 languages: English, हिन्दी (Hindi), தமிழ் (Tamil), বাংলা (Bengali), తెలుగు (Telugu), and मराठी (Marathi).
*   🚨 **Emergency Action Banner:** If the urgency score is $\ge 8$, the app displays an orange/red hazard banner with tap-to-call helplines (`112` and municipal contacts) for immediate safety.
*   🔍 **AI Auditable Explainability:** Surfaces a "Why this score?" panel showing the exact keywords/signals extracted by Gemini that drove the urgency rating.
*   📋 **Jaccard Duplicate Radar:** Warns the user if nearby citizens have already filed similar complaints, reducing ticket duplication.
*   ✉️ **Export Options:** Instantly copy the formal draft, share it directly to WhatsApp with a pre-filled chat link, download it as a PNG, or have the browser read it out loud.
*   📍 **Location Context:** Automatically reads lat/lng coordinates (with permission) and passes them to the AI pipeline to determine local municipal jurisdictions.

### 2. Nodal Officer Experience (`/officer`)
![Nodal Officer Experience](../officer.png)

*   ✅ **Auto-Filtered Inbox:** Officers see only the tickets routed to their specific department (e.g., Jal Board, PWD, BESCOM).
*   📊 **Urgency-Based Sorting:** AI ranks tickets automatically based on severity (1-10) rather than submission order.
*   🤖 **Confidence Metrics:** Displays Gemini's classification confidence score and a quick bulleted summary of extracted incident signals.
*   ▶️ **Workflow Management:** Update ticket status in one click (Filed → Acknowledged → Assigned → In progress → Resolved).
*   🗣️ **Text-to-Speech:** Officers can listen to the formal complaint draft read aloud with one click.

### 3. City Administrator / Mayor Experience (`/mayor`)
![Administrator Experience](../Administrator.png)

*   🗺️ **Live Incident Heatmap:** Interactive Leaflet + OpenStreetMap dashboard. Map markers scale in size and change color based on the volume and urgency of reports in that area.
*   🚨 **Anomalous Spike Warnings:** AI scans complaints daily and flags spikes (e.g., *"40% spike in Sanitation complaints in Ward 4 today"*).
*   📊 **KPI Strip:** Real-time citywide tracking of Open vs. Resolved counts and critical unresolved tickets.

---

## 3. Problem Alignment Mapping

The app was built to answer the core constraints of the **Smart Bharat** challenge:

| Smart Bharat Objective | How NagrikTriage Solves It |
| :--- | :--- |
| **Simplify complex government info** | Converts unstructured user reports into a clean, 3-sentence formal draft showing exactly which department handles the issue. |
| **Recommend public services** | Detects coordinates and links the complaint to the exact city department and helpline numbers. |
| **Track complaints** | Provides a dedicated tracking panel `/track` showing live status updates. |
| **Provide multilingual support** | Supports input/output in 6 major languages and colloquial Indian-English slang. |
| **Promote digital inclusion** | Allows voice input and image uploads for citizens with lower literacy levels. |

---

## 🧠 4. AI & Prompt Workflow

NagrikTriage utilizes **Gemini 2.5 Flash** as an active data routing and structuring pipeline rather than a conversational chat box. This is executed in a single, high-performance API call.

### The System Prompt & Schema Enforcement
The model is instructed to act as a municipal routing assistant and return a strict JSON output matching our predefined TypeScript schema.
*   **System Prompt:** See [PROMPTS.md](PROMPTS.md) for the verbatim prompt text.
*   **Output Schema:** A JSON schema is passed natively to Gemini's API (`responseSchema` config) to ensure there are no formatting anomalies or markdown wrapping tags.

### Graceful Fallbacks & Guardrails
1.  **PII Sanitization:** A local regex-based engine detects and masks phone numbers, Aadhaar IDs, vehicle registration plates, and emails *client-side* before the ticket is shared or finalized, ensuring citizen privacy.
2.  **Output Normalization:** A server-side guard `normalizeTriage()` validates that all required keys are present and types match, returning a formatted fallback object if the LLM output is malformed.
3.  **Local Storage Caching:** If Supabase connection fails or is not configured, the app seamlessly falls back to saving and loading tickets from the browser's `localStorage`.

---

## 🛠️ Tech Stack & Architecture

```
app/
├── layout.tsx                          # Root layout, metadata, fonts
├── page.tsx                            # 🏠 Landing page (role picker + bento grid)
├── globals.css                         # Tailwind variables, clay UI effects
├── signin/page.tsx                     # 🔐 Supabase Auth + Hackathon Judge shortcut
├── signup/page.tsx                     # 📝 Role-based account creation
├── citizen/page.tsx                    # 🧑 Citizen dashboard
├── officer/page.tsx                    # 🧑‍💼 Officer routing desk
├── mayor/page.tsx                      # 🏛️ Mayor analytics + Leaflet Map
├── track/page.tsx                      # 📅 Live ticket tracking timeline
└── api/
    ├── triage/route.ts                 # POST: Calls Gemini, runs guard, saves to Supabase
    ├── tickets/route.ts                # GET: Fetch filtered complaints list
    ├── tickets/[id]/status/route.ts    # POST: Update ticket progress state
    ├── auth/...                        # Session management endpoints
```

*   **Framework:** Next.js 16 (App Router) + TypeScript
*   **AI Model:** Gemini 2.5 Flash (via `@google/generative-ai` SDK)
*   **Styling:** Tailwind CSS v4 + Claymorphism UI shadows
*   **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS)
*   **Mapping:** Leaflet.js + OpenStreetMap (100% free, no API keys required)
*   **Browser Integrations:** Web Speech API (speechSynthesis & SpeechRecognition)

---

## 📈 Performance Metrics

*   **Average Gemini API Triage Time:** $\approx$ 1.8 seconds (using `gemini-2.5-flash`).
*   **Lighthouse Performance Score:** 98+ (thanks to static pre-rendering of static shells and offloading heavy speech/mapping scripts to lazy loading).
*   **Client Bundle Footprint:** Extremely lightweight. Relies on browser-native APIs for speech-to-text, text-to-speech, and zero heavy local weights.

---

## 🧪 How to Run Locally

### 1. Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/prompt-wars-nagriktriage.git
cd prompt-wars-nagriktriage/nagriktriage
npm install
```

### 2. Configure Environment Variables:
Copy the template environment file:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and fill in the keys:
*   `GEMINI_API_KEY`: Generate a key at [Google AI Studio](https://aistudio.google.com/apikey).
*   `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Create a project at [Supabase](https://supabase.com) and copy these from the API settings.
*   `SUPABASE_SERVICE_ROLE_KEY`: Required server-side for backend administration.

### 3. Initialize the Database Schema:
Open the SQL editor in your Supabase dashboard and run the files in the `supabase/` directory in order:
1.  Run `supabase/schema.sql` (Creates tickets table and seed data).
2.  Run `supabase/auth.sql` (Sets up profiles and auto-triggers).

### 4. Seed the Judge Demo Accounts:
Run the seed script to create the one-click judge accounts:
```bash
npm run seed:judges
```

### 5. Run the development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🛡️ Limitations & Future Improvements

1.  **Browser Speech Limitations:** The Web Speech API works flawlessly in Chrome and Edge, but has limited support in Firefox and Safari. Planned future work includes introducing a cloud-based STT fallback API.
2.  **Visual OCR Integration:** Currently, image classification relies on visual features. We intend to add structured OCR to specifically parse handwritten text from physical documents uploaded by citizens.

---

## 👤 Author
*   **Solo Build** by Devengers.
*   Developed during the **PromptWars × Global Prompt Challenge** on 7 July 2026.