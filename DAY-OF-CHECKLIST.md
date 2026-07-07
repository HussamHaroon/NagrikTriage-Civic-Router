# DAY-OF CHECKLIST — 7 July 2026

> Print this. Tick boxes with a pen. Do not improvise on the day.

---

## T-24h (Monday Evening, 6 July)

- [ ] Registration confirmed on Hack2Skill.
- [ ] DEVENGERS WhatsApp community joined.
- [ ] Phone number on profile is correct (used for Top 10 outreach).
- [ ] GitHub account working — empty `prompt-wars-<project-slug>` repo created, public.
- [ ] Vercel/Netlify account ready, CLI installed.
- [ ] Gemini API key generated (aistudio.google.com).
- [ ] Local stack working: Node.js + Next.js OR Python + Flask, Gemini SDK installed (`npm i @google/genai`).
- [ ] `.gitignore` in place with `node_modules`, `.env`, `.next`, `dist`.
- [ ] Test deploy done on a "hello world" repo so deploy works.
- [ ] PROMPTS.md template saved in the empty repo.
- [ ] README.md template saved in the empty repo.
- [ ] Sleep.

---

## T-15m (10:15 AM, 7 July) — Pre-Battle Setup

- [ ] Join Google Meet briefing link.
- [ ] Have the empty repo open locally.
- [ ] Have Vercel/Netlify dashboard open.
- [ ] Have AI Studio / Google Cloud console open (in case you need to rotate the API key fast).
- [ ] Have `/RULES.md`, `/WIN-PLAYBOOK.md`, `/IDEA-BANK.md`, `/PROMPT-LIBRARY.md` open in tabs.
- [ ] Browser bookmarks: docs page, deploy, GitHub, problem-statement-host.
- [ ] Two tabs open to the WhatsApp group (chat + pinned message).
- [ ] Water. Snacks. Phone silenced.

---

## T-2m (10:28 AM) — Final Setup

