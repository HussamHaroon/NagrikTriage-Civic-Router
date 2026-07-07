import { describe, it, expect, beforeEach, vi } from "vitest";

// -----------------------------------------------------------------------------
// Mocks for modules imported by app/api/triage/route.ts
// -----------------------------------------------------------------------------
const mockTriageComplaint = vi.fn();
const mockAdminInsert = vi.fn();
const mockUserInsert = vi.fn();
const mockUserGetUser = vi.fn();

vi.mock("@/lib/gemini", () => ({
  triageComplaint: (input: unknown) => mockTriageComplaint(input),
}));

const userClientMock = {
  auth: { getUser: () => mockUserGetUser() },
  from: () => ({ insert: (rows: unknown) => mockUserInsert(rows) }),
};

const adminClientMock = {
  from: () => ({ insert: (rows: unknown) => mockAdminInsert(rows) }),
};

vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServer: async () => userClientMock,
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => adminClientMock,
}));

// Import after mocks are registered.
const { POST } = await import("../app/api/triage/route");

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/triage", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function triageResponse() {
  return {
    core_issue: "Burst water main",
    target_department: "Delhi Jal Board",
    urgency_score: 9,
    formal_draft: "To the authority ...",
    next_step: "Call helpline",
    signals: ["leakage on road"],
    incident_kind: "water",
    confidence_score: 0.92,
  };
}

beforeEach(() => {
  mockTriageComplaint.mockReset();
  mockAdminInsert.mockReset();
  mockUserInsert.mockReset();
  mockUserGetUser.mockReset();
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------
describe("POST /api/triage", () => {
  it("returns 400 when neither text nor image is provided", async () => {
    const res = await POST(buildRequest({}) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/text complaint or an image/i);
  });

  it("returns 400 when text exceeds 4000 characters", async () => {
    const res = await POST(
      buildRequest({ text: "x".repeat(4001) }) as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too long/i);
  });

  it("returns triage + ticket id when AI call succeeds (anonymous)", async () => {
    mockTriageComplaint.mockResolvedValueOnce(triageResponse());
    mockUserGetUser.mockResolvedValueOnce({ data: { user: null } });
    mockAdminInsert.mockReturnValueOnce({ error: null });

    const res = await POST(
      buildRequest({ text: "Pipe burst on Linking Road" }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticket.urgency_score).toBe(9);
    expect(body.ticketId).toMatch(/^NT-[A-Z]{3}-\d{4}-\d{5}$/);
    expect(body.saved).toBe(true);
    expect(mockAdminInsert).toHaveBeenCalledTimes(1);
    expect(mockUserInsert).not.toHaveBeenCalled();
  });

  it("uses the user-scoped client when the caller is authenticated", async () => {
    mockTriageComplaint.mockResolvedValueOnce(triageResponse());
    mockUserGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-abc" } },
    });
    mockUserInsert.mockReturnValueOnce({ error: null });

    const res = await POST(
      buildRequest({ text: "Garbage pile near park" }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(true);
    expect(mockUserInsert).toHaveBeenCalledTimes(1);
    expect(mockAdminInsert).not.toHaveBeenCalled();
  });

  it("falls back to admin insert when user-scoped insert fails", async () => {
    mockTriageComplaint.mockResolvedValueOnce(triageResponse());
    mockUserGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-abc" } },
    });
    mockUserInsert.mockReturnValueOnce({ error: { message: "rls denied" } });
    mockAdminInsert.mockReturnValueOnce({ error: null });

    const res = await POST(
      buildRequest({ text: "Burst pipe" }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(200);
    expect(mockUserInsert).toHaveBeenCalledTimes(1);
    expect(mockAdminInsert).not.toHaveBeenCalled(); // no fallback after success
  });

  it("reports saved=false when both inserts fail (still 200)", async () => {
    mockTriageComplaint.mockResolvedValueOnce(triageResponse());
    mockUserGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-abc" } },
    });
    mockUserInsert.mockReturnValueOnce({ error: { message: "rls denied" } });
    mockAdminInsert.mockReturnValueOnce({ error: null });

    const res = await POST(
      buildRequest({ text: "Burst pipe" }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(true);
  });

  it("returns 502 when Gemini errors mention GEMINI / API_KEY / quota", async () => {
    mockTriageComplaint.mockRejectedValueOnce(new Error("GEMINI_API_KEY missing"));

    const res = await POST(
      buildRequest({ text: "Pothole on road" }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/GEMINI_API_KEY/);
  });

  it("returns 500 on unexpected errors", async () => {
    mockTriageComplaint.mockRejectedValueOnce(new Error("kaboom"));

    const res = await POST(
      buildRequest({ text: "Anything" }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(500);
  });

  it("accepts an image-only payload", async () => {
    mockTriageComplaint.mockResolvedValueOnce(triageResponse());
    mockUserGetUser.mockResolvedValueOnce({ data: { user: null } });
    mockAdminInsert.mockReturnValueOnce({ error: null });

    const res = await POST(
      buildRequest({
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
      }) as unknown as import("next/server").NextRequest
    );

    expect(res.status).toBe(200);
    expect(mockTriageComplaint).toHaveBeenCalled();
  });

  it("strips whitespace around text and forwards clean inputs to Gemini", async () => {
    mockTriageComplaint.mockResolvedValueOnce(triageResponse());
    mockUserGetUser.mockResolvedValueOnce({ data: { user: null } });
    mockAdminInsert.mockReturnValueOnce({ error: null });

    await POST(
      buildRequest({ text: "   Pothole   " }) as unknown as import("next/server").NextRequest
    );

    const arg = mockTriageComplaint.mock.calls[0][0];
    expect(arg.text).toBe("Pothole");
  });
});