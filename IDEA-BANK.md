# IDEA BANK — Pre-Thought Project Angles

> **Purpose:** Don't burn 30+ minutes on the day figuring out what to build. Skim this list the moment the problem statement drops. Pick **one** angle that fits the problem and run.

Each entry below is a **project shape** (a pattern), not a finished product. The pattern is what's reusable — you'll fill it in with the live problem statement at 10:30 AM.

---

## How to Use This on the Day

1. Read the problem statement at 10:30 AM.
2. Scan the **Shape Index** below.
3. Pick the 1–2 shapes that best fit.
4. Pick a **specific user** the problem statement didn't name yet (specificity = innovation).
5. Execute the build plan in `WIN-PLAYBOOK.md` § 1.

---

## Shape Index (8 high-scoring patterns)

| # | Shape | Why it scores high | Time to build | Best for problems about |
|---|---|---|---|---|
| 1 | **Niche Assistant** for one user role | Specificity + impact | 2.5 h | "Help {X} do {Y} faster" |
| 2 | **Reviewer / Critic** (input → structured critique) | AI usage + usability | 2 h | Quality, writing, code, ideas |
| 3 | **Auto-Summarizer** for a specific document type | AI usage + problem fit | 2 h | Long text overload |
| 4 | **Classifier / Router** (input → category → action) | AI usage + code quality | 2 h | Triage, sorting, support |
| 5 | **Personalized Recommender** | Innovation + impact | 3 h | Choice paralysis, discovery |
| 6 | **Plan Generator** (goal → ordered steps) | AI usage + impact | 2.5 h | Stuck, planning, learning |
| 7 | **Translator / Localizer** (region-specific) | Innovation + impact | 2 h | Language, jargon, accessibility |
| 8 | **Data → Insight Dashboard** (small dataset → AI summary) | Code quality + impact | 3 h | Numbers, trends, reports |

---

## Shape 1 — Niche Assistant

**Pattern:** A web app with one input box and one output, purpose-built for **one specific user role** doing **one specific task**. AI does the heavy lifting in the middle.

**UI:** Hero text → input → button → result. That's it. Optionally a "history" list.

**Best examples for inspiration:**
- Cover-letter assistant **for first-time interns**
- Outreach DM writer **for cold-DMing micro-influencers**
- Email rewriter **for support agents in {industry}**
- Daily standup drafter **for remote junior devs**

**Why it scores:** Specific user = innovation. Simple UI = usability. One AI call done well = AI usage. README can quantify hours saved = impact.

**Starter prompts (drop into PROMPTS.md):**
```
SYSTEM: You are a {role} assistant for {user_type}.
Your output must be a JSON object with two fields: "draft" (string) and "tips" (array of 2 strings).
Constraints: under 180 words, no emojis, no preamble.
```

**Gemini call signature:**
```js
const result = await model.generateContent({
  systemInstruction: ROLE_PROMPT,
  contents: userInput,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: { /* schema */ }
  }
});
```

---

## Shape 2 — Reviewer / Critic

**Pattern:** User pastes (or uploads) something → app returns a structured critique with severity, line/issue, and a fix.

**UI:** Input area → "Review" button → structured result (list of issues, each with severity tag + suggestion).

**Best examples:**
- Resume reviewer **for college students with no industry experience**
- Cold email critic **for first-time founders**
- README reviewer **for OSS maintainers opening their first project**
- Pitch deck line-by-line critic

**Why it scores:** Structured output = clear AI usage (JSON mode). Quantifiable improvement = impact.

**Starter prompts:**
```
SYSTEM: You are a strict reviewer of {thing_type}.
Return JSON: { "issues": [{ "severity": "high|med|low", "location": string, "fix": string }] }
Max 6 issues. Always include at least one positive observation.
```

---

## Shape 3 — Auto-Summarizer for a Specific Document Type

**Pattern:** User uploads a long doc OR pastes a URL → app returns a structured summary tailored to one audience.

**UI:** File/URL input → "Summarize for {audience}" button → 3 sections: TL;DR, Key Points, Action Items.

**Best examples:**
- YouTube transcript summarizer **for students cramming for exams**
- Policy document summarizer **for NGO workers in low-connectivity areas**
- Long legal notice summarizer **for tenants**
- Meeting transcript → "what did we decide?"

**Why it scores:** Solves a universal pain (long content). Specific audience = innovation. Structured output = AI usage.

---

## Shape 4 — Classifier / Router

**Pattern:** Input → AI categorizes → app takes a different action per category.

**UI:** Input → category badge → category-specific result/response.

**Best examples:**
- Support email sorter (billing / bug / feature / other)
- Customer review sentiment + category (praise / complaint / question / bug)
- GitHub issue tagger
- Student question classifier (conceptual / homework / stuck / off-topic)

**Why it scores:** Single AI call, very clear purpose, easy to demo ("paste 5 emails and watch them get sorted").

**Starter prompts:**
```
SYSTEM: Classify the following text into EXACTLY one of: {labels}.
Return JSON: { "label": "label_name", "confidence": 0.0-1.0, "reason": "one sentence" }
```

---

