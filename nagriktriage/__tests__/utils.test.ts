import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn()", () => {
  it("merges simple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values (false, null, undefined)", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("handles conditional class objects", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("handles arrays of class values", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("later Tailwind utilities win over earlier conflicting ones (twMerge)", () => {
    // padding on x: later `px-4` should beat earlier `px-2`.
    expect(cn("px-2", "px-4")).toBe("px-4");
    // margin on top: later `mt-6` should beat earlier `mt-2`.
    expect(cn("mt-2", "mt-6")).toBe("mt-6");
  });

  it("preserves non-conflicting Tailwind utilities", () => {
    expect(cn("px-2", "py-4", "text-red-500")).toBe(
      "px-2 py-4 text-red-500"
    );
  });

  it("returns an empty string when nothing is supplied", () => {
    expect(cn()).toBe("");
    expect(cn(undefined, null, false)).toBe("");
  });
});