import { jsonError } from "@/lib/http";
import { getPublicProfile } from "@/lib/server/profiles";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  const supabase = await createClient();

  // Task 9: Apply the rate limit here, before the lookup records a scan.
  const profile = await getPublicProfile(supabase, token);
  if (!profile) return jsonError("Profile not found", 404);

  // Task 7: Schedule the Telegram alert here after a successful lookup.
  return Response.json(profile, { headers: { "Cache-Control": "private, no-store" } });
}
