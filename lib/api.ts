import { mockProfiles, type Profile } from "./mock";
import { publicToProfile } from "./public-view";
import { getProfileAction, getPublicProfileAction, listProfilesAction } from "./server/queries";

export type FullProfile = Profile & { id: string; public_token: string };

const USE_MOCK = false;

function withIds(p: Profile, i: number): FullProfile {
  // In mock mode the id and the public token are both the array index.
  return { ...p, id: String(i), public_token: String(i) };
}

export async function listProfiles(): Promise<FullProfile[]> {
  if (USE_MOCK) return mockProfiles.map(withIds);
  return listProfilesAction();
}

export async function getProfile(id: string): Promise<FullProfile | null> {
  if (USE_MOCK) {
    const p = mockProfiles[Number(id)];
    return p ? withIds(p, Number(id)) : null;
  }
  return getProfileAction(id);
}

export class RateLimitedError extends Error {
  constructor() {
    super("Too many requests");
    this.name = "RateLimitedError";
  }
}

export async function getPublicProfile(token: string): Promise<Profile | null> {
  if (USE_MOCK) return mockProfiles[Number(token)] ?? null;
  const result = await getPublicProfileAction(token);
  if (result.status === "rate-limited") throw new RateLimitedError();
  return result.status === "found" ? publicToProfile(result.profile) : null;
}

// POST /api/profile (create) or PUT /api/profile/[id] (edit)
export async function saveProfile(
  mode: "create" | "edit",
  id: string | undefined,
  payload: Profile
): Promise<{ ok: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(
      mode === "create" ? "Would POST /api/profile:" : `Would PUT /api/profile/${id}:`,
      payload
    );
    return { ok: true };
  }
  const failure = { ok: false, error: "Could not save. Please try again." };
  if (mode === "edit" && !id) return failure;

  try {
    const path = mode === "create" ? "/api/profile" : `/api/profile/${encodeURIComponent(id ?? "")}`;
    const response = await fetch(path, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) return { ok: true };

    const body = await response.json();
    return typeof body?.error === "string" ? { ok: false, error: body.error } : failure;
  } catch {
    return failure;
  }
}
