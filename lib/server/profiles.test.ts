import { expect, it, vi } from "vitest";
import { createProfile, getProfile, getPublicProfile, listProfiles, updateProfile } from "./profiles";
import { fakeSupabase } from "./profiles.test-support";

vi.mock("server-only", () => ({}));

it("lists the documented summary fields for each visible profile", async () => {
  const summary = { id: "id", full_name: "Ravi", blood_group: "B+", created_at: "2026-11-27T09:30:00Z" };
  const { supabase, fetch } = fakeSupabase([summary]);

  await expect(listProfiles(supabase)).resolves.toEqual([summary]);
  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.pathname).toBe("/rest/v1/profiles");
  expect(url.searchParams.get("select")).toBe("id,full_name,blood_group,created_at");
});

const id = "8f004c4c-2d7c-4c97-95e0-1a4c8ff31acd";
const input = {
  full_name: "Ravi", age: 72, blood_group: "B+",
  allergies: [], conditions: [], medicines: [], doctor_name: "",
  public: { allergies: false, conditions: false, medicines: false, doctor_name: false },
  contacts: [
    { name: "Anita", phone: "9800000001", relation: "Daughter" },
    { name: "Meena", phone: "9800000002", relation: "Friend" },
  ],
};
const profile = { ...input, id, public_token: "token" };

it("looks up a profile with contacts ordered by position", async () => {
  const { supabase, fetch } = fakeSupabase([profile]);

  await expect(getProfile(supabase, id)).resolves.toEqual(profile);
  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.searchParams.get("id")).toBe(`eq.${id}`);
  expect(url.searchParams.get("contacts.order")).toBe("position.asc");
  expect(url.searchParams.get("select")).toContain("contacts(name,phone,relation)");
});

it("includes the full profile and contact details when requested by the dashboard", async () => {
  const { supabase, fetch } = fakeSupabase([profile]);
  await expect(listProfiles(supabase, "full")).resolves.toEqual([profile]);
  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.searchParams.get("select")).toContain("age");
  expect(url.searchParams.get("contacts.order")).toBe("position.asc");
});

it("creates a profile and contacts together with a generated public token", async () => {
  const { supabase, fetch } = fakeSupabase({ id, public_token: "token" });

  await expect(createProfile(supabase, input)).resolves.toEqual({ id, public_token: "token" });
  const [url, request] = fetch.mock.calls[0];
  expect(new URL(String(url)).pathname).toBe("/rest/v1/rpc/create_profile");
  expect(JSON.parse(String(request?.body))).toEqual({
    payload: input,
    p_public_token: expect.stringMatching(/^[A-Za-z0-9_-]{32}$/),
  });
});

it("returns the updated profile after replacing its data and contacts", async () => {
  const { supabase, fetch } = fakeSupabase(true, [profile]);

  await expect(updateProfile(supabase, id, input)).resolves.toEqual(profile);
  const [url, request] = fetch.mock.calls[0];
  expect(new URL(String(url)).pathname).toBe("/rest/v1/rpc/update_profile");
  expect(JSON.parse(String(request?.body))).toEqual({ p_id: id, payload: input });
});

it("looks up a public token through the scan-logging RPC and exposes only shared fields", async () => {
  const view = { full_name: "Ravi", age: 72, blood_group: "B+", contacts: input.contacts };
  const { supabase, fetch } = fakeSupabase({ ...view, id, owner_id: "private" });

  await expect(getPublicProfile(supabase, "scan-token")).resolves.toEqual(view);
  const [url, request] = fetch.mock.calls[0];
  expect(new URL(String(url)).pathname).toBe("/rest/v1/rpc/get_public_profile");
  expect(JSON.parse(String(request?.body))).toEqual({ p_token: "scan-token" });
});

it("returns no profile for a malformed id without querying Supabase", async () => {
  const { supabase, fetch } = fakeSupabase();
  await expect(getProfile(supabase, "invalid")).resolves.toBeNull();
  await expect(updateProfile(supabase, "invalid", input)).resolves.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

it("returns no profile when the update RPC finds no owned row", async () => {
  const { supabase, fetch } = fakeSupabase(false);
  await expect(updateProfile(supabase, id, input)).resolves.toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});
