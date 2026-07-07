"use client";

import { useCallback, useRef, useState } from "react";
import type { TriageResult } from "@/lib/prompts";
import { useHistory, type HistoryEntry } from "@/lib/history";

const EXAMPLES: { label: string; language: string; text: string }[] = [
  {
    label: "Broken Pipe (Hinglish)",
    language: "Hinglish",
    text:
      "Bhai mera paani 3 din se nahi aa raha, gali mein pipe phata hua hai aur paani sadak pe beh raha hai. Kuch karo please, tanker bhi nahi aa raha.",
  },
  {
    label: "Garbage Dump (Hindi)",
    language: "Hindi",
    text:
      "हमारे मोहल्ले में पिछले एक हफ़्ते से कूड़े का ढेर लगा हुआ है। नगर निगम की गाड़ी नहीं आ रही। बदबू इतनी है कि बच्चे बीमार पड़ रहे हैं।",
  },
  {
    label: "Streetlight (English)",
    language: "English",
    text:
      "The streetlight at the corner of 5th Main and MG Road has been out for two weeks. It is pitch dark after sunset and feels unsafe to walk, especially for women returning from work late.",
  },
];

function urgencyTone(score: number): {
  label: string;
  classes: string;
  ring: string;
} {
  if (score >= 8)
    return {
      label: "Critical",
      classes: "bg-red-100 text-red-800 border-red-300",
      ring: "ring-red-300",
    };
  if (score >= 4)
    return {
      label: "Moderate",
      classes: "bg-amber-100 text-amber-800 border-amber-300",
      ring: "ring-amber-300",
    };
  return {
    label: "Low",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-300",
    ring: "ring-emerald-300",
  };
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TriageResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { entries, addEntry, removeEntry, clearAll, hydrated } = useHistory();

  const hasInput = text.trim().length > 0 || imageDataUrl !== null;

  const onSubmit = useCallback(async () => {
    if (!hasInput || busy) return;
    setBusy(true);
    setError(null);
    setTicket(null);
    setCopied(false);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || undefined,
          imageDataUrl: imageDataUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      const t: TriageResult = data.ticket;
      setTicket(t);
      addEntry({
        ...t,
        originalText: text.trim(),
        hadImage: Boolean(imageDataUrl),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [hasInput, busy, text, imageDataUrl, addEntry]);

  const onPickImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Image is too large. Please keep it under 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setImageName(file.name);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setImageName(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const copyDraft = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.formal_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = ticket.formal_draft;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const loadExample = (ex: (typeof EXAMPLES)[number]) => {
    setText(ex.text);
    setImageDataUrl(null);
    setImageName(null);
    setTicket(null);
    setError(null);
  };

  const restoreHistory = (entry: HistoryEntry) => {
    setText(entry.originalText);
    setTicket({
      core_issue: entry.core_issue,
      target_department: entry.target_department,
      urgency_score: entry.urgency_score,
      formal_draft: entry.formal_draft,
      next_step: entry.next_step,
    });
    setError(null);
    setShowHistory(false);
  };

  const tone = ticket ? urgencyTone(ticket.urgency_score) : null;

  return (
    <main className="min-h-screen w-full">
      {/* Top bar */}
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-900"
          >
            NT
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">NagrikTriage</div>
            <div className="text-xs text-slate-600">
              Smart Bharat Civic Companion
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition"
        >
          {showHistory ? "Hide history" : `Recent (${hydrated ? entries.length : 0})`}
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main column */}
        <section className="space-y-8">
          {/* Hero */}
          <div className="text-center lg:text-left pt-2 sm:pt-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Turn civic frustration into a{" "}
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-green-700 bg-clip-text text-transparent">
                filed ticket
              </span>
              .
            </h1>
            <p className="mt-3 text-slate-700 max-w-2xl mx-auto lg:mx-0">
              Type or paste your complaint in any language — Hinglish, Hindi,
              Tamil, English. NagrikTriage reads your rant, picks the right
              department, scores urgency, and drafts a formal email you can
              copy and send.
            </p>
          </div>

          {/* Input card */}
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-5 sm:p-6">
            <label
              htmlFor="rant"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Your complaint
            </label>
            <textarea
              id="rant"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='e.g. "Bhai paani nahi aa raha 3 din se, pura mohalla pareshan hai..."'
              rows={6}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              disabled={busy}
            />

            {/* Image upload */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickImage(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
                disabled={busy}
              >
                📷 Upload photo
              </button>
              {imageName && (
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-md">
                  <span className="truncate max-w-[180px]">{imageName}</span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-slate-500 hover:text-red-600"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              )}
              <span className="text-xs text-slate-500">
                Tip: a photo of the issue works too — AI will deduce it.
              </span>
            </div>

            {imageDataUrl && (
              <div className="mt-3 relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Uploaded civic issue"
                  className="max-h-40 rounded-lg border border-slate-200"
                />
              </div>
            )}

            {/* Example buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center mr-1">
                Try:
              </span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => loadExample(ex)}
                  disabled={busy}
                  className="text-xs px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 transition disabled:opacity-50"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={!hasInput || busy}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full pulse-soft" />
                    Routing your complaint…
                  </span>
                ) : (
                  "Generate Ticket"
                )}
              </button>
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Result card */}
          {ticket && tone && (
            <article
              key={
                ticket.core_issue +
                ticket.target_department +
                ticket.urgency_score
              }
              className={`fade-up bg-white rounded-2xl border border-slate-200 shadow-xl p-6 ring-1 ${tone.ring}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">
                    Routed ticket
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {ticket.core_issue}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border ${tone.classes}`}
                  >
                    Urgency {ticket.urgency_score}/10 · {tone.label}
                  </span>
                  <span className="text-xs text-slate-600">
                    Dept:{" "}
                    <span className="font-medium text-slate-800">
                      {ticket.target_department}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-600 uppercase">
                    Target department
                  </div>
                  <div className="mt-1 text-slate-900 font-medium">
                    {ticket.target_department}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-600 uppercase">
                    Next step
                  </div>
                  <div className="mt-1 text-slate-900">{ticket.next_step}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-600 uppercase">
                    Formal draft (copy & send)
                  </div>
                  <button
                    type="button"
                    onClick={copyDraft}
                    className="text-xs px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition"
                  >
                    {copied ? "✓ Copied" : "Copy Draft"}
                  </button>
                </div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-4">
                  {ticket.formal_draft}
                </pre>
              </div>
            </article>
          )}

          {/* Empty state hint */}
          {!ticket && !busy && !error && (
            <div className="text-center text-sm text-slate-600">
              Your generated ticket will appear here.
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside
          className={`${
            showHistory ? "block" : "hidden lg:block"
          } lg:sticky lg:top-4 self-start`}
        >
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-md p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent complaints</h3>
              {hydrated && entries.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-red-600"
                >
                  Clear all
                </button>
              )}
            </div>
            {!hydrated && (
              <p className="mt-3 text-xs text-slate-500">Loading…</p>
            )}
            {hydrated && entries.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Tickets you generate will be saved here on this device.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {entries.map((e) => {
                const t = urgencyTone(e.urgency_score);
                return (
                  <li
                    key={e.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
                  >
                    <button
                      type="button"
                      onClick={() => restoreHistory(e)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-900 text-sm">
                          {e.core_issue}
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${t.classes}`}
                        >
                          {e.urgency_score}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {e.target_department}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {relativeTime(e.createdAt)}
                        {e.hadImage ? " · with photo" : ""}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEntry(e.id)}
                      className="mt-1 text-[10px] text-slate-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-600">How it works:</strong> your rant
            is sent to Gemini 2.5 Flash with a strict JSON schema. The model
            returns department, urgency and a formal English draft — no chat,
            no guessing. History stays in your browser only.
          </div>
        </aside>
      </div>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 pb-10 text-center text-xs text-slate-500">
        Built for Smart Bharat · Powered by Gemini · Citizen language: any.
      </footer>
    </main>
  );
}