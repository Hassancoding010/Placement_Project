import "server-only";
import { after } from "next/server";
import type { PublicView } from "../public-view";
import { createClient } from "../supabase/server";
import { sendScanAlert } from "../telegram";
import { getPublicProfile } from "./profiles";
import { checkPublicRateLimit, getClientIp } from "./rate-limit";

type PublicProfileResult =
  | { status: "rate-limited" }
  | { status: "not-found" }
  | { status: "found"; profile: PublicView };

export async function viewPublicProfile(
  token: string,
  headers: Pick<Headers, "get">,
): Promise<PublicProfileResult> {
  if (!(await checkPublicRateLimit(getClientIp(headers)))) return { status: "rate-limited" };

  // The lookup RPC also records the scan.
  const profile = await getPublicProfile(await createClient(), token);
  if (!profile) return { status: "not-found" };

  const scannedAt = new Date();
  after(() => sendScanAlert(profile.full_name, scannedAt));
  return { status: "found", profile };
}
