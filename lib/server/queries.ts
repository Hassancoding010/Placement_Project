"use server";

import { headers } from "next/headers";
import { connection } from "next/server";
import { createClient } from "../supabase/server";
import { getProfile, listProfiles } from "./profiles";
import { viewPublicProfile } from "./view-public-profile";

async function ownerClient() {
  await connection();
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
  await connection();
  return viewPublicProfile(token, await headers());
}
