# WIN-PLAYBOOK — How to Score Maximum Marks on the AI Jury

> **Goal:** Maximize scores on the 7 judging criteria in a 4-hour solo build, **legitimately**.
>
> **Disclaimers:**
> - This is *not* prompt injection or any attempt to manipulate the judge.
> - AI juries (LLM-based evaluators) read artifacts literally. If your artifacts are clear, well-structured, and on-rubric, you score higher. This document just teaches you to write artifacts the way the rubric wants them written.

---

## 0. The 4-Hour Strategy in One Paragraph

Spend **30 minutes** on problem framing, **2.5 hours** building, **45 minutes** polishing, **15 minutes** writing submission text, and **the last 30 minutes** reserved for *submitting only*. Pick a small, opinionated, end-to-end slice. Ship something that works over something that's impressive-but-broken. Write a README that **literally quotes the rubric** so the AI evaluator can find each criterion answered in your document.

The best predictor of high marks is **completeness + clarity**, not novelty. A finished, well-explained small project beats a half-built ambitious one every time.

---

## 1. Time Budget (4 hours, locked)

| Block | Time | Minutes | What you do |
|---|---|---|---|
| **A. Frame** | 10:30 → 11:00 | 30 | Read problem, decide angle, write the README skeleton |
| **B. Build** | 11:00 → 1:30 | 150 | Code the smallest complete version |
| **C. Polish** | 1:30 → 2:00 | 30 | Fix UI, error states, deploy, smoke test |
| **D. Write** | 2:00 → 2:20 | 20 | Finalize README + PROMPTS.md, copy submit text |
| **E. Submit** | 2:20 → 2:30 | 10 | Verify links, click submit |

> Rule: **no new features after 1:30 PM**. Everything from then on is *make it shippable* work.

---

## 2. Mapped to the 7 Criteria — Concrete Moves

### 2.1 Innovation

**What an AI judge "sees":** a description that names a *specific user*, a *specific pain*, and a *specific fresh angle*.

**Concrete moves:**
- Pick a problem **you personally** understand — authenticity reads.
- Add **one twist** not found in off-the-shelf boilerplate (an unusual input, a contextual filter, an agentic loop, a personal data source).
- In README, use the word **"specifically"**: "This tool is **specifically** built for **{user}** to **{do what}** when **{trigger}**, unlike **{existing solution}** which only **{their gap}**."

**Anti-pattern:** Generic AI todo / chatbot / recipe generator. These get scored low on innovation no matter how well-built.

---

### 2.2 Code Quality

**What an AI judge "sees":** repo structure, lint cleanliness, commit hygiene, no dead code.

**Concrete moves:**
- Folder layout: `/app` or `/src`, `/components`, `/lib`, `/prompts`, plus top-level `README.md`.
- Add a `package.json` (or equivalent) with a real start script.
- Lint pass before 1:30 PM: no unused imports, no `console.log` littered in, no commented-out code blocks.
- **Meaningful commit history**: ~8–15 commits across 4 hours, with messages like `feat: add parser for X`, `fix: handle empty input`. This is visible to AI graders and counts toward "code quality".
- `README` lists tech stack in one line.

**Anti-pattern:** One giant file, 200-line functions, `// TODO` everywhere.

---

### 2.3 Problem Alignment

**What an AI judge "sees":** does the README's problem statement match what the app actually does?

**Concrete moves:**
- Write the **problem statement** section first, in the README, *before you code*. This anchors your code to the problem.
- For every feature in the app, the README has a 1-line description. If a feature isn't in README, cut it.
- End the README with a section called **"How it solves the problem"** that maps each pain point → which screen/feature addresses it.

**Anti-pattern:** Cool demo, problem statement is vague. AI judges down-score aggressively here.

---

### 2.4 AI Usage ⭐ (the one that lifts you above boilerplate)

**What an AI judge "sees":** Is AI *central* to the solution, or just decoration? Are prompts documented?

