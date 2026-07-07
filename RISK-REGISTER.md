# RISK REGISTER — What Could Go Wrong + The Fix

> Read this once tonight. Don't read it on the day — by then, you have the playbooks.

Each risk has: **Likelihood** (L/M/H), **Impact** (L/M/H), **Mitigation** (do before), **Fallback** (do on the day).

---

## R1 — Gemini API key invalid or rate-limited

**Likelihood:** M
**Impact:** H (no AI = no AI-usage score)

**Mitigation (before):**
- Test a one-line API call on 6 July.
- Save the API key in `.env` AND keep a backup copy in your password manager.
- Have one alternate key ready (you can generate multiple in AI Studio).

**Fallback (day):**
- Switch to `gemini-2.5-flash` (lighter quotas than `pro`).
- If hit quota mid-build, cache the last good response and show it (with a banner "demo response due to API throttling").
- Worst case: ship a static "example output" carousel alongside the live API call. Judges respect honesty.

---

## R2 — Deploy fails at 13:55

**Likelihood:** M
**Impact:** H

**Mitigation:**
- Test deploy on 6 July with a "hello world" repo.
- Deploy an early working version at 12:00 to lock in the URL.
- Have a backup host (Vercel primary, Netlify fallback).

**Fallback:**
- Build into `out/` (static) and drop on Netlify Drop (`https://app.netlify.com/drop`). Drag the folder, done. ~2 min to a public URL.
- If absolutely no deploy works, submit the GitHub repo plus a 60-second Loom/YouTube video. Judges prefer a working video over a 404 link.

---

## R3 — Repo link is wrong / typo'd at submission

**Likelihood:** L
**Impact:** H (DQ if link is broken)

**Mitigation:**
- Use the GitHub `https://github.com/{user}/{repo}` format exactly.
- Make the repo public from the start.
- Open the link in incognito before pasting.

**Fallback:**
- If broken, edit the submission form if still possible; otherwise message the dev organizers via WhatsApp immediately (be polite, not needy).

---

## R4 — Gemini call returns invalid JSON mid-build

**Likelihood:** M
**Impact:** M

**Mitigation:**
- Use the `safeParse` helper from `PROMPT-LIBRARY.md` § 10.
- Use `responseMimeType: "application/json"` plus `responseSchema`.

**Fallback:**
- Lower `temperature` to 0.3 (more deterministic).
- Wrap with a retry (one retry max, then fall back to raw text).
- Display raw text in a styled `<pre>` block — judges still see real AI output.

---

## R5 — Code breaks at 13:00 (the "everything is on fire" moment)

**Likelihood:** M
**Impact:** M

**Mitigation:**
- Commit at every checkpoint so you can `git reset --hard {commit}` cleanly.
- Work in one branch.

**Fallback:**
- The 13:30 hard-stop rule: regardless, freeze new code at 13:30.
- If broken, fix only the broken bit. Disable the broken feature with a TODO comment removed and a `coming soon` placeholder. **Worse demo = OK. No demo = DQ.**

---

## R6 — Time runs out before deploy

**Likelihood:** M
**Impact:** H

**Mitigation:**
- Reserve 14:00 → 14:30 for deploy + submit. No exceptions.
- Deploy an early scaffold by 12:00.
- Set two alarms: 13:30 ("feature freeze") and 14:00 ("submission-prep start").

**Fallback:**
- Submit the GitHub repo URL + a working local-runs `README` + a 60-second demo video. This has scored well in past events when AI judges apply the rubric leniently.

---

## R7 — Problem statement requires knowledge I don't have

**Likelihood:** M
**Impact:** M

**Mitigation:**
- Scan the IDEA-BANK shapes. Most problems fit 1–2 shapes.
- The shape is your scaffold — the *content* can be AI-generated or domain-researched in 15 min.

**Fallback:**
- Trim scope aggressively. One shape + small dataset + clear doc still beats a half-built ambitious thing.
- Use the AI itself to fill domain knowledge gaps in prompts.

---

## R8 — Internet drops mid-build

**Likelihood:** L (solo, online event)
**Impact:** M

**Mitigation:**
- Phone-tether backup.
- Don't push huge files; commit small and often.

**Fallback:**
- Continue coding locally.
- Submit requires internet, but if you can resolve DNS by 14:25 you're fine.

