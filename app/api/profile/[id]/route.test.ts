import { beforeEach, expect, it, vi } from "vitest";
import { signedInSupabase } from "@/lib/server/profiles.test-support";
import { createClient } from "@/lib/supabase/server";
import { GET, PUT } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

const id = "8f004c4c-2d7c-4c97-95e0-1a4c8ff31acd";
const input = {
  full_name: "Ravi", age: 72, blood_group: "B+",
  allergies: [], conditions: [], medicines: [], doctor_name: "",
  public: { allergies: false, conditions: false, medicines: false, doctor_name: false },
  contacts: [{ name: "Anita", phone: "9800000001", relation: "Daughter" }],
};
const profile = { ...input, id, public_token: "token" };

function params(profileId = id) {
  return { params: Promise.resolve({ id: profileId }) };
}

const url = "https://card.example/api/profile/";

it("serves the full profile for the edit form", async () => {
  vi.mocked(createClient).mockResolvedValue(signedInSupabase([profile]).supabase);

  const response = await GET(new Request(url + id), params());

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(profile);
});

it("updates a profile and returns the full saved record", async () => {
  vi.mocked(createClient).mockResolvedValue(signedInSupabase(true, [profile]).supabase);

  const response = await PUT(new Request(url + id, { method: "PUT", body: JSON.stringify(input) }), params());

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(profile);
});

it("returns 404 for a malformed profile id", async () => {
  const { supabase, fetch } = signedInSupabase();
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await GET(new Request(url + "invalid"), params("invalid"));

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Profile not found" });
  expect(fetch).not.toHaveBeenCalled();
});

it("returns 404 when there is no owned profile to update", async () => {
  vi.mocked(createClient).mockResolvedValue(signedInSupabase(false).supabase);

  const response = await PUT(new Request(url + id, { method: "PUT", body: JSON.stringify(input) }), params());

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Profile not found" });
});

it("rejects malformed update JSON", async () => {
  vi.mocked(createClient).mockResolvedValue(signedInSupabase().supabase);

  const response = await PUT(new Request(url + id, { method: "PUT", body: "{" }), params());

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Invalid JSON body" });
});