**Concrete moves:**
- AI must do **at least one non-trivial thing**: classify, summarize, generate, recommend, plan, route, or transform. "Just calling OpenAI for a hello-world" doesn't count.
- Use **structured output** (JSON schema or response_schema) for anything used downstream — judges recognize this as "real" usage.
- Create a separate **`PROMPTS.md`** that contains:
  - Each prompt verbatim.
  - The role/system message.
  - What the model output is used for in the app.
  - One example input → output.
  - Any safety guardrails or constraints added.
- If using Gemini specifically, surface it: "Built using Gemini 2.5 Flash via the official API, function calling enabled for **{X}**."

**Anti-pattern:** A "Powered by AI 🤖" badge with no real model call. This is the #1 thing AI judges down-score. They can detect it from the absence of an API call in code.

---

### 2.5 Usability

**What an AI judge "sees":** Can a stranger use it without a tutorial? Mobile responsive? Clear copy?

**Concrete moves:**
- First-time user lands on the app and **knows what to do within 5 seconds** (a clear headline + primary CTA).
- Mobile-friendly (use Tailwind or basic responsive CSS).
- Empty states, error states, loading states — all written, not blank.
- Provide **one example** the user can click to try.

**Anti-pattern:** Dashboard with no labels, errors that crash the page, dark UI with no contrast.

---

### 2.6 Performance

**What an AI judge "sees":** Demo URL latency, cold-start friendliness.

**Concrete moves:**
- Deploy to a static-friendly host (Vercel/Netlify).
- Don't load multi-megabyte models at runtime; use API calls.
- Add a single loader/spinner so the user doesn't hit a blank screen.
- Cache at least one thing (e.g., last response in `localStorage`).

**Anti-pattern:** Spinning up a heavy backend; the demo takes >10s to load and judges bail.

---

### 2.7 Overall Impact

**What an AI judge "sees":** A *quantified* claim of who benefits and how.

**Concrete moves:**
- README "Impact" section with **one concrete metric**, even estimated:
  - "Reduces time to draft an answer from ~10 min to ~30 sec."
  - "Designed to be free for the ~600K public-school teachers in **{region}**."
- Mention a target audience *with numbers*, not just "everyone."

**Anti-pattern:** Vague "this helps people." That's scored 0 by an AI rubric.

---

## 3. The README Cheat-Sheet (this is the secret)

An AI evaluator literally reads your `README.md` and tries to score each criterion. If your README explicitly maps to each criterion, your score goes up because **the rubric is literally being answered in your doc.** This is not cheating — it's well-written documentation.

### `README.md` template (drop this in before you code)

```markdown
# Project Title

One-line tagline.

## 🧩 Problem
> 2–3 sentences. Who is hurting, why now, what's the cost of doing nothing.

## 💡 Solution
> 1 short paragraph. What your app does, end-to-end.

## 🤖 AI Usage
> Which model, what it does, where in the code, the prompt in one quote.

## 🚀 How it solves the problem
> Bullet: pain → which feature solves it.

## 🛠 Tech stack
> One line: "Gemini 2.5 Flash · Next.js 14 · Tailwind · Vercel"

## 🧪 How to run locally
> 5 commands max.

## 🌐 Deployment
> Link (must be live).

## 📈 Impact
> One numeric claim of who benefits and how.

## 📝 Prompt workflow
> See `PROMPTS.md`.

## 👤 Author
> Solo build, 10:30–2:30 IST, 7 July 2026.
```

The headers **literally map** to the 7 judging criteria. AI judges love this — it's structured, scannable, and on-rubric.

---

## 4. The `PROMPTS.md` Template (also elevates AI-usage score)

```markdown
# Prompt Workflow

## System Prompt (verbatim)
> {paste exact system prompt}

## Task Prompts (verbatim)
> {paste the exact user prompt(s)}

## Output contract
> What format the model returns — JSON schema, list of strings, etc.

## Example
Input:  "..."
Output: { ... }

## Safety
> What blocks or constraints you added (e.g., refusal for X, length cap, JSON validation).

## Model
> "Gemini 2.5 Flash via @google/genai SDK, structured output enabled."
```

