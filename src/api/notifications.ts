// src/api/notifications.ts
import { supabase } from "@/lib/supabase";
import type {
  Notification,
  NotificationWithActor,
  NotificationType,
  NotificationData,
} from "@/types/database";

// ============ READ ============

/**
 * Récupère toutes les notifications de l'utilisateur connecté
 * @param limit Nombre max de notifications (défaut: 50)
 */
export async function getNotifications(limit = 50): Promise<NotificationWithActor[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(
        id,
        full_name,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupère uniquement les notifications non lues
 */
export async function getUnreadNotifications(): Promise<NotificationWithActor[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(
        id,
        full_name,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("recipient_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Compte les notifications non lues (pour badge)
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error counting unread notifications:", error);
    return 0;
  }

  return count || 0;
}

// ============ UPDATE ============

/**
 * Marque une notification comme lue
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }

  return true;
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllAsRead(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }

  return true;
}

// ============ DELETE ============

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Error deleting notification:", error);
    return false;
  }

  return true;
}

/**
 * Supprime toutes les notifications lues
 */
export async function clearReadNotifications(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("recipient_id", user.id)
    .eq("is_read", true);

  if (error) {
    console.error("Error clearing read notifications:", error);
    return false;
  }

  return true;
}

// ============ CREATE (pour usage interne/triggers) ============

export interface CreateNotificationInput {
  recipient_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: NotificationData;
  actor_id?: string;
  image_url?: string;
}

/**
 * Crée une notification (utilisé par le backend/triggers)
 * Note: En production, cette fonction serait appelée côté serveur
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_id: input.recipient_id,
      type: input.type,
      title: input.title,
      body: input.body || null,
      data: input.data || {},
      actor_id: input.actor_id || null,
      image_url: input.image_url || null,
      is_read: false,
      push_sent: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }

  return data;
}

// ============ HELPERS ============

/**
 * Retourne l'icône appropriée selon le type de notification
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    new_booking: "calendar-plus",
    booking_confirmed: "calendar-check",
    booking_cancelled: "calendar-x",
    booking_reminder: "bell",
    booking_completed: "check-circle",
    new_message: "message-circle",
    new_review: "star",
    review_response: "message-square",
    welcome: "heart",
    promo: "tag",
  };
  return icons[type] || "bell";
}

/**
 * Retourne la couleur appropriée selon le type de notification
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    new_booking: "#4CAF50",      // Vert
    booking_confirmed: "#4CAF50", // Vert
    booking_cancelled: "#F44336", // Rouge
    booking_reminder: "#FF9800",  // Orange
    booking_completed: "#2196F3", // Bleu
    new_message: "#9C27B0",       // Violet
    new_review: "#FFC107",        // Jaune
    review_response: "#00BCD4",   // Cyan
    welcome: "#E91E63",           // Rose
    promo: "#FF5722",             // Orange foncé
  };
  return colors[type] || "#757575";
}

/**
 * Formate la date de notification de manière relative
 */
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// ============ REALTIME SUBSCRIPTION ============

// Singleton pour éviter les subscriptions multiples
let notificationChannel: ReturnType<typeof supabase.channel> | null = null;
let notificationCallback: ((notification: Notification) => void) | null = null;

/**
 * S'abonne aux nouvelles notifications en temps réel
 * @param onNewNotification Callback appelé quand une nouvelle notification arrive
 * @returns Fonction pour se désabonner
 */
export function subscribeToNotifications(
  onNewNotification: (notification: Notification) => void
): () => void {
  // Stocker le callback pour pouvoir le mettre à jour
  notificationCallback = onNewNotification;
  
  // Si déjà abonné, ne rien faire
  if (notificationChannel) {
    console.log("🔔 Notification channel already exists, reusing");
    return () => {};
  }

  const setupSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("🔔 No user, skipping notification subscription");
      return;
    }
    
    console.log("🔔 Setting up notification subscription for user:", user.id);

    // Écouter TOUS les INSERT sur notifications (sans filtre - plus fiable avec RLS)
    notificationChannel = supabase
      .channel("notifications:realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async (payload) => {
          const notification = payload.new as Notification;
          console.log("🔔 Realtime notification received:", notification.title, "for:", notification.recipient_id);
          
          // Vérifier l'utilisateur actuel (peut avoir changé)
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          // Vérifier si c'est pour nous
          if (currentUser && notification.recipient_id === currentUser.id && notificationCallback) {
            console.log("🔔 Notification is for us! Calling callback");
            notificationCallback(notification);
          }
        }
      )
      .subscribe((status) => {
        console.log("🔔 Subscription status:", status);
      });
  };

  setupSubscription();

  // Retourne une fonction vide - on ne se désinscrit jamais
  return () => {};
}