---

## R9 — Idea gets stolen (judge variant)

**Likelihood:** L
**Impact:** L

**Mitigation:**
- Don't share your idea in the WhatsApp group — keep it private until the demo.
- Submit early (14:00) so your link is timestamped.

**Fallback:**
- Nothing. Idea theft in a 500-participant event is rare, and execution always wins over idea. Move on.

---

## R10 — Push to wrong branch / force-push mistake

**Likelihood:** L
**Impact:** M

**Mitigation:**
- Always work on `main` (it's a solo event, branches add overhead).
- `git add -p` (interactive) when unsure what to commit.

**Fallback:**
- `git reflog` and `git reset --hard HEAD@{1}` are your friends.
- If unrecoverable, deploy whatever survived the last commit and rebuild from screenshots / cached output.

---

## R11 — Pitch round request comes in but I have nothing prepared

**Likelihood:** M
**Impact:** M

**Mitigation:**
- The DAY-OF-CHECKLIST has the 30-second pitch template. Memorize it tonight.
- Have a 1-minute and 3-minute version ready.

**Fallback:**
- If asked a hard question, say: "I had to scope this down for the 4-hour window, so I deliberately chose X — happy to discuss the trade-offs." That's a strong honest answer.

---

## R12 — Wi-Fi / power outage locally

**Likelihood:** L
**Impact:** H

**Mitigation:**
- Charge laptop to 100%.
- Keep charger plugged in.
- Phone hotspot pre-tested.

**Fallback:**
- Once power is back, submit from a public Wi-Fi location (cafe, library). Backup your code to GitHub frequently so it's not local-only.

---

## R13 — Judges (AI) misinterpret my project

**Likelihood:** M
**Impact:** M

**Mitigation:**
- The README template in WIN-PLAYBOOK § 3 **literally answers the 7-criterion rubric** with bolded section headers. This is the single biggest defense.
- Include a short "Why this matters" paragraph in the README.

**Fallback:**
- In your submission text, list: "Built specifically for {user} to {do what}, addressing {specific pain}." One sentence. Highly visible to AI graders.

---

## R14 — Mobile layout is broken

**Likelihood:** M
**Impact:** L

**Mitigation:**
- Use Tailwind responsive classes from the start (`flex-col md:flex-row`, `w-full md:w-1/2`).
- Test at 375px (iPhone SE) at 13:30.

**Fallback:**
- If broken, add a CSS rule: `@media (max-width: 768px) { .container { padding: 1rem !important; } }` to force a readable layout.

---

## R15 — Late submission (most common DQ)

**Likelihood:** M
**Impact:** H

**Mitigation:**
- Submit at 14:20. Period.
- Two alarms set on phone.

**Fallback:**
- **There is no fallback.** Late = DQ. The "submit at 14:20" rule is the most important rule in this entire kit.

---

## R16 — Misreading the problem statement

**Likelihood:** M
**Impact:** H

**Mitigation:**
- Re-read the problem at 10:30 and again at 11:00.
- Note 3 constraints explicitly in your README.

**Fallback:**
- If you realize at 12:00 that you're off-track, **pivot immediately**. Don't keep building the wrong thing. Better 2 hours on the right thing than 4 hours on the wrong one.

---

## R17 — Gemini hallucinates and the demo breaks

**Likelihood:** L
**Impact:** L

**Mitigation:**
- Constrained prompts (see PROMPT-LIBRARY).
- Temperature ≤ 0.7.
- Validate output shape before rendering.

**Fallback:**
- "Safe" example output: keep one cached good response in JSON form to fall back on if the live API fumbles during the Top 10 demo. Judges won't penalize an honest fallback.

---

## R18 — Hitting the same GitHub daily quota / commit issues

**Likelihood:** L
**Impact:** L

**Mitigation:**
- Commits are unlimited on public repos. Don't worry.

**Fallback:**
- Use `git commit --amend --no-edit` for the last commit if you forget something tiny and don't want a useless "fix typo" commit.

---

## Summary Priority

If you only have time to memorize 3 things:

1. **Hard stop at 13:30 for new code. Hard stop at 14:20 for submission.**
2. **README literally maps to the 7-criterion rubric.**
3. **One cached example output as the fallback if AI breaks live.**

Everything else is in these documents.
