"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { TriageResult } from "@/lib/prompts";
import { useHistory, findDuplicates, type HistoryEntry } from "@/lib/history";
import { CITIES, CITY_BY_ID, findCityDepartment, OTHER_CITY_ID, NATIONAL_HELPLINES, type CityRecord } from "@/lib/cities";
import { LANGUAGES, t, type LangCode } from "@/lib/i18n";
import { useSpeech, speak } from "@/lib/useSpeech";
import { detectPii, hasPii, maskPii } from "@/lib/pii";
import { toPng } from "html-to-image";

const EXAMPLES: { label: string; language: LangCode; text: string }[] = [
  { label: "Broken Pipe (Hinglish)", language: "hi", text: "Bhai mera paani 3 din se nahi aa raha, gali mein pipe phata hua hai aur paani sadak pe beh raha hai. Kuch karo please, tanker bhi nahi aa raha." },
  { label: "Garbage Dump (Hindi)", language: "hi", text: "हमारे मोहल्ले में पिछले एक हफ़्ते से कूड़े का ढेर लगा हुआ है। नगर निगम की गाड़ी नहीं आ रही। बदबू इतनी है कि बच्चे बीमार पड़ रहे हैं।" },
  { label: "Streetlight (English)", language: "en", text: "The streetlight at the corner of 5th Main and MG Road has been out for two weeks. It is pitch dark after sunset and feels unsafe to walk, especially for women returning from work late." },
  { label: "தண்ணீர் வரவில்லை (Tamil)", language: "ta", text: "கடந்த மூன்று நாட்களாக எங்கள் தெருவில் தண்ணீர் வரவில்லை. குழந்தைகள் பள்ளிக்கு போக முடியவில்லை. யாராவது உதவுங்கள், டேங்கர் கூட வரவில்லை." },
  { label: "বিদ্যুৎ বিভ্রাট (Bengali)", language: "bn", text: "গত ২ দিন ধরে আমাদের এলাকায় বিদ্যুৎ নেই। বৃদ্ধ মা-বাবা ফ্যান ছাড়া থাকতে পারছেন না। অফিস থেকে ফিরে বাচ্চাদের পড়াশোনা হচ্ছে না।" },
  { label: "రోడ్డు గొయ్యి (Telugu)", language: "te", text: "మా కాలనీ మెయిన్ రోడ్డుపై పెద్ద గొయ్యి ఏర్పడింది. రాత్రి సమయంలో రెండు బైకులు పడిపోయాయి. పిల్లలు బడికి వెళ్తున్నారు, ప్రమాదం పొంచి ఉంది." },
  { label: "खड्डा (Marathi)", language: "mr", text: "आमच्या गल्लीत मोठा खड्डा पडला आहे. काल रात्री एक वृद्ध व्यक्ती पडली आणि त्यांना दुखापत झाली. कृपया लवकरात लवकर दुरुस्त करा." },
  { label: "Live Wire (English)", language: "en", text: "There is a snapped live electric wire lying across the footpath near the bus stop on Linking Road. Sparks are visible and children walk past every morning. This is an extreme hazard." },
];

const KIND_LABEL_EN: Record<string, string> = {
  water: "💧 Water", power: "⚡ Power", sanitation: "🗑️ Sanitation", roads: "🛣️ Roads",
  streetlight: "💡 Streetlight", health: "🏥 Health", fire: "🔥 Fire", police: "🚓 Police", other: "📋 Other",
};

const SPEECH_LANG: Record<LangCode, string> = {
  en: "en-IN", hi: "hi-IN", ta: "ta-IN", bn: "bn-IN", te: "te-IN", mr: "mr-IN",
};

