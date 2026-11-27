import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { after } from "next/server";
import { createClient } from "../supabase/server";
import { fakeSupabase } from "./profiles.test-support";
import { viewPublicProfile } from "./view-public-profile";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("../supabase/server", () => ({ createClient: vi.fn() }));

const headers = new Headers({ "x-forwarded-for": "203.0.113.1" });
const profile = { full_name: "Ravi Kumar", age: 72, blood_group: "B+", contacts: [] };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret-key");
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
  vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("rejects a blocked scan before lookup or alert scheduling", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(false)));

  await expect(viewPublicProfile("token", headers)).resolves.toEqual({ status: "rate-limited" });

  expect(createClient).not.toHaveBeenCalled();
  expect(after).not.toHaveBeenCalled();
});

it("finishes the rate check before looking up and schedules the alert after a successful scan", async () => {
  let finishRateCheck!: (response: Response) => void;
  const fetch = vi.fn<typeof globalThis.fetch>()
    .mockReturnValueOnce(new Promise<Response>((resolve) => { finishRateCheck = resolve; }))
    .mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);
  const lookup = fakeSupabase(profile);
  vi.mocked(createClient).mockResolvedValue(lookup.supabase);

  const scan = viewPublicProfile("token", headers);
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  expect(lookup.fetch).not.toHaveBeenCalled();
  finishRateCheck(Response.json(true));

  await expect(scan).resolves.toEqual({ status: "found", profile });
  expect(after).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledOnce();
  const [alert] = vi.mocked(after).mock.calls[0];
  if (typeof alert !== "function") throw new Error("Expected a deferred alert");
  await alert();
  expect(fetch.mock.calls[1][0]).toBe("https://api.telegram.org/bottest-token/sendMessage");
  expect(JSON.parse(String(fetch.mock.calls[1][1]?.body)).text).toMatch(/^Profile Ravi Kumar was scanned at /);
});

it("does not schedule an alert when the token is missing", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(true)));
  vi.mocked(createClient).mockResolvedValue(fakeSupabase(null).supabase);

  await expect(viewPublicProfile("missing", headers)).resolves.toEqual({ status: "not-found" });
  expect(after).not.toHaveBeenCalled();
});
