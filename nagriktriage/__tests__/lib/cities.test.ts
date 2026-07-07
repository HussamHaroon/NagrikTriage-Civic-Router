// =============================================================================
//  Tests for lib/cities.ts — Indian municipal data & department matching.
// =============================================================================
import { describe, it, expect } from "vitest";
import {
  CITIES,
  CITY_BY_ID,
  NATIONAL_HELPLINES,
  OTHER_CITY_ID,
  findCityDepartment,
  type CityRecord,
} from "@/lib/cities";

// ---------------------------------------------------------------------------
//  CITIES array
// ---------------------------------------------------------------------------
describe("CITIES", () => {
  it("has 9 entries (8 metros + 'other')", () => {
    expect(CITIES).toHaveLength(9);
  });

  it("includes the 8 major metros", () => {
    const ids = CITIES.map((c) => c.id);
    expect(ids).toContain("delhi");
    expect(ids).toContain("mumbai");
    expect(ids).toContain("bengaluru");
    expect(ids).toContain("chennai");
    expect(ids).toContain("kolkata");
    expect(ids).toContain("hyderabad");
    expect(ids).toContain("pune");
    expect(ids).toContain("ahmedabad");
  });

  it("has the 'other' fallback city", () => {
    expect(CITIES.find((c) => c.id === OTHER_CITY_ID)).toBeDefined();
  });

  it("each city has a non-empty name and state", () => {
    for (const city of CITIES) {
      expect(city.name.length).toBeGreaterThan(0);
      expect(city.state.length).toBeGreaterThan(0);
    }
  });

  it("each city has a valid center [lat, lng]", () => {
    for (const city of CITIES) {
      expect(city.center).toHaveLength(2);
      expect(city.center[0]).toBeGreaterThanOrEqual(-90);
      expect(city.center[0]).toBeLessThanOrEqual(90);
      expect(city.center[1]).toBeGreaterThanOrEqual(-180);
      expect(city.center[1]).toBeLessThanOrEqual(180);
    }
  });

  it("each metro city has at least one department", () => {
    for (const city of CITIES.filter((c) => c.id !== OTHER_CITY_ID)) {
      expect(city.departments.length).toBeGreaterThan(0);
    }
  });

  it("'other' city has no departments", () => {
    const other = CITIES.find((c) => c.id === OTHER_CITY_ID)!;
    expect(other.departments).toHaveLength(0);
  });

  it("each city has emergency helplines", () => {
    for (const city of CITIES) {
      expect(city.emergency.length).toBeGreaterThan(0);
    }
  });

  it("each metro city has a non-empty portal", () => {
    for (const city of CITIES.filter((c) => c.id !== OTHER_CITY_ID)) {
      expect(city.portal.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
//  CITY_BY_ID
// ---------------------------------------------------------------------------
describe("CITY_BY_ID", () => {
  it("maps every city id to its record", () => {
    for (const city of CITIES) {
      expect(CITY_BY_ID[city.id]).toBe(city);
    }
  });

  it("returns undefined for unknown city id", () => {
    expect(CITY_BY_ID["nonexistent"]).toBeUndefined();
  });

  it("has exactly 9 keys", () => {
    expect(Object.keys(CITY_BY_ID)).toHaveLength(9);
  });
});

// ---------------------------------------------------------------------------
//  NATIONAL_HELPLINES
// ---------------------------------------------------------------------------
describe("NATIONAL_HELPLINES", () => {
  it("has the 112 police/fire/ambulance helpline", () => {
    expect(NATIONAL_HELPLINES.find((h) => h.number === "112")).toBeDefined();
  });

  it("has the women helpline 181", () => {
    expect(NATIONAL_HELPLINES.find((h) => h.number === "181")).toBeDefined();
  });

  it("has the child helpline 1098", () => {
    expect(NATIONAL_HELPLINES.find((h) => h.number === "1098")).toBeDefined();
  });

  it("each helpline has label, number, and tel", () => {
    for (const h of NATIONAL_HELPLINES) {
      expect(h.label.length).toBeGreaterThan(0);
      expect(h.number.length).toBeGreaterThan(0);
      expect(h.tel).toMatch(/^tel:/);
    }
  });
});

// ---------------------------------------------------------------------------
//  findCityDepartment
// ---------------------------------------------------------------------------
describe("findCityDepartment", () => {
  const delhi = CITY_BY_ID["delhi"]!;
  const mumbai = CITY_BY_ID["mumbai"]!;
  const bengaluru = CITY_BY_ID["bengaluru"]!;
  const other = CITY_BY_ID["other"]!;

  it("returns null when city is undefined", () => {
    expect(findCityDepartment(undefined, "water")).toBeNull();
  });

  it("returns null for 'other' city (no departments)", () => {
    expect(findCityDepartment(other, "water")).toBeNull();
  });

  it("matches water-related departments in Delhi", () => {
    const dept = findCityDepartment(delhi, "Delhi Jal Board (Water)");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("Jal Board");
  });

  it("matches power/electricity departments in Mumbai", () => {
    const dept = findCityDepartment(mumbai, "BEST Undertaking (Power)");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("BEST");
  });

  it("matches sanitation in Delhi", () => {
    const dept = findCityDepartment(delhi, "Municipal Corporation of Delhi (MCD) — Sanitation");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("MCD");
  });

  it("matches road/pothole departments", () => {
    const dept = findCityDepartment(mumbai, "Maharashtra PWD — road pothole");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("PWD");
  });

  it("matches fire departments", () => {
    const dept = findCityDepartment(delhi, "Fire department complaint");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("Fire");
  });

  it("matches police departments", () => {
    const dept = findCityDepartment(mumbai, "Police complaint theft");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("Police");
  });

  it("matches health departments", () => {
    const dept = findCityDepartment(bengaluru, "Health department mosquito dengue");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("BBMP");
  });

  it("matches BESCOM for power in Bengaluru", () => {
    const dept = findCityDepartment(bengaluru, "BESCOM Electricity");
    expect(dept).not.toBeNull();
    expect(dept!.name).toContain("BESCOM");
  });

  it("case-insensitive matching", () => {
    const dept = findCityDepartment(delhi, "delhi jal board water");
    expect(dept).not.toBeNull();
  });

  it("matches Hindi keywords (paani = water)", () => {
    const dept = findCityDepartment(delhi, "Paani nahi aa raha");
    expect(dept).not.toBeNull();
  });

  it("matches Hinglish keywords (bijli = power)", () => {
    const dept = findCityDepartment(mumbai, "Bijli gone for 3 days");
    expect(dept).not.toBeNull();
  });

  it("matches garbage/sanitation keywords", () => {
    const dept = findCityDepartment(delhi, "Garbage kachra everywhere");
    expect(dept).not.toBeNull();
  });

  it("falls back to first department for unknown category", () => {
    const dept = findCityDepartment(delhi, "Something completely unrelated");
    expect(dept).not.toBeNull();
    expect(dept).toBe(delhi.departments[0]);
  });
});
