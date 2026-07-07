// Lightweight client-side PII detection + masking.
// We don't send anything to a server; everything runs locally in the browser
// before the user copies / shares the draft. Pure regex-based — good enough
// for the demo. Not a substitute for real PII tooling in production.

const PHONE_RE = /(?:\+91[-\s]?)?[6-9]\d{9}\b/g;
// 12-digit Aadhaar-style, optionally space/dash-separated
const AADHAAR_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
// 10-character alphanumeric Indian vehicle plate (rough)
const PLATE_RE = /\b[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{1,4}\b/g;
// Email
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;

export type PiiMatch = { kind: string; masked: string; original: string };

export function detectPii(text: string): PiiMatch[] {
  const matches: PiiMatch[] = [];

  for (const m of text.matchAll(PHONE_RE)) {
    const original = m[0];
    matches.push({
      kind: "Phone",
      original,
      masked: original.replace(/\d(?=\d{4})/g, "•"),
    });
  }
  for (const m of text.matchAll(AADHAAR_RE)) {
    const original = m[0];
    if (original.replace(/\D/g, "").length !== 12) continue;
    matches.push({
      kind: "Aadhaar-like ID",
      original,
      masked: original.replace(/\d(?=\d{4})/g, "•"),
    });
  }
  for (const m of text.matchAll(PLATE_RE)) {
    matches.push({ kind: "Vehicle plate", original: m[0], masked: "[REDACTED-PLATE]" });
  }
  for (const m of text.matchAll(EMAIL_RE)) {
    const v = m[0];
    // skip obvious non-personal (gmail/well-known) only if it appears in dept list — but mask all by default
    const [user, domain] = v.split("@");
    const maskedUser = user.length <= 2 ? "••" : user[0] + "•".repeat(Math.max(1, user.length - 2)) + user[user.length - 1];
    matches.push({
      kind: "Email",
      original: v,
      masked: `${maskedUser}@${domain}`,
    });
  }

  return matches;
}

export function maskPii(text: string): string {
  let out = text;
  out = out.replace(PHONE_RE, (m) => m.replace(/\d(?=\d{4})/g, "•"));
  out = out.replace(AADHAAR_RE, (m) => (m.replace(/\D/g, "").length === 12 ? m.replace(/\d(?=\d{4})/g, "•") : m));
  out = out.replace(PLATE_RE, "[REDACTED-PLATE]");
  return out;
}

export function hasPii(text: string): boolean {
  return detectPii(text).length > 0;
}