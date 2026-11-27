import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getProfile, getPublicProfile, listProfiles, saveProfile } from "./api";
import { getProfileAction, getPublicProfileAction, listProfilesAction } from "./server/queries";

vi.mock("./server/queries", () => ({
  listProfilesAction: vi.fn(),
  getProfileAction: vi.fn(),
  getPublicProfileAction: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());

const profile = {
  full_name: "Ravi", age: 72, blood_group: "B+",
  allergies: [], conditions: [], medicines: [], doctor_name: "",
  contacts: [{ name: "Anita", phone: "9800000001", relation: "Daughter" }],
  public: { allergies: false, conditions: false, medicines: false, doctor_name: false },
};
const fullProfile = { ...profile, id: "profile-id", public_token: "public-token" };

it("lists real profiles with their ages for the dashboard", async () => {
  vi.mocked(listProfilesAction).mockResolvedValue([fullProfile]);
  await expect(listProfiles()).resolves.toEqual([fullProfile]);
});

it("retrieves the requested owner profile for editing", async () => {
  vi.mocked(getProfileAction).mockImplementation(async (id) => id === fullProfile.id ? fullProfile : null);
  await expect(getProfile(fullProfile.id)).resolves.toEqual(fullProfile);
  await expect(getProfile("missing")).resolves.toBeNull();
});

it("adapts a shared profile to the emergency page and preserves missing tokens", async () => {
  vi.mocked(getPublicProfileAction).mockImplementation(async (token) =>
    token === fullProfile.public_token
      ? { full_name: "Ravi", age: 72, blood_group: "B+", contacts: profile.contacts, doctor_name: "Dr. Rao" }
      : null,
  );

  await expect(getPublicProfile(fullProfile.public_token)).resolves.toEqual({
    ...profile, doctor_name: "Dr. Rao", public: { ...profile.public, doctor_name: true },
  });
  await expect(getPublicProfile("missing")).resolves.toBeNull();
});

it.each([
  { mode: "create", id: undefined, path: "/api/profile", method: "POST", status: 201 },
  { mode: "edit", id: fullProfile.id, path: "/api/profile/profile-id", method: "PUT", status: 200 },
] as const)("saves a $mode profile as JSON via $method", async ({ mode, id, path, method, status }) => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({}, { status }));
  vi.stubGlobal("fetch", fetch);

  await expect(saveProfile(mode, id, profile)).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith(path, {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile),
  });
});

it("passes the server's validation error back to the form", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Enter a valid age." }, { status: 400 })));

  await expect(saveProfile("create", undefined, profile)).resolves.toEqual({
    ok: false,
    error: "Enter a valid age.",
  });
});

it("returns a generic message when the server is unreachable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

  await expect(saveProfile("edit", fullProfile.id, profile)).resolves.toEqual({
    ok: false,
    error: "Could not save. Please try again.",
  });
});
