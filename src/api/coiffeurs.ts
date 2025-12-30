// src/api/coiffeurs.ts
import { supabase } from "@/lib/supabase";
import type { Coiffeur, CoiffeurWithDetails, Service } from "@/types/database";

// ============ COIFFEURS ============

// Récupérer tous les coiffeurs actifs
export async function getCoiffeurs(): Promise<CoiffeurWithDetails[]> {
  const { data, error } = await supabase
    .from("coiffeurs")
    .select(`
      *,
      profile:profiles(*),
      salon:salons(*),
      services(*)
    `)
    .eq("is_active", true)
    .eq("is_available", true)
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching coiffeurs:", error);
    return [];
  }

  return data || [];
}

// Récupérer un coiffeur par ID avec ses détails
export async function getCoiffeurById(id: string): Promise<CoiffeurWithDetails | null> {
  const { data, error } = await supabase
    .from("coiffeurs")
    .select(`
      *,
      profile:profiles(*),
      salon:salons(*),
      services(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching coiffeur:", error);
    return null;
  }

  return data;
}

// Récupérer les coiffeurs par ville
export async function getCoiffeursByCity(city: string): Promise<CoiffeurWithDetails[]> {
  const { data, error } = await supabase
    .from("coiffeurs")
    .select(`
      *,
      profile:profiles(*),
      salon:salons(*),
      services(*)
    `)
    .eq("is_active", true)
    .ilike("city", `%${city}%`)
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching coiffeurs by city:", error);
    return [];
  }

  return data || [];
}

// Récupérer les coiffeurs qui offrent le service à domicile
export async function getCoiffeursWithHomeService(): Promise<CoiffeurWithDetails[]> {
  const { data, error } = await supabase
    .from("coiffeurs")
    .select(`
      *,
      profile:profiles(*),
      salon:salons(*),
      services(*)
    `)
    .eq("is_active", true)
    .eq("offers_home_service", true)
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching home service coiffeurs:", error);
    return [];
  }

  return data || [];
}

// ============ SERVICES ============

// Récupérer les services d'un coiffeur
export async function getServicesByCoiffeur(coiffeurId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("coiffeur_id", coiffeurId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return data || [];
}

// Récupérer un service par ID
export async function getServiceById(id: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching service:", error);
    return null;
  }

  return data;
}

// Récupérer les services disponibles selon le lieu (salon ou domicile)
export async function getServicesByLocation(
  coiffeurId: string,
  location: "salon" | "domicile"
): Promise<Service[]> {
  const column = location === "salon" ? "available_at_salon" : "available_at_home";

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("coiffeur_id", coiffeurId)
    .eq("is_active", true)
    .eq(column, true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching services by location:", error);
    return [];
  }

  return data || [];
}

// ============ PROFIL COIFFEUR CONNECTÉ ============

// Vérifier si l'utilisateur connecté est un coiffeur et récupérer son profil complet
export async function getMyCoiffeurProfile(): Promise<CoiffeurWithDetails | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user");
    return null;
  }

  const { data, error } = await supabase
    .from("coiffeurs")
    .select(`
      *,
      profile:profiles(*),
      salon:salons(*),
      services(*)
    `)
    .eq("profile_id", user.id)
    .single();

  if (error) {
    // Pas d'erreur si simplement pas trouvé (PGRST116 = not found)
    if (error.code !== "PGRST116") {
      console.error("Error fetching my coiffeur profile:", error);
    }
    return null;
  }

  return data;
}

// Vérifier rapidement si l'utilisateur est coiffeur (sans charger tous les détails)
export async function isCurrentUserCoiffeur(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { count, error } = await supabase
    .from("coiffeurs")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("is_active", true);

  if (error) {
    console.error("Error checking if user is coiffeur:", error);
    return false;
  }

  return (count || 0) > 0;
}

// Mettre à jour le statut en ligne du coiffeur
export async function updateCoiffeurOnlineStatus(isAvailable: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { error } = await supabase
    .from("coiffeurs")
    .update({ 
      is_available: isAvailable, 
      updated_at: new Date().toISOString() 
    })
    .eq("profile_id", user.id);

  if (error) {
    console.error("Error updating online status:", error);
    return false;
  }

  return true;
}

// Mettre à jour le profil coiffeur
export async function updateCoiffeurProfile(updates: Partial<Coiffeur>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { error } = await supabase
    .from("coiffeurs")
    .update({ 
      ...updates,
      updated_at: new Date().toISOString() 
    })
    .eq("profile_id", user.id);

  if (error) {
    console.error("Error updating coiffeur profile:", error);
    return false;
  }

  return true;
}