import { jsonError } from "@/lib/http";
import { readProfileInput, withProfileSession } from "@/lib/server/profile-http";
import { createProfile, listProfiles } from "@/lib/server/profiles";

export async function GET() {
  return withProfileSession(async (supabase) => Response.json(await listProfiles(supabase)));
}

export async function POST(request: Request) {
  return withProfileSession(async (supabase) => {
    const input = await readProfileInput(request);
    if (!input.ok) return jsonError(input.error, 400);

    return Response.json(await createProfile(supabase, input.value), { status: 201 });
  });
}
