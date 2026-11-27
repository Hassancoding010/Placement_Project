import { beforeEach, expect, it, vi } from "vitest";
import { fakeSupabase, signedInSupabase } from "@/lib/server/profiles.test-support";
import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

it("requires authentication before listing profiles", async () => {
  const { supabase, fetch, getClaims } = fakeSupabase();
  getClaims.mockResolvedValue({ data: null, error: null });
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await GET();

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Not logged in" });
  expect(fetch).not.toHaveBeenCalled();
});

it("creates a profile and returns only its id and token", async () => {
  const created = { id: "created-id", public_token: "created-token" };
  vi.mocked(createClient).mockResolvedValue(signedInSupabase(created).supabase);
  const request = new Request("https://card.example/api/profile", {
    method: "POST",
    body: JSON.stringify({
      full_name: "Ravi", age: 72, blood_group: "B+",
      contacts: [{ name: "Anita", phone: "9800000001", relation: "Daughter" }],
    }),
  });

  const response = await POST(request);

  expect(response.status).toBe(201);
  expect(await response.json()).toEqual(created);
});

it("serves the four-field profile list response", async () => {
  const summary = { id: "profile-id", full_name: "Ravi", blood_group: "B+", created_at: "2026-11-27T09:30:00Z" };
  vi.mocked(createClient).mockResolvedValue(signedInSupabase([summary]).supabase);

  const response = await GET();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([summary]);
});

it.each([
  { body: "{", error: "Invalid JSON body" },
  { body: "{}", error: "Full name must be 1 to 200 characters." },
])("rejects an invalid create request before calling Supabase", async ({ body, error }) => {
  const { supabase, fetch } = signedInSupabase();
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await POST(new Request("https://card.example/api/profile", { method: "POST", body }));

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error });
  expect(fetch).not.toHaveBeenCalled();
});
