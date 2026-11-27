import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../mock";
import { toPublicView, type PublicView } from "../public-view";
import { generatePublicToken } from "../token";

export type FullProfile = Profile & { id: string; public_token: string };

const fullFields =
  "id,public_token,full_name,age,blood_group,allergies,conditions,medicines,doctor_name,public,contacts(name,phone,relation)";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProfileId(id: string) {
  return typeof id === "string" && uuid.test(id);
}

type ProfileSummary = {
  id: string;
  full_name: string;
  blood_group: string;
  created_at: string | null;
};

export function listProfiles(supabase: SupabaseClient): Promise<ProfileSummary[]>;
export function listProfiles(supabase: SupabaseClient, detail: "full"): Promise<FullProfile[]>;
export async function listProfiles(supabase: SupabaseClient, detail?: "full") {
  if (detail === "full") {
    const { data, error } = await selectFullProfiles(supabase)
      .order("created_at", { ascending: false })
      .overrideTypes<FullProfile[], { merge: false }>();
    if (error) throw error;
    return data.map(normalizeVisibility);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,blood_group,created_at")
    .order("created_at", { ascending: false })
    .overrideTypes<ProfileSummary[], { merge: false }>();
  if (error) throw error;
  return data;
}

function selectFullProfiles(supabase: SupabaseClient) {
  return supabase
    .from("profiles")
    .select(fullFields)
    .order("position", { referencedTable: "contacts" });
}

function normalizeVisibility(profile: FullProfile): FullProfile {
  return {
    ...profile,
    public: {
      allergies: profile.public?.allergies === true,
      conditions: profile.public?.conditions === true,
      medicines: profile.public?.medicines === true,
      doctor_name: profile.public?.doctor_name === true,
    },
  };
}

export async function getProfile(supabase: SupabaseClient, id: string): Promise<FullProfile | null> {
  if (!isProfileId(id)) return null;

  const { data, error } = await selectFullProfiles(supabase)
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<FullProfile, { merge: false }>();
  if (error) throw error;
  return data ? normalizeVisibility(data) : null;
}

export async function createProfile(supabase: SupabaseClient, input: Profile) {
  const { data, error } = await supabase.rpc("create_profile", {
    payload: input,
    p_public_token: generatePublicToken(),
  });
  if (error) throw error;
  const { id, public_token } = data ?? {};
  if (typeof id !== "string" || typeof public_token !== "string") {
    throw new Error("Unexpected create_profile response");
  }
  return { id, public_token };
}

export async function updateProfile(
  supabase: SupabaseClient,
  id: string,
  input: Profile,
): Promise<FullProfile | null> {
  if (!isProfileId(id)) return null;

  const { data, error } = await supabase.rpc("update_profile", { p_id: id, payload: input });
  if (error) throw error;
  return data === true ? getProfile(supabase, id) : null;
}

export async function getPublicProfile(supabase: SupabaseClient, token: string): Promise<PublicView | null> {
  if (typeof token !== "string" || token.includes("\0")) return null;

  const { data, error } = await supabase.rpc("get_public_profile", { p_token: token });
  if (error) throw error;
  return data ? toPublicView(data as PublicView) : null;
}
