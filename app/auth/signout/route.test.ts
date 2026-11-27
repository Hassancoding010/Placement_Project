import { expect, it, vi } from "vitest";
import { fakeSupabase } from "@/lib/server/profiles.test-support";
import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

it("ends the session and sends the browser to login with a GET", async () => {
  const { supabase } = fakeSupabase();
  const signOut = vi.spyOn(supabase.auth, "signOut").mockResolvedValue({ error: null });
  vi.mocked(createClient).mockResolvedValue(supabase);

  const response = await POST(new Request("https://card.example/auth/signout", { method: "POST" }));

  expect(signOut).toHaveBeenCalled();
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://card.example/login");
});
