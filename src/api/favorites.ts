// src/api/favorites.ts
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export interface Favorite {
  id: string;
  user_id: string;
  favorite_type: "coiffeur" | "inspiration" | "salon";
  coiffeur_id: string | null;
  inspiration_id: string | null;
  created_at: string;
}

export interface FavoriteCoiffeur extends Favorite {
  coiffeur: {
    id: string;
    specialty: string | null;
    bio: string | null;
    rating: number | null;
    reviews_count: number | null;
    profile: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export interface FavoriteInspiration extends Favorite {
  inspiration: {
    id: string;
    image_url: string;
    title: string | null;
    description: string | null;
    tags: string[];
    created_at: string;
  };
}

// ============================================
// HELPERS
// ============================================

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================
// COIFFEURS FAVORIS
// ============================================

/**
 * Récupérer tous les coiffeurs favoris de l'utilisateur
 */
export async function getFavoriteCoiffeurs(): Promise<FavoriteCoiffeur[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select(`
      *,
      coiffeur:coiffeurs(
        id,
        specialty,
        bio,
        rating,
        reviews_count,
        profile:profiles(
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("user_id", userId)
    .eq("favorite_type", "coiffeur")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching favorite coiffeurs:", error);
    return [];
  }

  return (data || []).filter(f => f.coiffeur !== null) as FavoriteCoiffeur[];
}

/**
 * Vérifier si un coiffeur est en favori
 */
export async function isCoiffeurFavorite(coiffeurId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("favorite_type", "coiffeur")
    .eq("coiffeur_id", coiffeurId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking favorite:", error);
  }

  return !!data;
}

/**
 * Ajouter un coiffeur aux favoris
 */
export async function addCoiffeurToFavorites(coiffeurId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("favorites")
    .insert({
      user_id: userId,
      favorite_type: "coiffeur",
      coiffeur_id: coiffeurId,
    });

  if (error) {
    console.error("Error adding favorite:", error);
    return false;
  }

  return true;
}

/**
 * Retirer un coiffeur des favoris
 */
export async function removeCoiffeurFromFavorites(coiffeurId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("favorite_type", "coiffeur")
    .eq("coiffeur_id", coiffeurId);

  if (error) {
    console.error("Error removing favorite:", error);
    return false;
  }

  return true;
}

/**
 * Toggle favori coiffeur (ajoute si pas présent, retire sinon)
 */
export async function toggleCoiffeurFavorite(coiffeurId: string): Promise<boolean> {
  const isFav = await isCoiffeurFavorite(coiffeurId);
  
  if (isFav) {
    return await removeCoiffeurFromFavorites(coiffeurId);
  } else {
    return await addCoiffeurToFavorites(coiffeurId);
  }
}

// ============================================
// INSPIRATIONS FAVORITES
// ============================================

/**
 * Récupérer toutes les inspirations favorites de l'utilisateur
 */
export async function getFavoriteInspirations(): Promise<FavoriteInspiration[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // 1. Récupérer les favoris de type inspiration
  const { data: favorites, error: favError } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .eq("favorite_type", "inspiration")
    .order("created_at", { ascending: false });

  if (favError) {
    console.error("Error fetching favorite inspirations:", favError);
    return [];
  }

  if (!favorites || favorites.length === 0) return [];

  // 2. Récupérer les IDs des inspirations
  const inspirationIds = favorites
    .map(f => f.inspiration_id)
    .filter((id): id is string => id !== null);

  if (inspirationIds.length === 0) return [];

  // 3. Récupérer les inspirations correspondantes
  const { data: inspirations, error: inspError } = await supabase
    .from("inspirations")
    .select("id, image_url, title, description, tags, created_at")
    .in("id", inspirationIds);

  if (inspError) {
    console.error("Error fetching inspirations:", inspError);
    return [];
  }

  // 4. Combiner les données
  const inspirationsMap = new Map(inspirations?.map(i => [i.id, i]) || []);
  
  return favorites
    .filter(f => f.inspiration_id && inspirationsMap.has(f.inspiration_id))
    .map(f => ({
      ...f,
      inspiration: inspirationsMap.get(f.inspiration_id!)!,
    })) as FavoriteInspiration[];
}

/**
 * Vérifier si une inspiration est en favori
 */
export async function isInspirationFavorite(inspirationId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("favorite_type", "inspiration")
    .eq("inspiration_id", inspirationId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking favorite:", error);
  }

  return !!data;
}

/**
 * Ajouter une inspiration aux favoris
 */
export async function addInspirationToFavorites(inspirationId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("favorites")
    .insert({
      user_id: userId,
      favorite_type: "inspiration",
      inspiration_id: inspirationId,
    });

  if (error) {
    console.error("Error adding favorite:", error);
    return false;
  }

  return true;
}

/**
 * Retirer une inspiration des favoris
 */
export async function removeInspirationFromFavorites(inspirationId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("favorite_type", "inspiration")
    .eq("inspiration_id", inspirationId);

  if (error) {
    console.error("Error removing favorite:", error);
    return false;
  }

  return true;
}

/**
 * Toggle favori inspiration
 */
export async function toggleInspirationFavorite(inspirationId: string): Promise<boolean> {
  const isFav = await isInspirationFavorite(inspirationId);
  
  if (isFav) {
    return await removeInspirationFromFavorites(inspirationId);
  } else {
    return await addInspirationToFavorites(inspirationId);
  }
}

// ============================================
// COMPTEURS
// ============================================

/**
 * Nombre total de favoris par type
 */
export async function getFavoritesCount(): Promise<{ coiffeurs: number; inspirations: number; salons: number }> {
  const userId = await getCurrentUserId();
  if (!userId) return { coiffeurs: 0, inspirations: 0, salons: 0 };

  const { data, error } = await supabase
    .from("favorites")
    .select("favorite_type")
    .eq("user_id", userId);

  if (error) {
    console.error("Error counting favorites:", error);
    return { coiffeurs: 0, inspirations: 0, salons: 0 };
  }

  const counts = { coiffeurs: 0, inspirations: 0, salons: 0 };
  (data || []).forEach(f => {
    if (f.favorite_type === "coiffeur") counts.coiffeurs++;
    if (f.favorite_type === "inspiration") counts.inspirations++;
    if (f.favorite_type === "salon") counts.salons++;
  });

  return counts;
}