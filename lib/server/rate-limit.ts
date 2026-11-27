import "server-only";
import { createAdminClient } from "../supabase/admin";

const PUBLIC_REQUEST_LIMIT = 20;
const WINDOW_SECONDS = 60;
let warnedMissingKey = false;

export function getClientIp(headers: Pick<Headers, "get">) {
  return headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim()
    || headers.get("x-real-ip")?.trim()
    || "unknown";
}

export async function checkPublicRateLimit(ip: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    if (!admin) {
      if (!warnedMissingKey) {
        console.warn("Public rate limiting is disabled because SUPABASE_SECRET_KEY is missing");
        warnedMissingKey = true;
      }
      return true;
    }

    const { data, error } = await admin.rpc("hit_rate_limit", {
      p_key: `public:${ip}`,
      p_limit: PUBLIC_REQUEST_LIMIT,
      p_window_seconds: WINDOW_SECONDS,
    });
    return Boolean(error) || data !== false;
  } catch {
    return true;
  }
}
