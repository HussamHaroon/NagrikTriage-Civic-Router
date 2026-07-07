// =============================================================================
//  Tests for lib/i18n.ts — multilingual UI label system.
// =============================================================================
import { describe, it, expect } from "vitest";
import { t, LANGUAGES, type LangCode } from "@/lib/i18n";

// ---------------------------------------------------------------------------
//  LANGUAGES array
// ---------------------------------------------------------------------------
describe("LANGUAGES", () => {
  it("has 6 languages", () => {
    expect(LANGUAGES).toHaveLength(6);
  });

  it("includes the expected language codes", () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["en", "hi", "ta", "bn", "te", "mr"]);
  });

  it("each language has code, label, and native name", () => {
    for (const lang of LANGUAGES) {
      expect(lang.code.length).toBe(2);
      expect(lang.label.length).toBeGreaterThan(0);
      expect(lang.native.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
//  t() function
// ---------------------------------------------------------------------------
describe("t()", () => {
  const keysToTest = [
    "tagline",
    "heroTitle",
    "heroAccent",
    "heroSub",
    "inputLabel",
    "generate",
    "generating",
    "routedTicket",
    "targetDept",
    "nextStep",
    "formalDraft",
    "copy",
    "copied",
    "recent",
    "noHistory",
    "loading",
    "clearAll",
    "pickCity",
    "uploadPhoto",
    "share",
    "trackTicket",
    "emergency",
    "duplicateWarning",
    "piiDetected",
    "howItWorks",
    "footer",
  ] as const;

  it("returns the English string for 'en'", () => {
    expect(t("en", "tagline")).toBe("Smart Bharat Civic Companion");
    expect(t("en", "generate")).toBe("Generate Ticket");
    expect(t("en", "copy")).toBe("Copy Draft");
  });

  it("returns Hindi string for 'hi'", () => {
    expect(t("hi", "generate")).toBe("शिकायत बनाएँ");
    expect(t("hi", "copy")).toBe("मसौदा कॉपी करें");
  });

  it("returns Tamil string for 'ta'", () => {
    expect(t("ta", "generate")).toBe("புகார் உருவாக்கு");
  });

  it("returns Bengali string for 'bn'", () => {
    expect(t("bn", "generate")).toBe("অভিযোগ তৈরি করুন");
  });

  it("returns Telugu string for 'te'", () => {
    expect(t("te", "generate")).toBe("ఫిర్యాదు సృష్టించండి");
  });

  it("returns Marathi string for 'mr'", () => {
    expect(t("mr", "generate")).toBe("तक्रार तयार करा");
  });

  it("every language has a translation for every key", () => {
    for (const lang of LANGUAGES) {
      for (const key of keysToTest) {
        const result = t(lang.code, key);
        expect(result.length).toBeGreaterThan(0);
        // Should not return the key itself (fallback) for valid keys
        expect(result).not.toBe(String(key));
      }
    }
  });

  it("falls back to English for unknown language code", () => {
    expect(t("xx" as LangCode, "tagline")).toBe("Smart Bharat Civic Companion");
  });

  it("returns the key as string for unknown keys", () => {
    expect(t("en", "nonexistent_key")).toBe("nonexistent_key");
  });

  it("English is not used for other languages (translations differ)", () => {
    for (const lang of LANGUAGES.filter((l) => l.code !== "en")) {
      expect(t(lang.code, "tagline")).not.toBe(t("en", "tagline"));
      expect(t(lang.code, "generate")).not.toBe(t("en", "generate"));
    }
  });

  it("Hindi uses Devanagari script", () => {
    const tagline = t("hi", "tagline");
    // Devanagari Unicode range: \u0900-\u097F
    const hasDevanagari = [...tagline].some((ch) =>
      ch.charCodeAt(0) >= 0x0900 && ch.charCodeAt(0) <= 0x097F
    );
    expect(hasDevanagari).toBe(true);
  });

  it("Tamil uses Tamil script", () => {
    const tagline = t("ta", "tagline");
    // Tamil Unicode range: \u0B80-\u0BFF
    const hasTamil = [...tagline].some((ch) =>
      ch.charCodeAt(0) >= 0x0B80 && ch.charCodeAt(0) <= 0x0BFF
    );
    expect(hasTamil).toBe(true);
  });

  it("Bengali uses Bengali script", () => {
    const tagline = t("bn", "tagline");
    // Bengali Unicode range: \u0980-\u09FF
    const hasBengali = [...tagline].some((ch) =>
      ch.charCodeAt(0) >= 0x0980 && ch.charCodeAt(0) <= 0x09FF
    );
    expect(hasBengali).toBe(true);
  });

  it("Telugu uses Telugu script", () => {
    const tagline = t("te", "tagline");
    // Telugu Unicode range: \u0C00-\u0C7F
    const hasTelugu = [...tagline].some((ch) =>
      ch.charCodeAt(0) >= 0x0C00 && ch.charCodeAt(0) <= 0x0C7F
    );
    expect(hasTelugu).toBe(true);
  });

  it("Marathi uses Devanagari script", () => {
    const tagline = t("mr", "tagline");
    const hasDevanagari = [...tagline].some((ch) =>
      ch.charCodeAt(0) >= 0x0900 && ch.charCodeAt(0) <= 0x097F
    );
    expect(hasDevanagari).toBe(true);
  });
});