function urgencyTone(score: number) {
  if (score >= 8) return { label: "Critical", classes: "bg-red-100 text-red-800 border-red-300", ring: "ring-red-300" };
  if (score >= 4) return { label: "Moderate", classes: "bg-amber-100 text-amber-800 border-amber-300", ring: "ring-amber-300" };
  return { label: "Low", classes: "bg-emerald-100 text-emerald-800 border-emerald-300", ring: "ring-emerald-300" };
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CitizenPage() {
  const [lang, setLang] = useState<LangCode>("en");
  const [cityId, setCityId] = useState<string>("delhi");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TriageResult | null>(null);
  const [lastTicketId, setLastTicketId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [piiWarningOpen, setPiiWarningOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const shareCardRef = useRef<HTMLDivElement | null>(null);

  const { entries, addEntry, removeEntry, clearAll, hydrated } = useHistory();

  const city: CityRecord | undefined = CITY_BY_ID[cityId];
  const matchedDept = useMemo(
    () => (ticket ? findCityDepartment(city, ticket.target_department) : null),
    [ticket, city]
  );

  const voice = useSpeech((spoken) => setText(spoken));

  const duplicates = useMemo(() => {
    if (!ticket) return [];
    return findDuplicates(
      { core_issue: ticket.core_issue, incident_kind: ticket.incident_kind },
      entries
    );
  }, [ticket, entries]);

  const hasInput = text.trim().length > 0 || imageDataUrl !== null;

  const onSubmit = useCallback(async () => {
    if (!hasInput || busy) return;
    setBusy(true);
    setError(null);
    setTicket(null);
    setCopied(false);
    setLastTicketId(null);
    try {
      const cityHint =
        city && city.id !== OTHER_CITY_ID
          ? `${city.name}, ${city.state}` + (geo ? ` (lat ${geo.lat.toFixed(4)}, lng ${geo.lng.toFixed(4)})` : "")
          : geo
          ? `India (coordinates lat ${geo.lat.toFixed(4)}, lng ${geo.lng.toFixed(4)} — infer the correct state-level department)`
          : "India (citizen's city not listed — pick the appropriate state-level or national municipal body)";
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || undefined,
          imageDataUrl: imageDataUrl || undefined,
          cityHint,
          cityId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
      const t: TriageResult = data.ticket;
      setTicket(t);
      if (hasPii(t.formal_draft)) setPiiWarningOpen(true);
      const saved = addEntry({
        ...t,
        originalText: text.trim(),
        hadImage: Boolean(imageDataUrl),
        cityId,
        geo,
      });
      setLastTicketId(saved.ticketId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [hasInput, busy, text, imageDataUrl, city, geo, cityId, addEntry]);

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

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      (e) => setError("Could not get location: " + e.message),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const copyDraft = async () => {
    if (!ticket) return;
    const text = piiWarningOpen ? maskPii(ticket.formal_draft) : ticket.formal_draft;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const shareWhatsApp = () => {
    if (!ticket || !city) return;
    const text =
      `[NagrikTriage ${lastTicketId ?? ""}] ${ticket.core_issue}\n` +
      `To: ${ticket.target_department}${matchedDept?.helpline ? ` (${matchedDept.helpline})` : ""}\n\n` +
      `${piiWarningOpen ? maskPii(ticket.formal_draft) : ticket.formal_draft}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadImage = async () => {
    if (!shareCardRef.current || !ticket) return;
    try {
      const dataUrl = await toPng(shareCardRef.current, { backgroundColor: "#fff7ed", cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `nagriktriage-${lastTicketId ?? "ticket"}.png`;
      a.click();
    } catch (e) {
      setError("Could not export image: " + (e instanceof Error ? e.message : ""));
    }
  };

  const speakDraft = () => {
    if (!ticket) return;
    speak(ticket.formal_draft, SPEECH_LANG[lang]);
  };

  const loadExample = (ex: (typeof EXAMPLES)[number]) => {
    setText(ex.text);
    setLang(ex.language);
    setImageDataUrl(null);
    setImageName(null);
    setTicket(null);
    setError(null);
  };

  const restoreHistory = (entry: HistoryEntry) => {
    setText(entry.originalText);
    setCityId(entry.cityId ?? "delhi");
    setTicket({
      core_issue: entry.core_issue,
      target_department: entry.target_department,
      urgency_score: entry.urgency_score,
      formal_draft: entry.formal_draft,
      next_step: entry.next_step,
      signals: entry.signals ?? [],
      incident_kind: entry.incident_kind ?? "other",
      confidence_score: entry.confidence_score ?? 0.7,
    });
    setLastTicketId(entry.ticketId);
    setError(null);
    setShowHistory(false);
  };

  const tone = ticket ? urgencyTone(ticket.urgency_score) : null;
  const tr = (k: Parameters<typeof t>[1]) => t(lang, k);

  return (
    <main className="min-h-screen w-full">
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between max-w-6xl mx-auto gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div aria-hidden className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-900">NT</div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">NagrikTriage</div>
              <div className="text-xs text-slate-600">{tr("tagline")}</div>
            </div>
          </Link>
          <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">Citizen</span>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="UI language" value={lang} onChange={(e) => setLang(e.target.value as LangCode)} className="text-xs rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5">
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.native}</option>))}
          </select>
          <Link href="/officer" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">Officer view →</Link>
          <Link href="/mayor" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">Mayor view →</Link>
          <Link href="/track" className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">{tr("trackTicket")}</Link>
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm transition">
            {showHistory ? tr("hideHistory") : `${tr("showHistory")} (${hydrated ? entries.length : 0})`}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 grid lg:grid-cols-[1fr_320px] gap-8">
        <section className="space-y-8">
          <div className="text-center lg:text-left pt-2 sm:pt-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              {tr("heroTitle")}{" "}
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-green-700 bg-clip-text text-transparent">{tr("heroAccent")}</span>.
            </h1>
            <p className="mt-3 text-slate-700 max-w-2xl mx-auto lg:mx-0">{tr("heroSub")}</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl border border-slate-200 shadow p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-700">{tr("pickCity")}</label>
              <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="mt-1 w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2">
                {CITIES.filter((c) => c.id !== OTHER_CITY_ID).map((c) => (<option key={c.id} value={c.id}>{c.name}, {c.state}</option>))}
                <option disabled>────────────</option>
                <option value={OTHER_CITY_ID}>Other / Not listed (national helplines)</option>
              </select>
              <div className="mt-1 text-[11px] text-slate-500">{tr("cityHelp")}</div>
            </div>
            <button type="button" onClick={useLocation} className="text-sm px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition">📍 Use my location</button>
            {geo && <span className="text-xs text-slate-600">{geo.lat.toFixed(3)}, {geo.lng.toFixed(3)}</span>}
            <button type="button" onClick={() => setShowHowItWorks((v) => !v)} className="text-sm px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition">{tr("howItWorks")}</button>
          </div>

          {showHowItWorks && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">
              <ol className="list-decimal pl-5 space-y-1">
                <li>You rant in any language. Voice, text, or photo.</li>
                <li>Gemini 2.5 Flash translates, classifies, scores urgency, and drafts a formal email — in a single structured call.</li>
                <li>The result card shows the routed department, real helpline, copy-paste email, and an explainability panel.</li>
                <li>Track status on the live timeline. Officers see the same complaint on a city heat-map.</li>
              </ol>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-5 sm:p-6">
            <label htmlFor="rant" className="block text-sm font-medium text-slate-700 mb-2">{tr("inputLabel")}</label>
            <textarea id="rant" value={text} onChange={(e) => setText(e.target.value)} placeholder={tr("inputPlaceholder")} rows={6} className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" disabled={busy} />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => voice.listening ? voice.stop() : voice.start(SPEECH_LANG[lang])} disabled={busy} className={`text-sm px-3 py-2 rounded-lg transition disabled:opacity-50 ${voice.listening ? "bg-red-600 text-white animate-pulse" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                {voice.listening ? "⏹ Stop" : "🎤 Speak"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickImage(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="text-sm px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50" disabled={busy}>{tr("uploadPhoto")}</button>
              {imageName && (
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-md">
                  <span className="truncate max-w-[180px]">{imageName}</span>
                  <button type="button" onClick={clearImage} className="text-slate-500 hover:text-red-600" aria-label="Remove image">✕</button>
                </div>
              )}
              <span className="text-xs text-slate-500">{tr("photoTip")}</span>
            </div>
            {voice.error && <div className="mt-2 text-xs text-red-700">{voice.error}</div>}
            {imageDataUrl && (<div className="mt-3 relative inline-block">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={imageDataUrl} alt="Uploaded civic issue" className="max-h-40 rounded-lg border border-slate-200" /></div>)}

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center mr-1">{tr("tryLabel")}</span>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} type="button" onClick={() => loadExample(ex)} disabled={busy} className="text-xs px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 transition disabled:opacity-50">{ex.label}</button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={onSubmit} disabled={!hasInput || busy} className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
                {busy ? <span className="inline-flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full pulse-soft" />{tr("generating")}</span> : tr("generate")}
              </button>
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
            </div>
          </div>

          {ticket && tone && (
            <article key={(ticket.core_issue ?? "") + ticket.urgency_score} className={`bg-white rounded-2xl border border-slate-200 shadow-xl p-6 ring-1 ${tone.ring}`}>
              {ticket.urgency_score >= 8 && (
                <div className="mb-5 -mt-2 -mx-2 rounded-xl bg-red-600 text-white p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold">{tr("emergency")}{city?.id === OTHER_CITY_ID && <span className="ml-2 text-xs font-normal opacity-90">(national helplines)</span>}</div>
                  <div className="flex flex-wrap gap-2">
                    {(city?.id === OTHER_CITY_ID ? NATIONAL_HELPLINES : city?.emergency ?? NATIONAL_HELPLINES).map((e) => (
                      <a key={e.number} href={e.tel} className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg font-medium">📞 {e.label} {e.number}</a>
                    ))}
                  </div>
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <div className="text-sm font-semibold text-amber-900">{tr("duplicateWarning")}</div>
                  <ul className="mt-2 space-y-1 text-xs text-amber-900">
                    {duplicates.map((d) => (<li key={d.id}>• <strong>{d.core_issue}</strong> · {d.ticketId} · {relativeTime(d.createdAt)}</li>))}
                  </ul>
                </div>
              )}

              <div ref={shareCardRef} className="bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">{tr("routedTicket")} · {lastTicketId ?? "—"}</div>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{ticket.core_issue}</h2>
                    <div className="mt-1 text-xs text-slate-500">{KIND_LABEL_EN[ticket.incident_kind] ?? ticket.incident_kind} · confidence {Math.round(ticket.confidence_score * 100)}%</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border ${tone.classes}`}>Urgency {ticket.urgency_score}/10 · {tone.label}</span>
                    {matchedDept?.helpline && (
                      <a href={`tel:${matchedDept.helpline.replace(/[^0-9+]/g, "")}`} className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100">📞 Helpline {matchedDept.helpline}</a>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-600 uppercase">{tr("targetDept")}</div>
                    <div className="mt-1 text-slate-900 font-medium">{ticket.target_department}</div>
                    {matchedDept?.email && <div className="text-xs text-slate-500 mt-1">✉️ {matchedDept.email}</div>}
                    {city?.id === OTHER_CITY_ID && <div className="text-[11px] text-slate-500 mt-1 italic">No city-specific data — pick your state for localized email + helpline. The AI inferred the appropriate body.</div>}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-600 uppercase">{tr("nextStep")}</div>
                    <div className="mt-1 text-slate-900">{ticket.next_step}</div>
                  </div>
                </div>

                {ticket.signals && ticket.signals.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50 p-4">
                    <div className="text-xs font-semibold text-slate-600 uppercase">{tr("confidence")} · Urgency {ticket.urgency_score}/10</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ticket.signals.map((s, i) => (<span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">+ {s}</span>))}
                    </div>
                  </div>
                )}

                {text.trim() && (
                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase">{tr("compareRant")}</div>
                      <p className="mt-1 text-sm text-slate-700 italic whitespace-pre-wrap">"{text.trim()}"</p>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <div className="text-xs font-semibold text-orange-700 uppercase">{tr("compareFormal")}</div>
                      <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{ticket.formal_draft}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-slate-600 uppercase">{tr("formalDraft")}</div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={copyDraft} className="text-xs px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition">{copied ? tr("copied") : tr("copy")}</button>
                      <button type="button" onClick={speakDraft} className="text-xs px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 transition">🔊 Read aloud</button>
                      <button type="button" onClick={shareWhatsApp} className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition">{tr("shareWhatsApp")}</button>
                      <button type="button" onClick={downloadImage} className="text-xs px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 transition">{tr("downloadImage")}</button>
                      <Link href="/track" className="text-xs px-3 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition">{tr("trackTicket")}</Link>
                    </div>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-4">{piiWarningOpen ? maskPii(ticket.formal_draft) : ticket.formal_draft}</pre>
                </div>

                {piiWarningOpen && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="font-semibold">{tr("piiDetected")}</div>
                    <ul className="mt-1 text-xs space-y-0.5">
                      {detectPii(ticket.formal_draft).map((m, i) => (<li key={i}>• {m.kind}: <span className="line-through">{m.original}</span> → <span className="font-mono">{m.masked}</span></li>))}
                    </ul>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => setPiiWarningOpen(false)} className="text-xs px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700">{tr("piiMask")}</button>
                      <button type="button" onClick={() => setPiiWarningOpen(false)} className="text-xs px-3 py-1.5 rounded-md bg-white border border-amber-300">{tr("piiSkip")}</button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}

          {!ticket && !busy && !error && <div className="text-center text-sm text-slate-600">Your generated ticket will appear here.</div>}
        </section>

        <aside className={`${showHistory ? "block" : "hidden lg:block"} lg:sticky lg:top-4 self-start`}>
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-md p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{tr("recent")}</h3>
              {hydrated && entries.length > 0 && (<button type="button" onClick={clearAll} className="text-xs text-slate-500 hover:text-red-600">{tr("clearAll")}</button>)}
            </div>
            {!hydrated && <p className="mt-3 text-xs text-slate-500">{tr("loading")}</p>}
            {hydrated && entries.length === 0 && <p className="mt-3 text-xs text-slate-500">{tr("noHistory")}</p>}
            <ul className="mt-3 space-y-2">
              {entries.map((e) => {
                const tn = urgencyTone(e.urgency_score);
                return (
                  <li key={e.id} className="rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition">
                    <button type="button" onClick={() => restoreHistory(e)} className="block w-full text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-900 text-sm">{e.core_issue}</div>
                        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${tn.classes}`}>{e.urgency_score}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">{e.target_department}</div>
                      <div className="mt-1 text-[10px] text-slate-400">{e.ticketId} · {relativeTime(e.createdAt)}{e.hadImage ? " · 📷" : ""}</div>
                    </button>
                    <button type="button" onClick={() => removeEntry(e.id)} className="mt-1 text-[10px] text-slate-400 hover:text-red-600">{tr("remove")}</button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 pb-10 text-center text-xs text-slate-500">{tr("footer")}</footer>
    </main>
  );
}