- [ ] Empty repo initialized with `.gitignore`, README skeleton, PROMPTS skeleton.
- [ ] `npm install` already run (no waiting at 10:30).
- [ ] Dev server running on localhost (just an empty Next page is fine — you'll overwrite).
- [ ] Project skeleton committed: `chore: initial scaffold`.
- [ ] Timer started: 4 hours, end at 14:30 IST.
- [ ] Second timer started: 14:00 IST = "submission-prep start."

---

## T+0 (10:30 AM) — Problem Drops

- [ ] Read problem statement twice.
- [ ] Note 3 key constraints (audience, must-haves, deployment).
- [ ] Scan IDEA-BANK shapes, pick the 1–2 that fit.
- [ ] Apply the 4-question filter: who / what pain / which shape / what twist.

---

## Phase A: Frame (10:30 → 11:00) — 30 min

- [ ] Skim PROMPT-LIBRARY, pick one base shape.
- [ ] Define the specific user (one sentence).
- [ ] Define the specific pain (one sentence).
- [ ] Define the one twist (one sentence).
- [ ] Fill in `README.md`:
  - [ ] Problem section
  - [ ] Solution section
  - [ ] AI Usage section (one paragraph)
  - [ ] Tech stack line
- [ ] Commit: `docs: add problem framing`.
- [ ] Write a one-paragraph spec on paper / sticky note.

**Stop at 11:00 even if not "fully ready." Building > more planning.**

---

## Phase B: Build (11:00 → 13:30) — 2.5 hours

- [ ] Build the data input (form / paste area).
- [ ] Wire the Gemini call (use PROMPT-LIBRARY skeleton).
- [ ] Render the result, structured.
- [ ] Add one or two add-ons from IDEA-BANK § "Cross-Shape Add-Ons":
  - [ ] One-click example loader (15 min)
  - [ ] Copy button on output (10 min)
  - [ ] Loading state with text (10 min)
- [ ] Test with 3 different inputs.
- [ ] Catch obvious bugs: empty, too-long, edge cases.
- [ ] Run lint / format pass.
- [ ] Remove any `console.log` and `// TODO`.
- [ ] Commit history: aim for 6–12 commits with real messages.

**Hard stop at 13:30. No new features after this.**

---

## Phase C: Polish (13:30 → 14:00) — 30 min

- [ ] Mobile responsive check (resize browser to 375px width).
- [ ] Empty state, error state, loading state all written.
- [ ] Add a single dark-mode-friendly color tweak (optional polish).
- [ ] Push to GitHub.
- [ ] Deploy to Vercel/Netlify.
- [ ] Verify deployed URL returns 200 OK in incognito (no auth issues).
- [ ] Smoke test on phone (browser share to your own phone).
- [ ] Fix any 404 / dead link / broken deploy.
- [ ] Commit: `chore: polish + deploy`.

**Hard stop at 14:00. Submission phase next.**

---

## Phase D: Write (14:00 → 14:20) — 20 min

- [ ] Finalize `README.md` with all 7 criteria sections (see WIN-PLAYBOOK § 3).
- [ ] Finalize `PROMPTS.md` (paste exact prompts + example).
- [ ] Write project description (2–4 sentences).
- [ ] Pre-stage submission text in `SUBMISSION.md`:
  - [ ] Project title
  - [ ] Description (2–4 sentences)
  - [ ] GitHub URL (live)
  - [ ] Deploy URL (live)
  - [ ] Prompt workflow summary
- [ ] Run 7-Criterion Self-Audit (WIN-PLAYBOOK § 7). Tick all 7.
- [ ] Commit: `docs: finalize submission artifacts`.

---

## Phase E: Submit (14:20 → 14:30) — 10 min

- [ ] Open Hack2Skill submission portal.
- [ ] Paste submission fields.
- [ ] Re-verify both links open in a fresh incognito window:
  - [ ] GitHub → README renders, code visible
  - [ ] Deploy → loads in <5s, no auth wall
- [ ] Click Submit.
- [ ] Screenshot the confirmation.
- [ ] Share repo link in WhatsApp group (optional, recommended).

**If you're not at 14:30 yet, you submitted too early. Re-verify, screenshot, post.**

---

## T+30m (14:30 → 15:00)

- [ ] Breathe. Rest. Don't touch the code.
- [ ] If prompt says anything else to add — add only if it's text, not code, and only via README.
- [ ] Don't refactor at this stage. Files with `;` at the wrong place last-minute = broken demo.

---

## Pitch Round Prep (15:30, only if Top 10)

- [ ] Phone on, volume up.
- [ ] Demo URL bookmarked on desktop, not phone.
- [ ] Have the app loaded in one tab, README in another.
- [ ] Have `PROMPTS.md` open in a third tab.
- [ ] 30-second pitch rehearsed (next page).
- [ ] Two clarifying-question answers prepared ("Why this stack?" and "Why Gemini specifically?").

### 30-second pitch template (memorize)

> "We built **[name]** for **[specific user]** who struggle with **[specific pain]**.
> Unlike **[existing thing]**, our approach **[the one twist]**.
> Under the hood, **[the model + the prompt strategy in 1 line]**.
> In our test, it reduced time-to-X from Y to Z.
> Live demo: **[click here]**. **GitHub: [click here]**."

---

## What to NOT Do

- ❌ Don't start coding before 10:30 AM.
- ❌ Don't refactor working code after 13:30.
- ❌ Don't submit at 14:29 — submit at 14:20.
- ❌ Don't promise something the demo can't deliver.
- ❌ Don't apologize for scope in the pitch; explain why the *chosen* scope is the *right* scope.
- ❌ Don't skip the README — it's 30% of your score.

---

## Final Mindset

- The goal is to **ship a focused, complete, well-explained thing**, not to be impressive.
- AI judges reward: clarity, structure, fit-to-rubric, evidence of real work.
- 4 hours is enough for a great execution of a small idea and NOT enough for an ambitious one.
- Choose small. Choose specific. Choose complete.
