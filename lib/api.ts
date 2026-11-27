import { mockProfiles, type Profile } from "./mock";

export type FullProfile = Profile & { id: string; public_token: string };

// Set to false once the backend APIs are ready.
const USE_MOCK = true;

function withIds(p: Profile, i: number): FullProfile {
  // In mock mode the id and the public token are both the array index.
  return { ...p, id: String(i), public_token: String(i) };
}

// GET /api/profile
export async function listProfiles(): Promise<FullProfile[]> {
  if (USE_MOCK) return mockProfiles.map(withIds);
  // TODO (real): fetch("/api/profile") and return the list.
  throw new Error("Real API not connected yet");
}

// GET /api/profile/[id]
export async function getProfile(id: string): Promise<FullProfile | null> {
  if (USE_MOCK) {
    const p = mockProfiles[Number(id)];
    return p ? withIds(p, Number(id)) : null;
  }
  // TODO (real): fetch(`/api/profile/${id}`), return null on 404.
  throw new Error("Real API not connected yet");
}

// GET /api/public/[token]  (only public fields in the real version)
export async function getPublicProfile(token: string): Promise<Profile | null> {
  if (USE_MOCK) return mockProfiles[Number(token)] ?? null;
  // TODO (real): fetch(`/api/public/${token}`), return null on 404.
  throw new Error("Real API not connected yet");
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
  // TODO (real): send the request and return { ok: false, error } on failure.
  throw new Error("Real API not connected yet");
}