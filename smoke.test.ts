import { expect, test } from "vitest";
import { APP_NAME } from "@/lib/brand";

test("loads an application module through the @ alias", () => {
  expect(APP_NAME).toBe("Emergency Health Card");
});
