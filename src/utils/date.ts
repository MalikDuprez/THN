// src/utils/date.ts

/**
 * Formate une date en string local (YYYY-MM-DD)
 * IMPORTANT: Ne jamais utiliser toISOString() pour les dates
 */
export const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formate une date pour l'affichage (ex: "Lun. 15 janvier")
 */
export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
};

/**
 * Formate une date complète (ex: "Lundi 15 janvier 2025")
 */
export const formatDateFull = (date: Date): string => {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Vérifie si un créneau horaire est passé
 */
export const isTimeSlotPast = (date: Date, hour: number): boolean => {
  const now = new Date();
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate < now;
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifie si une date est dans le passé
 */
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

/**
 * Génère les créneaux horaires (24h/24)
 */
export const generateTimeSlots = (): string[] => {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
};
