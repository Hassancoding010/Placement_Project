import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { formatScanMessage, sendScanAlert } from "./telegram";

vi.mock("server-only", () => ({}));

const scannedAt = new Date("2026-11-28T13:12:00Z");
const message = "Profile Ravi Kumar was scanned at 6:42 PM";

beforeEach(() => {
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
  vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("formats the scan time in Kolkata with an AM/PM clock", () => {
  expect(formatScanMessage("Ravi Kumar", scannedAt)).toBe(message);
});

it("posts the alert to the configured Telegram chat", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);

  await sendScanAlert("Ravi Kumar", scannedAt);

  expect(fetch).toHaveBeenCalledWith("https://api.telegram.org/bottest-token/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: "test-chat", text: message }),
    signal: expect.any(AbortSignal),
  });
});

it.each(["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"])("silently skips sending without %s", async (key) => {
  vi.stubEnv(key, undefined);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  await sendScanAlert("Ravi Kumar");

  expect(fetch).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});

it.each(["network error", "HTTP error"])("warns without leaking the token on %s", async (failure) => {
  const fetch = vi.fn();
  if (failure === "network error") fetch.mockRejectedValue(new Error("request for bottest-token failed"));
  else fetch.mockResolvedValue(Response.json({ error: "bottest-token" }, { status: 400 }));
  vi.stubGlobal("fetch", fetch);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  await expect(sendScanAlert("Ravi Kumar")).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalledOnce();
  expect(JSON.stringify(warn.mock.calls)).not.toContain("test-token");
});
