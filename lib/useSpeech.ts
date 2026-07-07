"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser-native speech-to-text. Chromium supports it well; Safari has it
// with quirks; Firefox does not. We surface support state to the UI.

type SR =
  | (typeof window extends { SpeechRecognition: infer T } ? T : never)
  | (typeof window extends { webkitSpeechRecognition: infer T } ? T : never)
  | null;

function getSR(): any | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error — vendor prefixed
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeech(onResult: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSR()));
  }, []);

  const start = useCallback(
    (lang = "en-IN") => {
      setError(null);
      const SR = getSR();
      if (!SR) {
        setError("Voice input is not supported in this browser. Try Chrome.");
        return;
      }
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      let finalText = "";
      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        onResult((finalText + interim).trim());
      };
      rec.onerror = (e: any) => {
        setError(e?.error ?? "Voice input error");
        setListening(false);
      };
      rec.onend = () => setListening(false);
      rec.start();
      recRef.current = rec;
      setListening(true);
    },
    [onResult]
  );

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop, error };
}

// Speech synthesis (TTS) — used to read the formal draft aloud.
export function speak(text: string, lang = "en-IN") {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}