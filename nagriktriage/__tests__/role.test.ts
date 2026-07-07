import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock next/headers BEFORE importing the role module so that the
// cookie-based helpers can be exercised in isolation.
const mockStore: { data: Record<string, string> } = { data: {} };

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const v = mockStore.data[name];
      return v === undefined ? undefined : { name, value: v };
    },
    set: (name: string, value: string, _opts?: unknown) => {
      mockStore.data[name] = value;
    },
  })),
}));

// Re-import after the mock is installed.
const { readRoleCookie, writeRoleCookie, ROLE_HOME, ROLE_LABEL } = await import(
  "../lib/role"
);

describe("ROLE_HOME / ROLE_LABEL constants", () => {
  it("maps citizen/officer/mayor to their home routes", () => {
    expect(ROLE_HOME.citizen).toBe("/citizen");
    expect(ROLE_HOME.officer).toBe("/officer");
    expect(ROLE_HOME.mayor).toBe("/mayor");
  });

  it("provides a human label for every role", () => {
    expect(ROLE_LABEL.citizen).toBe("Citizen");
    expect(ROLE_LABEL.officer).toBe("Nodal Officer");
    expect(ROLE_LABEL.mayor).toBe("City Administrator");
  });
});

describe("readRoleCookie()", () => {
  beforeEach(() => {
    mockStore.data = {};
  });

  it("defaults to 'citizen' when no cookie is set", async () => {
    expect(await readRoleCookie()).toBe("citizen");
  });

  it("returns 'officer' when the cookie value is 'officer'", async () => {
    mockStore.data["nagrik_role"] = "officer";
    expect(await readRoleCookie()).toBe("officer");
  });

  it("returns 'mayor' when the cookie value is 'mayor'", async () => {
    mockStore.data["nagrik_role"] = "mayor";
    expect(await readRoleCookie()).toBe("mayor");
  });

  it("falls back to 'citizen' for unknown cookie values", async () => {
    mockStore.data["nagrik_role"] = "admin";
    expect(await readRoleCookie()).toBe("citizen");
  });

  it("falls back to 'citizen' if cookies() throws (e.g. outside request scope)", async () => {
    // Replace the mock just for this test by re-mocking once.
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async () => {
        throw new Error("outside request scope");
      }
    );
    expect(await readRoleCookie()).toBe("citizen");
  });
});

describe("writeRoleCookie()", () => {
  beforeEach(() => {
    mockStore.data = {};
  });

  it("writes the nagrik_role cookie", async () => {
    await writeRoleCookie("officer");
    expect(mockStore.data["nagrik_role"]).toBe("officer");
  });

  it("overwrites an existing value", async () => {
    mockStore.data["nagrik_role"] = "citizen";
    await writeRoleCookie("mayor");
    expect(mockStore.data["nagrik_role"]).toBe("mayor");
  });

  it("does not throw if cookies() throws", async () => {
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async () => {
        throw new Error("static prerender");
      }
    );
    await expect(writeRoleCookie("officer")).resolves.toBeUndefined();
  });
});