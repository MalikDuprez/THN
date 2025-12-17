// src/api/inspirations.ts
import { supabase } from "@/lib/supabase";

export interface Inspiration {
  id: string;
  title: string;
  image_url: string;
  category: string;
  tags: string[];
  duration_estimate: string;
  price_estimate: number;
  likes_count: number;
  coiffeur_id: string | null;
  created_at: string;
}

// Récupérer toutes les inspirations
export async function getInspirations(): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from("inspirations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inspirations:", error);
    return [];
  }

  return data || [];
}

// Récupérer une inspiration par ID
export async function getInspirationById(id: string): Promise<Inspiration | null> {
  const { data, error } = await supabase
    .from("inspirations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching inspiration:", error);
    return null;
  }

  return data;
}

// Filtrer par catégorie
export async function getInspirationsByCategory(category: string): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from("inspirations")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inspirations:", error);
    return [];
  }

  return data || [];
}