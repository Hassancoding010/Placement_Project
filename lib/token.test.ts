import { expect, it } from "vitest";
import { generatePublicToken } from "./token";

it("generates distinct URL-safe tokens containing 24 bytes", () => {
  const first = generatePublicToken();
  expect(first).toMatch(/^[A-Za-z0-9_-]{32}$/);
  expect(Buffer.from(first, "base64url")).toHaveLength(24);
  expect(generatePublicToken()).not.toBe(first);
});
