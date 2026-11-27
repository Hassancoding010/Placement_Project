import { beforeEach, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/lib/server/profiles.test-support";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

const token = "public-token";
const context = { params: Promise.resolve({ token }) };
const request = new Request(`https://card.example/api/public/${token}`);

it("serves an anonymous lookup without exposing private fields or identifiers", async () => {
  const view = {
    full_name: "Ravi", age: 72, blood_group: "B+",
    contacts: [{ name: "Anita", phone: "9800000001", relation: "Daughter" }],
    medicines: ["Metformin"],
  };
  const { supabase, getClaims } = fakeSupabase({ ...view, id: "private", owner_id: "private", email: "private@example.com" });
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await GET(request, context);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(view);
  expect(getClaims).not.toHaveBeenCalled();
});

it("returns the documented 404 for an unknown token", async () => {
  vi.mocked(createClient).mockResolvedValue(fakeSupabase(null).supabase);

  const response = await GET(request, context);

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Profile not found" });
});
