import { drawCardPdf } from "@/lib/server/card-pdf";
import { withOwnedProfile } from "@/lib/server/profile-http";
import { makeEmergencyQr } from "@/lib/server/qr";

type Context = { params: Promise<{ id: string }> };

function cardFilename(fullName: string) {
  const slug = fullName.normalize("NFKD").replace(/\p{Mark}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").slice(0, 80).replace(/^-+|-+$/g, "");
  return `health-card-${slug || "profile"}.pdf`;
}

export function GET(request: Request, { params }: Context) {
  return withOwnedProfile(params, async (profile) => {
    const qr = await makeEmergencyQr(profile.public_token, request.url);
    const pdf = await drawCardPdf(profile, qr);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cardFilename(profile.full_name)}"`,
      },
    });
  });
}
