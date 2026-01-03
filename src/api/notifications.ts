// src/api/notifications.ts
import { supabase } from "@/lib/supabase";
import type {
  Notification,
  NotificationWithActor,
  NotificationType,
  NotificationData,
} from "@/types/database";

// ============ HELPERS ============

/**
 * Vérifie si l'utilisateur connecté est aussi un coiffeur
 */
export async function checkIsCoiffeur(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("coiffeurs")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  return !!data;
}

/**
 * Récupère l'ID coiffeur de l'utilisateur connecté
 */
export async function getMyCoiffeurId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("coiffeurs")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  return data?.id || null;
}

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
 * Récupère les notifications pour le rôle CLIENT
 * Filtre sur target_role = 'client' OU target_role IS NULL (pour les anciennes notifs)
 */
export async function getClientNotifications(limit = 50): Promise<NotificationWithActor[]> {
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
    .or("target_role.eq.client,target_role.is.null")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching client notifications:", error);
    return [];
  }

  // Filtrer les notifs qui sont explicitement pour coiffeur (target_role = 'coiffeur')
  // On garde celles qui sont 'client' ou NULL
  return (data || []).filter(n => n.target_role !== 'coiffeur');
}

/**
 * Récupère les notifications pour le rôle COIFFEUR
 * Filtre sur target_role = 'coiffeur'
 */
export async function getCoiffeurNotifications(limit = 50): Promise<NotificationWithActor[]> {
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
    .eq("target_role", "coiffeur")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching coiffeur notifications:", error);
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
 * Compte les notifications non lues (pour badge) - TOUTES
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

/**
 * Compte les notifications non lues CLIENT
 */
export async function getUnreadCountAsClient(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // On récupère les notifs non lues et on filtre côté client
  const { data, error } = await supabase
    .from("notifications")
    .select("id, target_role")
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error counting client unread notifications:", error);
    return 0;
  }

  // Compter celles qui sont pour client (target_role = 'client' ou NULL mais pas 'coiffeur')
  return (data || []).filter(n => n.target_role !== 'coiffeur').length;
}

/**
 * Compte les notifications non lues COIFFEUR
 */
export async function getUnreadCountAsCoiffeur(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false)
    .eq("target_role", "coiffeur");

  if (error) {
    console.error("Error counting coiffeur unread notifications:", error);
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

/**
 * Marque toutes les notifications CLIENT comme lues
 */
export async function markAllClientAsRead(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Marquer celles qui sont explicitement client
  await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", user.id)
    .eq("is_read", false)
    .eq("target_role", "client");

  // Marquer aussi celles qui sont NULL (anciennes notifs, ambiguës)
  await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", user.id)
    .eq("is_read", false)
    .is("target_role", null);

  return true;
}

/**
 * Marque toutes les notifications COIFFEUR comme lues
 */
export async function markAllCoiffeurAsRead(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", user.id)
    .eq("is_read", false)
    .eq("target_role", "coiffeur");

  if (error) {
    console.error("Error marking coiffeur notifications as read:", error);
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

// ============ CREATE ============

export interface CreateNotificationInput {
  recipient_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: NotificationData;
  actor_id?: string;
  image_url?: string;
  target_role?: "client" | "coiffeur"; // IMPORTANT: spécifier le rôle cible
}

/**
 * Crée une notification
 * IMPORTANT: toujours spécifier target_role pour les utilisateurs dual
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
      target_role: input.target_role || null, // Nouveau champ !
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

// ============ HELPERS D'AFFICHAGE ============

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
    new_booking: "#4CAF50",
    booking_confirmed: "#4CAF50",
    booking_cancelled: "#F44336",
    booking_reminder: "#FF9800",
    booking_completed: "#2196F3",
    new_message: "#9C27B0",
    new_review: "#FFC107",
    review_response: "#00BCD4",
    welcome: "#E91E63",
    promo: "#FF5722",
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

let notificationChannel: ReturnType<typeof supabase.channel> | null = null;
let notificationCallback: ((notification: Notification) => void) | null = null;

/**
 * S'abonne aux nouvelles notifications en temps réel
 */
export function subscribeToNotifications(
  onNewNotification: (notification: Notification) => void
): () => void {
  notificationCallback = onNewNotification;
  
  if (notificationChannel) {
    console.log("🔔 Notification channel already exists, updating callback");
    return () => {};
  }

  const setupSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("🔔 No user, skipping notification subscription");
      return;
    }
    
    console.log("🔔 Setting up notification subscription for user:", user.id);

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
          console.log("🔔 Realtime notification received:", notification.title, "target_role:", notification.target_role);
          
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser && notification.recipient_id === currentUser.id && notificationCallback) {
            console.log("🔔 Notification is for us! Calling callback");
            notificationCallback(notification);
          }
        }
      )
      .subscribe((status) => {
        console.log("🔔 Notification subscription status:", status);
      });
  };

  setupSubscription();

  return () => {
    if (notificationChannel) {
      console.log("🔔 Unsubscribing from notifications");
      supabase.removeChannel(notificationChannel);
      notificationChannel = null;
      notificationCallback = null;
    }
  };
}

/**
 * Réinitialise la subscription
 */
export function resetNotificationSubscription(): void {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel);
    notificationChannel = null;
    notificationCallback = null;
  }
}