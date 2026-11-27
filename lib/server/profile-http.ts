import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonError } from "../http";
import { createClient } from "../supabase/server";
import { validateProfileInput } from "../validation";

export async function withProfileSession(handle: (supabase: SupabaseClient) => Promise<Response>) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return jsonError("Not logged in", 401);

  const response = await handle(supabase);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
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
