// src/api/profiles.ts
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Récupérer un profil par ID
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Mettre à jour le profil
 */
export async function updateProfile(
  profileId: string, 
  updates: Partial<Profile>
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }

  return true;
}

/**
 * Mettre à jour mon profil (utilisateur connecté)
 */
export async function updateMyProfile(updates: Partial<Profile>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  return updateProfile(user.id, updates);
}