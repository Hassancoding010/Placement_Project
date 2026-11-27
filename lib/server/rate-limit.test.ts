import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { checkPublicRateLimit, getClientIp } from "./rate-limit";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each([
  [{ "x-forwarded-for": "203.0.113.1 , 192.0.2.1", "x-real-ip": "192.0.2.2" }, "203.0.113.1"],
  [{ "x-forwarded-for": ", 192.0.2.1", "x-real-ip": "2001:db8::1" }, "2001:db8::1"],
  [{ "x-real-ip": "192.0.2.2" }, "192.0.2.2"],
  [{}, "unknown"],
] as const)("selects the client IP from %j", (headers, ip) => {
  expect(getClientIp(new Headers(headers))).toBe(ip);
});

it("checks one 20-per-minute bucket per IP using the server secret", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(false));
  vi.stubGlobal("fetch", fetch);

  await expect(checkPublicRateLimit("203.0.113.1")).resolves.toBe(false);

  const [url, request] = fetch.mock.calls[0];
  expect(new URL(String(url)).pathname).toBe("/rest/v1/rpc/hit_rate_limit");
  expect(new Headers(request?.headers).get("apikey")).toBe("test-secret-key");
  expect(JSON.parse(String(request?.body))).toEqual({
    p_key: "public:203.0.113.1", p_limit: 20, p_window_seconds: 60,
  });
});

it("allows requests with no secret key and warns once", async () => {
  vi.stubEnv("SUPABASE_SECRET_KEY", undefined);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  await expect(checkPublicRateLimit("unknown")).resolves.toBe(true);
  await expect(checkPublicRateLimit("unknown")).resolves.toBe(true);
  expect(warn).toHaveBeenCalledOnce();
  expect(fetch).not.toHaveBeenCalled();
});

it("allows requests when the rate-limit RPC returns an error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "RPC denied" }, { status: 403 })));

  await expect(checkPublicRateLimit("unknown")).resolves.toBe(true);
});
