// src/stores/messageStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { 
  getTotalUnreadCountAsClient, 
  getTotalUnreadCountAsCoiffeur,
} from "@/api/messaging";

interface MessageState {
  // Compteurs
  clientUnreadCount: number;
  coiffeurUnreadCount: number;
  
  // État de la subscription
  isSubscribed: boolean;
  
  // Actions
  fetchUnreadCounts: () => Promise<void>;
  setupRealtimeSubscription: () => void;
  resetClientCount: () => void;
  resetCoiffeurCount: () => void;
  incrementClientCount: () => void;
  incrementCoiffeurCount: () => void;
}

// Variable pour éviter les subscriptions multiples
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export const useMessageStore = create<MessageState>((set, get) => ({
  clientUnreadCount: 0,
  coiffeurUnreadCount: 0,
  isSubscribed: false,

  fetchUnreadCounts: async () => {
    try {
      const [clientCount, coiffeurCount] = await Promise.all([
        getTotalUnreadCountAsClient(),
        getTotalUnreadCountAsCoiffeur(),
      ]);
      
      set({
        clientUnreadCount: clientCount,
        coiffeurUnreadCount: coiffeurCount,
      });
    } catch (error) {
      console.error("Error fetching message unread counts:", error);
    }
  },

  setupRealtimeSubscription: () => {
    // Éviter les subscriptions multiples
    if (get().isSubscribed || realtimeChannel) {
      return;
    }

    realtimeChannel = supabase
      .channel("messages:global")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        async (payload) => {
          // Rafraîchir les compteurs quand une conversation est mise à jour
          const { fetchUnreadCounts } = get();
          await fetchUnreadCounts();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Nouveau message - rafraîchir les compteurs
          const { fetchUnreadCounts } = get();
          // Petit délai pour laisser le temps au trigger de mettre à jour les compteurs
          setTimeout(() => {
            fetchUnreadCounts();
          }, 500);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ isSubscribed: true });
        }
      });
  },

  resetClientCount: () => {
    set({ clientUnreadCount: 0 });
  },

  resetCoiffeurCount: () => {
    set({ coiffeurUnreadCount: 0 });
  },

  incrementClientCount: () => {
    set((state) => ({ clientUnreadCount: state.clientUnreadCount + 1 }));
  },

  incrementCoiffeurCount: () => {
    set((state) => ({ coiffeurUnreadCount: state.coiffeurUnreadCount + 1 }));
  },
}));