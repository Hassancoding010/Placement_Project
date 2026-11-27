import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonError } from "../http";
import { createClient } from "../supabase/server";
import { validateProfileInput } from "../validation";
import { getProfile, type FullProfile } from "./profiles";

export async function withProfileSession(handle: (supabase: SupabaseClient) => Promise<Response>) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return jsonError("Not logged in", 401);

  const response = await handle(supabase);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function withOwnedProfile(
  params: Promise<{ id: string }>,
  handle: (profile: FullProfile) => Response | Promise<Response>,
) {
  return withProfileSession(async (supabase) => {
    const { id } = await params;
    const profile = await getProfile(supabase, id);
    return profile ? handle(profile) : jsonError("Profile not found", 404);
  });
}

export async function readProfileInput(request: Request): Promise<ReturnType<typeof validateProfileInput>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
  return validateProfileInput(body);
}
