import { expect, it, vi } from "vitest";
import { connection } from "next/server";
import { createClient } from "../supabase/server";
import { listProfilesAction } from "./queries";
import { signedInSupabase } from "./profiles.test-support";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("../supabase/server", () => ({ createClient: vi.fn() }));

it("waits for an incoming request before opening the dashboard session", async () => {
  let resume!: () => void;
  vi.mocked(connection).mockReturnValue(new Promise<void>((resolve) => { resume = resolve; }));
  vi.mocked(createClient).mockResolvedValue(signedInSupabase([]).supabase);

  const profiles = listProfilesAction();
  expect(connection).toHaveBeenCalled();
  expect(createClient).not.toHaveBeenCalled();
  resume();
  await expect(profiles).resolves.toEqual([]);
});
