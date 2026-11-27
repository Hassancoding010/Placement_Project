"use server";

import { createClient } from "../supabase/server";
import { getProfile, getPublicProfile, listProfiles } from "./profiles";

async function ownerClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return !error && data?.claims.sub ? supabase : null;
}

export async function listProfilesAction() {
  const supabase = await ownerClient();
  return supabase ? listProfiles(supabase, "full") : [];
}

export async function getProfileAction(id: string) {
  const supabase = await ownerClient();
  return supabase ? getProfile(supabase, id) : null;
}

export async function getPublicProfileAction(token: string) {
  const supabase = await createClient();
  return getPublicProfile(supabase, token);
}
