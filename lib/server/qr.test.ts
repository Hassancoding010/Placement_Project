import { expect, it, vi } from "vitest";
import { buildEmergencyUrl } from "./qr";

vi.mock("server-only", () => ({}));

it.each([
  ["https://cards.example///", "https://cards.example/e/public-token"],
  [undefined, "https://preview.example/e/public-token"],
  ["   ", "https://preview.example/e/public-token"],
])("builds a scan URL using the configured site or request origin (%s)", (siteUrl, expected) => {
  expect(buildEmergencyUrl("public-token", "https://preview.example", siteUrl)).toBe(expected);
});