---

## 5. Pre-Event Stack (set up TODAY so day is smooth)

Do these now, before 6 July registration closes:

- [ ] GitHub account working, empty `prompt-wars` repo created (no code yet, that's fine).
- [ ] Vercel / Netlify account ready, CLI installed, one previous deploy done.
- [ ] **Gemini API key** generated via AI Studio (`aistudio.google.com`), saved in `.env` (not committed). Free tier is enough.
- [ ] Node.js or Python installed locally.
- [ ] Skeleton stack chosen. **Recommended for solo in 4 hours:**
  - **Next.js 14 (App Router) + Tailwind + @google/genai SDK** — fast, deploys in one click on Vercel.
  - Alternative: **single HTML + JS + Gemini API call** if you've never used Next.js before.
- [ ] `.gitignore` pre-staged: `node_modules`, `.env`, `.next`, `dist`, `venv`.
- [ ] **`PROMPTS.md`** template saved in repo (you'll fill it on the day).

---

## 6. Decision Rules (when stuck)

| Situation | Rule |
|---|---|
| Idea feels generic | Add **one twist** specific to a niche user. Stop, don't keep adding features. |
| 60 min in, not done | **Cut scope.** Smaller, complete > ambitious, broken. |
| Gemini call failing | Switch to a smaller prompt + `gemini-2.5-flash`. Use API key, not browser. |
| Deploy broken at 2:00 PM | Submit the **repo link** with a working local-runs instruction and a `loom.com` or `youtube.com` demo video. Judges prefer a video over a 404 link. |
| README feels too short | Use the template in §3 verbatim. |
| Out of time | Submit README + repo + repo-runs-locally + a 60-second demo video. That still scores well. |

---

## 7. The 7-Criterion "Quick Self-Audit" (run this at 2:00 PM before submit)

Open your README. Can the AI evaluator find these sentences?

- [ ] **Innovation:** A sentence saying who, what pain, what's new about your angle.
- [ ] **Code quality:** A tech-stack line and an obvious folder layout.
- [ ] **Problem alignment:** A "Problem" section AND a "How it solves the problem" mapping bullets.
- [ ] **AI usage:** A model name + the exact prompt(s) + where in the code the call is.
- [ ] **Usability:** A short "How to run locally" + the deployed link works.
- [ ] **Performance:** A deploy URL that loads in <5s.
- [ ] **Impact:** A sentence with a **number** about who benefits and how.

If any of the 7 is missing, fix that section *only* — don't refactor code in the last 30 min.

---

## 8. The Submission Text (write it now in `SUBMISSION.md`)

Have this pre-staged so at 2:20 PM you only fill in the repo + URL:

```
Project Title: <…>
Description: <2–4 sentences>
GitHub Repo: <…>
Deployed Link: <…>
Prompt Workflow: see /PROMPTS.md in the repo
```

That's the minimum. Submission form will vary by platform; keep this draft ready to paste.

---

## 9. Common Mistakes That Get Eliminated Before Judging Even Starts

1. **Broken/dead link** → DQ before scoring.
2. **Private repo** → DQ before scoring.
3. **"Coming soon" page** → DQ before scoring.
4. **A README that just says "an AI app for everyone"** → scores 0 on problem alignment, innovation, impact.
5. **No prompt documented** → scores 0 on AI usage.
6. **Late submission** → DQ. (Plan to submit by 2:20, not 2:29.)

---

## 10. TL;DR — The 5 Things To Memorize

1. **30 min frame, 2.5 h build, 45 min polish, 15 min write, 10 min submit.**
2. **Small + complete + specific** beats ambitious + half-done.
3. **README literally answers the 7-criterion rubric** with bolded section headers.
4. **Real Gemini API call** + `PROMPTS.md` with verbatim prompts + example output.
5. **A working live link by 2:00 PM**, submit by 2:20 PM.

---

*This document was written as pre-event prep. On the day, you will read the live problem statement at 10:30 AM and adapt — but the structure above holds for virtually any AI build problem.*
