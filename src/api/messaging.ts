// src/api/messaging.ts
import { supabase } from "@/lib/supabase";
import { getUserAvatar } from "@/constants/images";

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "booking_link" | "system";
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Conversation {
  id: string;
  client_id: string;
  coiffeur_id: string;
  booking_id: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  client_unread_count: number;
  coiffeur_unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  client: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  coiffeur: {
    id: string;
    profile: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ============================================
// HELPERS
// ============================================

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

async function getMyCoiffeurId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from("coiffeurs")
    .select("id")
    .eq("profile_id", userId)
    .single();

  return data?.id || null;
}

// Helper pour enrichir une conversation avec les détails client/coiffeur
async function enrichConversation(conv: Conversation): Promise<ConversationWithDetails> {
  // Récupérer le profil client
  const { data: client } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name, avatar_url")
    .eq("id", conv.client_id)
    .single();

  // Récupérer le coiffeur avec son profil
  const { data: coiffeur } = await supabase
    .from("coiffeurs")
    .select(`
      id,
      profile:profiles(id, first_name, last_name, full_name, avatar_url)
    `)
    .eq("id", conv.coiffeur_id)
    .single();

  return {
    ...conv,
    client: client || null,
    coiffeur: coiffeur || null,
  };
}

// ============================================
// CONVERSATIONS
// ============================================

/**
 * Récupérer toutes les conversations de l'utilisateur connecté
 */
export async function getMyConversations(): Promise<ConversationWithDetails[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const coiffeurId = await getMyCoiffeurId();

  // Récupérer les conversations
  let query = supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (coiffeurId) {
    query = query.eq("coiffeur_id", coiffeurId);
  } else {
    query = query.eq("client_id", userId);
  }

  const { data: conversations, error } = await query;

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  // Enrichir chaque conversation
  const enriched = await Promise.all(
    (conversations || []).map(conv => enrichConversation(conv))
  );

  return enriched;
}

/**
 * Récupérer une conversation par son ID
 */
export async function getConversationById(conversationId: string): Promise<ConversationWithDetails | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }

  return enrichConversation(data);
}

/**
 * Trouver ou créer une conversation entre un client et un coiffeur
 */
export async function getOrCreateConversation(
  coiffeurId: string,
  bookingId?: string
): Promise<ConversationWithDetails | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error("User not authenticated");
    return null;
  }

  // Chercher une conversation existante
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", userId)
    .eq("coiffeur_id", coiffeurId)
    .single();

  if (existing) {
    if (bookingId && !existing.booking_id) {
      await supabase
        .from("conversations")
        .update({ booking_id: bookingId })
        .eq("id", existing.id);
    }
    return enrichConversation(existing);
  }

  // Créer une nouvelle conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      client_id: userId,
      coiffeur_id: coiffeurId,
      booking_id: bookingId || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return enrichConversation(newConv);
}

/**
 * Pour un coiffeur: créer/récupérer une conversation avec un client
 */
export async function getOrCreateConversationAsCoiffeur(
  clientId: string,
  bookingId?: string
): Promise<ConversationWithDetails | null> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) {
    console.error("User is not a coiffeur");
    return null;
  }

  // Chercher une conversation existante
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", clientId)
    .eq("coiffeur_id", coiffeurId)
    .single();

  if (existing) {
    if (bookingId && !existing.booking_id) {
      await supabase
        .from("conversations")
        .update({ booking_id: bookingId })
        .eq("id", existing.id);
    }
    return enrichConversation(existing);
  }

  // Créer une nouvelle conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      client_id: clientId,
      coiffeur_id: coiffeurId,
      booking_id: bookingId || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return enrichConversation(newConv);
}

// ============================================
// MESSAGES
// ============================================

/**
 * Récupérer les messages d'une conversation
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<MessageWithSender[]> {
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  // Enrichir avec les infos du sender
  const enriched = await Promise.all(
    (messages || []).map(async (msg) => {
      const { data: sender } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, avatar_url")
        .eq("id", msg.sender_id)
        .single();

      return {
        ...msg,
        sender: sender || null,
      };
    })
  );

  // Retourner dans l'ordre chronologique
  return enriched.reverse();
}

/**
 * Envoyer un message
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  messageType: "text" | "image" | "booking_link" | "system" = "text",
  metadata: Record<string, any> = {}
): Promise<MessageWithSender | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error("User not authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content,
      message_type: messageType,
      metadata,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return null;
  }

  // Récupérer les infos du sender
  const { data: sender } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name, avatar_url")
    .eq("id", userId)
    .single();

  return {
    ...data,
    sender: sender || null,
  };
}

/**
 * Marquer les messages d'une conversation comme lus
 */
