// src/api/addresses.ts
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export interface Address {
  id: string;
  profile_id: string;
  label: string | null;
  address_line: string;
  address_line_2: string | null;
  city: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  instructions: string | null;
  is_default: boolean;
  created_at: string;
}

export interface AddressInput {
  label?: string;
  address_line: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  is_default?: boolean;
}

// ============================================
// HELPERS
// ============================================

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupérer toutes les adresses de l'utilisateur
 */
export async function getMyAddresses(): Promise<Address[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("profile_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupérer l'adresse par défaut
 */
export async function getDefaultAddress(): Promise<Address | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("profile_id", userId)
    .eq("is_default", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching default address:", error);
  }

  return data || null;
}

/**
 * Récupérer une adresse par ID
 */
export async function getAddressById(id: string): Promise<Address | null> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching address:", error);
    return null;
  }

  return data;
}

/**
 * Créer une nouvelle adresse
 */
export async function createAddress(input: AddressInput): Promise<Address | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Si c'est la première adresse ou marquée par défaut, on la met par défaut
  const existingAddresses = await getMyAddresses();
  const shouldBeDefault = existingAddresses.length === 0 || input.is_default;

  // Si cette adresse devient la défaut, enlever le défaut des autres
  if (shouldBeDefault && existingAddresses.length > 0) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", userId);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      profile_id: userId,
      label: input.label || null,
      address_line: input.address_line,
      address_line_2: input.address_line_2 || null,
      city: input.city,
      postal_code: input.postal_code,
      country: input.country || "France",
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      instructions: input.instructions || null,
      is_default: shouldBeDefault,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating address:", error);
    return null;
  }

  return data;
}

/**
 * Mettre à jour une adresse
 */
export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Si on met cette adresse par défaut, enlever le défaut des autres
  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", userId)
      .neq("id", id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update({
      ...input,
      // Ne pas écraser les champs non fournis
    })
    .eq("id", id)
    .eq("profile_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating address:", error);
    return null;
  }

  return data;
}

/**
 * Supprimer une adresse
 */
export async function deleteAddress(id: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  // Vérifier si c'est l'adresse par défaut
  const address = await getAddressById(id);
  const wasDefault = address?.is_default;

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("profile_id", userId);

  if (error) {
    console.error("Error deleting address:", error);
    return false;
  }

  // Si c'était la défaut, mettre une autre adresse par défaut
  if (wasDefault) {
    const remaining = await getMyAddresses();
    if (remaining.length > 0) {
      await setDefaultAddress(remaining[0].id);
    }
  }

  return true;
}

/**
 * Définir une adresse comme défaut
 */
export async function setDefaultAddress(id: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  // Enlever le défaut des autres
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("profile_id", userId);

  // Mettre cette adresse par défaut
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("profile_id", userId);

  if (error) {
    console.error("Error setting default address:", error);
    return false;
  }

  return true;
}

/**
 * Formater une adresse en une seule ligne
 */
export function formatAddress(address: Address): string {
  const parts = [
    address.address_line,
    address.address_line_2,
    `${address.postal_code} ${address.city}`,
  ].filter(Boolean);
  
  return parts.join(", ");
}

/**
 * Formater une adresse courte (pour affichage)
 */
export function formatAddressShort(address: Address): string {
  return `${address.address_line}, ${address.city}`;
}