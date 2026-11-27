import { createClient } from "@supabase/supabase-js";
import { vi } from "vitest";

// Exercise PostgREST query building without making any network requests.
export function fakeSupabase(...replies: unknown[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const reply of replies) fetch.mockResolvedValueOnce(Response.json(reply));

  const supabase = createClient("https://supabase.example", "test-key", {
    global: { fetch },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const getClaims = vi.spyOn(supabase.auth, "getClaims");

  return { supabase, fetch, getClaims };
}

export function signedInSupabase(...replies: unknown[]) {
  const fake = fakeSupabase(...replies);
  fake.getClaims.mockResolvedValue({
    data: {
      claims: {
        sub: "owner-id", iss: "https://supabase.example/auth/v1", aud: "authenticated",
        role: "authenticated", aal: "aal1", session_id: "session-id", exp: 1, iat: 0,
      },
      header: { alg: "ES256", kid: "test-key", typ: "JWT" },
      signature: new Uint8Array(),
    },
    error: null,
  });
  return fake;
}
