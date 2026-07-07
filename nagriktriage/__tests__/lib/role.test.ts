// =============================================================================
//  Tests for lib/role.ts — role cookie helpers & route mapping.
// =============================================================================
import { describe, it, expect, vi } from "vitest";
import { ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/role";

// ---------------------------------------------------------------------------
//  ROLE_HOME mapping
// ---------------------------------------------------------------------------
describe("ROLE_HOME", () => {
  it("maps citizen to /citizen", () => {
    expect(ROLE_HOME.citizen).toBe("/citizen");
  });

  it("maps officer to /officer", () => {
    expect(ROLE_HOME.officer).toBe("/officer");
  });

  it("maps mayor to /mayor", () => {
    expect(ROLE_HOME.mayor).toBe("/mayor");
  });

  it("has exactly 3 entries", () => {
    expect(Object.keys(ROLE_HOME)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
//  ROLE_LABEL mapping
// ---------------------------------------------------------------------------
describe("ROLE_LABEL", () => {
  it("labels citizen as 'Citizen'", () => {
    expect(ROLE_LABEL.citizen).toBe("Citizen");
  });

  it("labels officer as 'Nodal Officer'", () => {
    expect(ROLE_LABEL.officer).toBe("Nodal Officer");
  });

  it("labels mayor as 'City Administrator'", () => {
    expect(ROLE_LABEL.mayor).toBe("City Administrator");
  });

  it("has exactly 3 entries", () => {
    expect(Object.keys(ROLE_LABEL)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
//  readRoleCookie — cookie-based role reading (unmocked local test)
// ---------------------------------------------------------------------------
describe("readRoleCookie", () => {
  // The module uses "server-only" and Next.js cookies().
  // Our setup.ts mocks next/headers, so we import dynamically.
  it("returns 'citizen' by default when no cookie is set", async () => {
    const { readRoleCookie } = await import("@/lib/role");
    const role = await readRoleCookie();
    expect(role).toBe("citizen");
  });
});
