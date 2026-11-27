import "server-only";
import QRCode from "qrcode";

export function buildEmergencyUrl(token: string, requestOrigin: string, siteUrl?: string) {
  const base = (siteUrl?.trim() || requestOrigin).replace(/\/+$/, "");
  return `${base}/e/${encodeURIComponent(token)}`;
}

export async function makeEmergencyQr(token: string, requestUrl: string) {
  const url = buildEmergencyUrl(token, new URL(requestUrl).origin, process.env.NEXT_PUBLIC_SITE_URL);
  return new Uint8Array(await QRCode.toBuffer(url, { type: "png", scale: 8 }));
}