## Shape 5 — Personalized Recommender

**Pattern:** User answers 3–5 quick questions → AI generates 5 personalized recommendations with explanations.

**UI:** Mini-questionnaire → loading → list of 5 cards, each with title, why-this-fits, and a CTA.

**Best examples:**
- Course recommender **for rural engineering students**
- Side-project recommender **for solo devs with X hours/week**
- Book recommender **for someone who liked {book}**
- Co-founder matching **for technical solo builders**

**Why it scores:** Personalization feels magical in a demo. Generated explanations = clear AI usage.

**Starter prompts:**
```
SYSTEM: Recommend 5 options for {user_type} given these answers: {answers}.
Each option must include: title, one-line description, "why it fits" (one sentence referencing an answer).
Return JSON: { "recommendations": [{ "title": "...", "description": "...", "why_it_fits": "..." }] }
```

---

## Shape 6 — Plan Generator

**Pattern:** User states a goal + constraints → AI returns an ordered, time-boxed plan.

**UI:** Goal input + duration selector (1 day / 1 week / 1 month) → ordered plan with checkboxes that persist in `localStorage`.

**Best examples:**
- "Plan my DSA revision in 4 weeks"
- "Plan an India trip from {city} in 5 days under ₹20,000"
- "Plan my week of X content — output a content calendar"
- "Plan how to learn {skill} from zero in 30 days"

**Why it scores:** Plan = sequence = structured output = high AI-usage score. Checkboxes = visible usability.

**Starter prompts:**
```
SYSTEM: Create a {duration} plan to achieve: "{goal}".
Constraints: {constraints}.
Return JSON: { "plan": [{ "day": 1, "task": "...", "estimated_minutes": 30 }, ...] }
Total items must fit within {duration}.
```

---

## Shape 7 — Translator / Localizer

**Pattern:** Translates content **with region context** — not just language, but tone, idioms, units, and references fit for the target region.

**UI:** Input box → target language/region dropdown → translated output + a "what changed and why" note.

**Best examples:**
- English ↔ Hinglish (with tone selector: formal/casual)
- English ↔ Indian regional with formal-IIT-letter mode
- Tech-jargon plain-English translator **for non-tech managers**
- Slang decoder for parents

**Why it scores:** Region awareness is novel. Showcasing "why this translation" demonstrates real AI value.

---

## Shape 8 — Data → Insight Dashboard

**Pattern:** User pastes a small dataset (or uploads CSV) → AI summarizes top findings and creates 2–3 simple visualizations.

**UI:** Paste/upload → "Analyze" → summary card + 2 charts (built with Chart.js or Recharts).

**Best examples:**
- Sales CSV → insights for small shop owners
- Expense list → monthly insights for first-time earners
- Marks spreadsheet → "what to focus on next" for students
- Survey results → sentiment summary for HR interns

**Why it scores:** Numbers are tangible. AI summary + simple charts is a very demoable combo.

---

## Cross-Shape Add-Ons (cheap to bolt on for impact)

These take ~15 min each to add and add measurable value:

1. **One-click example loader** — loads a sample input so judges don't have to think.
2. **localStorage history** — last 5 runs, click to re-view. "Wow, it remembers."
3. **Copy-to-clipboard button** on every output. Saves the user a step.
4. **Loading state with a fun fact** — "Did you know? {domain trivia}." Shows polish.
5. **Mobile-friendly layout** with Tailwind responsive classes (`md:flex-row` etc.).
6. **A "Why this matters" section** on the home page. Quantifies impact.
7. **Dark mode toggle** — cheap and looks pro.

---

## Anti-Patterns to Avoid (these score LOW)

Avoid these even if they seem easy:

| Anti-pattern | Why it scores low |
|---|---|
| Generic "AI chatbot" | Everyone's building one. Zero innovation. |
| "AI image generator" | Most are wrappers around existing APIs. |
| Recipe generator | Boilerplate + boring. |
| Pomodoro timer with AI | Trivial AI use, no problem alignment. |
| Resume formatter | Overdone. |
| Twitter thread writer | Cliché. |
| Coding tutor | Better-built competitors exist. |

**If the problem statement nudges you toward one of these, take the *spirit* of it and apply one of the 8 shapes above with a specific user.**

---

## On the Day: The 60-Second Pick

When the problem drops, ask these 4 questions in order:

1. **Who specifically is this for?** (Name a role, not "everyone")
2. **What specific pain do they have?** (Name a moment, not "lots of tasks")
3. **Which Shape (1–8) maps best?** (Pick the closest)
4. **What's the one twist no one's combined before?** (Even tiny counts)

If you can't answer all four in 60 seconds, pick a different Shape — not a different idea.

---

## Final Note

The shapes above have been chosen because each one is:
- **Buildable solo in 2.5 hours** (proven by reference projects)
- **Able to demonstrate real AI usage** with structured output
- **Easy to deploy** (frontend-heavy, lightweight backend)
- **Easy to document** (the README template from WIN-PLAYBOOK.md § 3 fits any of them)

You don't need a unique idea to win. You need a **focused, complete, well-explained execution** of a known shape.