export async function markConversationAsRead(conversationId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const coiffeurId = await getMyCoiffeurId();

  // Utiliser la fonction SQL pour marquer comme lu
  const { error } = await supabase.rpc("mark_messages_as_read", {
    p_conversation_id: conversationId,
    p_reader_id: userId,
  });

  if (error) {
    console.error("Error marking as read via RPC:", error);
    
    // Fallback: mise à jour manuelle des messages
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    // Fallback: mise à jour manuelle des compteurs
    if (coiffeurId) {
      // Je suis coiffeur, reset coiffeur_unread_count
      await supabase
        .from("conversations")
        .update({ coiffeur_unread_count: 0 })
        .eq("id", conversationId);
    } else {
      // Je suis client, reset client_unread_count
      await supabase
        .from("conversations")
        .update({ client_unread_count: 0 })
        .eq("id", conversationId);
    }
  }

  return true;
}

// ============================================
// COMPTEURS & NOTIFICATIONS
// ============================================

/**
 * Récupérer le nombre total de messages non lus (détection auto du rôle)
 */
export async function getTotalUnreadCount(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const coiffeurId = await getMyCoiffeurId();

  let query = supabase
    .from("conversations")
    .select("client_unread_count, coiffeur_unread_count");

  if (coiffeurId) {
    query = query.eq("coiffeur_id", coiffeurId);
  } else {
    query = query.eq("client_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return (data || []).reduce((sum, conv) => {
    if (coiffeurId) {
      return sum + (conv.coiffeur_unread_count || 0);
    }
    return sum + (conv.client_unread_count || 0);
  }, 0);
}

/**
 * Récupérer le nombre total de messages non lus en tant que CLIENT
 */
export async function getTotalUnreadCountAsClient(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { data, error } = await supabase
    .from("conversations")
    .select("client_unread_count")
    .eq("client_id", userId);

  if (error) {
    console.error("Error fetching unread count as client:", error);
    return 0;
  }

  return (data || []).reduce((sum, conv) => sum + (conv.client_unread_count || 0), 0);
}

/**
 * Récupérer le nombre total de messages non lus en tant que COIFFEUR
 */
export async function getTotalUnreadCountAsCoiffeur(): Promise<number> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return 0;

  const { data, error } = await supabase
    .from("conversations")
    .select("coiffeur_unread_count")
    .eq("coiffeur_id", coiffeurId);

  if (error) {
    console.error("Error fetching unread count as coiffeur:", error);
    return 0;
  }

  return (data || []).reduce((sum, conv) => sum + (conv.coiffeur_unread_count || 0), 0);
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * S'abonner aux nouveaux messages d'une conversation
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: MessageWithSender) => void,
  onMessageUpdated?: (message: MessageWithSender) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const msg = payload.new as Message;
        
        // Récupérer les infos du sender
        const { data: sender } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, avatar_url")
          .eq("id", msg.sender_id)
          .single();

        onNewMessage({
          ...msg,
          sender: sender || null,
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        if (!onMessageUpdated) return;
        
        const msg = payload.new as Message;
        
        // Récupérer les infos du sender
        const { data: sender } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, avatar_url")
          .eq("id", msg.sender_id)
          .single();

        onMessageUpdated({
          ...msg,
          sender: sender || null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * S'abonner aux mises à jour des conversations (pour les badges)
 */
export function subscribeToConversations(
  onUpdate: (conversation: Conversation) => void
) {
  const channel = supabase
    .channel("conversations:updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      },
      (payload) => {
        onUpdate(payload.new as Conversation);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// UTILS
// ============================================

/**
 * Formater l'heure d'un message pour l'affichage
 */
export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Hier";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "long" });
  } else {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
}

/**
 * Obtenir le nom à afficher pour l'autre participant
 */
export function getOtherParticipantName(
  conversation: ConversationWithDetails,
  isCoiffeur: boolean
): string {
  if (isCoiffeur) {
    return conversation.client?.full_name || 
      `${conversation.client?.first_name || ""} ${conversation.client?.last_name || ""}`.trim() || 
      "Client";
  }
  return conversation.coiffeur?.profile?.full_name ||
    `${conversation.coiffeur?.profile?.first_name || ""} ${conversation.coiffeur?.profile?.last_name || ""}`.trim() ||
    "Coiffeur";
}

/**
 * Obtenir l'avatar de l'autre participant
 */
export function getOtherParticipantAvatar(
  conversation: ConversationWithDetails,
  isCoiffeur: boolean
): string {
  if (isCoiffeur) {
    const name = getOtherParticipantName(conversation, true);
    return getUserAvatar(conversation.client?.avatar_url, name);
  }
  const name = getOtherParticipantName(conversation, false);
  return getUserAvatar(conversation.coiffeur?.profile?.avatar_url, name);
}