import { jsonError } from "@/lib/http";
import { viewPublicProfile } from "@/lib/server/view-public-profile";

type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Context) {
  const { token } = await params;
  const result = await viewPublicProfile(token, request.headers);
  if (result.status === "rate-limited") return jsonError("Too many requests", 429);
  if (result.status === "not-found") return jsonError("Profile not found", 404);
  return Response.json(result.profile, { headers: { "Cache-Control": "private, no-store" } });
}
