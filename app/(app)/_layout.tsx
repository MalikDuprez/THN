// app/(app)/_layout.tsx
import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useMessageStore } from "@/stores/messageStore";
import { Redirect } from "expo-router";
import { ROUTES } from "@/constants/routes";
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  resetBadgeCount,
} from "@/api/pushNotifications";
import * as Notifications from "expo-notifications";

export default function AppLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { setupRealtimeSubscription: setupNotifRealtime, fetchUnreadCounts: fetchNotifCounts } = useNotificationStore();
  const { setupRealtimeSubscription: setupMessageRealtime, fetchUnreadCounts: fetchMessageCounts } = useMessageStore();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Initialiser le Realtime et charger les compteurs au montage
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🚀 App Layout: Setting up realtime & fetching counts");
      // Notifications
      setupNotifRealtime();
      fetchNotifCounts();
      // Messages
      setupMessageRealtime();
      fetchMessageCounts();

      // Enregistrer pour les push notifications
      registerForPushNotifications();

      // Listener: notification reçue (app ouverte)
      notificationListener.current = addNotificationReceivedListener((notification) => {
        console.log("📬 Notification received:", notification.request.content.title);
        // Rafraîchir les compteurs
        fetchNotifCounts();
        fetchMessageCounts();
      });

      // Listener: notification tapée (ouvrir l'app depuis notif)
      responseListener.current = addNotificationResponseListener((response) => {
        console.log("👆 Notification tapped:", response.notification.request.content);
        const data = response.notification.request.content.data;
        
        // Reset le badge
        resetBadgeCount();
        
        // Naviguer selon le type de notification
        if (data?.type === "booking_started" && data?.booking_id) {
          router.push(ROUTES.CLIENT.ACTIVITY);
        } else if (data?.type === "booking_feedback_request" && data?.booking_id) {
          router.push(`/(app)/(shared)/feedback/${data.booking_id}` as any);
        } else if (data?.type === "new_message" && data?.conversation_id) {
          router.push(`/(app)/(client)/conversation/${data.conversation_id}` as any);
        } else {
          // Par défaut, aller aux notifications
          router.push(ROUTES.SHARED.NOTIFICATIONS);
        }
      });
    }

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href={ROUTES.AUTH.WELCOME} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}