// =============================================================================
//  Tests for lib/utils.ts — cn() className combiner.
// =============================================================================
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("deduplicates conflicting Tailwind utilities (later wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("filters out falsy values", () => {
    expect(cn("base", null, undefined, "", "extra")).toBe("base extra");
  });

  it("handles arrays of classes", () => {
    expect(cn("base", ["child-1", "child-2"])).toBe("base child-1 child-2");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles single input", () => {
    expect(cn("solo")).toBe("solo");
  });

  it("deduplicates color classes (later wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("deduplicates bg classes", () => {
    expect(cn("bg-white", "bg-black")).toBe("bg-black");
  });

  it("merges different utility categories", () => {
    const result = cn("flex", "items-center", "gap-2", "p-4", "bg-white", "text-sm");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("gap-2");
    expect(result).toContain("p-4");
    expect(result).toContain("bg-white");
    expect(result).toContain("text-sm");
  });
});
