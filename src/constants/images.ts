// src/constants/images.ts

// Avatar par défaut - icône neutre sans genre
// Utiliser une icône plutôt qu'une photo pour éviter la confusion
export const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=E5E7EB&color=9CA3AF&bold=true&size=200&name=?";

// Fonction pour générer un avatar avec initiales
export function getInitialsAvatar(name: string | null | undefined): string {
  if (!name || name.trim() === "") {
    return DEFAULT_AVATAR;
  }
  
  // Nettoyer le nom et prendre les initiales
  const cleanName = name.trim().replace(/\s+/g, "+");
  return `https://ui-avatars.com/api/?background=000000&color=FFFFFF&bold=true&size=200&name=${encodeURIComponent(cleanName)}`;
}

// Helper pour obtenir l'avatar d'un utilisateur
export function getUserAvatar(
  avatarUrl: string | null | undefined, 
  name?: string | null
): string {
  if (avatarUrl && avatarUrl.trim() !== "") {
    return avatarUrl;
  }
  
  if (name) {
    return getInitialsAvatar(name);
  }
  
  return DEFAULT_AVATAR;
}