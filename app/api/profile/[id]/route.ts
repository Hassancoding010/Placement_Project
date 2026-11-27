import { jsonError } from "@/lib/http";
import { readProfileInput, withProfileSession } from "@/lib/server/profile-http";
import { getProfile, isProfileId, updateProfile } from "@/lib/server/profiles";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  return withProfileSession(async (supabase) => {
    const { id } = await params;
    const profile = await getProfile(supabase, id);
    return profile ? Response.json(profile) : jsonError("Profile not found", 404);
  });
}

export async function PUT(request: Request, { params }: Context) {
  return withProfileSession(async (supabase) => {
    const { id } = await params;
    if (!isProfileId(id)) return jsonError("Profile not found", 404);

    const input = await readProfileInput(request);
    if (!input.ok) return jsonError(input.error, 400);

    const profile = await updateProfile(supabase, id, input.value);
    return profile ? Response.json(profile) : jsonError("Profile not found", 404);
  });
}
