import { PDFDocument } from "pdf-lib";
import { beforeEach, expect, it, vi } from "vitest";
import { fakeSupabase, signedInSupabase } from "@/lib/server/profiles.test-support";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

const id = "8f004c4c-2d7c-4c97-95e0-1a4c8ff31acd";
const context = { params: Promise.resolve({ id }) };
const request = new Request(`https://card.example/api/card/${id}`);

it("returns 401 without looking up a profile for an unauthenticated caller", async () => {
  const { supabase, fetch, getClaims } = fakeSupabase();
  getClaims.mockResolvedValue({ data: null, error: null });
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await GET(request, context);
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Not logged in" });
  expect(fetch).not.toHaveBeenCalled();
});

it("returns 404 if the profile is missing or invisible to the owner session", async () => {
  vi.mocked(createClient).mockResolvedValue(signedInSupabase([]).supabase);

  const response = await GET(request, context);
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Profile not found" });
});

it("downloads an owned card as a private PDF with a safe filename", async () => {
  const { supabase } = signedInSupabase([{
    id, public_token: "public-token", full_name: "  Ravi / Kumar  ", age: 72,
    blood_group: "B+", allergies: ["Penicillin"],
  }]);
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await GET(request, context);
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("application/pdf");
  expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="health-card-ravi-kumar.pdf"');
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const pdf = await PDFDocument.load(await response.arrayBuffer());
  expect(pdf.getPageCount()).toBe(1);
});
