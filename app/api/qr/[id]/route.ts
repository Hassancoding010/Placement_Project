import { withOwnedProfile } from "@/lib/server/profile-http";
import { makeEmergencyQr } from "@/lib/server/qr";

type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, { params }: Context) {
  return withOwnedProfile(params, async (profile) => {
    const png = await makeEmergencyQr(profile.public_token, request.url);
    return new Response(png, { headers: { "Content-Type": "image/png" } });
  });
}
