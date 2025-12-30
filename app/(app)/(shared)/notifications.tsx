// app/(app)/(shared)/notifications.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatNotificationDate,
  subscribeToNotifications,
} from "@/api/notifications";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import type { NotificationWithActor, NotificationType } from "@/types/database";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetCount } = useNotificationStore();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Détecter si l'utilisateur est un coiffeur
  const isCoiffeur = user?.role === "coiffeur";

  // Récupérer l'icône selon le type
  const getIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
    const icons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
      new_booking: "calendar",
      booking_confirmed: "checkmark-circle",
      booking_cancelled: "calendar-clear",
      booking_reminder: "alarm",
      booking_completed: "star-outline",
      new_message: "chatbubble",
      new_review: "star",
      review_response: "chatbubble-ellipses",
      welcome: "heart",
      promo: "pricetag",
    };
    return icons[type] || "notifications";
  };

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    const data = await getNotifications(100);
    setNotifications(data);
    setLoading(false);
  }, []);

  // Premier chargement
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Abonnement temps réel
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((newNotification) => {
      setNotifications((prev) => [newNotification as NotificationWithActor, ...prev]);
    });

    return () => unsubscribe();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Marquer tout comme lu
  const handleMarkAllRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      resetCount();
    }
  };

  // Clic sur une notification
  const handleNotificationPress = async (notification: NotificationWithActor) => {
    // Marquer comme lu si pas déjà fait
    if (!notification.is_read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    }

    // Navigation selon le type et le rôle
    navigateToNotification(notification);
  };

  // Navigation selon le type de notification et le rôle utilisateur
  const navigateToNotification = (notification: NotificationWithActor) => {
    const { type, data } = notification;

    switch (type) {
      case "new_booking":
        // Nouvelle réservation → Pour le coiffeur uniquement
        if (isCoiffeur && data?.booking_id) {
          // Naviguer vers l'agenda avec le booking_id pour ouvrir la modale
          router.push({
            pathname: "/(app)/(pro)/(tabs)/agenda",
            params: { bookingId: data.booking_id },
          });
        }
        break;

      case "booking_confirmed":
        // RDV confirmé → Pour le client
        if (!isCoiffeur) {
          router.push("/(app)/(tabs)/activity");
        } else if (data?.booking_id) {
          router.push({
            pathname: "/(app)/(pro)/(tabs)/agenda",
            params: { bookingId: data.booking_id },
          });
        }
        break;

      case "booking_cancelled":
        // RDV annulé → Activity pour client, Agenda pour coiffeur
        if (isCoiffeur && data?.booking_id) {
          router.push({
            pathname: "/(app)/(pro)/(tabs)/agenda",
            params: { bookingId: data.booking_id },
          });
        } else {
          router.push("/(app)/(tabs)/activity");
        }
        break;

      case "booking_reminder":
        // Rappel RDV → Activity pour client, Agenda pour coiffeur
        if (isCoiffeur && data?.booking_id) {
          router.push({
            pathname: "/(app)/(pro)/(tabs)/agenda",
            params: { bookingId: data.booking_id },
          });
        } else {
          router.push("/(app)/(tabs)/activity");
        }
        break;

      case "booking_completed":
        // RDV terminé → Activity pour client (pour laisser un avis)
        router.push("/(app)/(tabs)/activity");
        break;

      case "new_message":
        if (data?.conversation_id) {
          // TODO: Naviguer vers la conversation
          // router.push(`/chat/${data.conversation_id}`);
        }
        break;

      case "new_review":
      case "review_response":
        // TODO: Naviguer vers les avis
        break;

      default:
        break;
    }
  };

  // Supprimer une notification (long press)
  const handleLongPress = (notification: NotificationWithActor) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous supprimer cette notification ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const success = await deleteNotification(notification.id);
            if (success) {
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            }
          },
        },
      ]
    );
  };

  // Compteur non lus
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <Pressable style={styles.markAllButton} onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Tout lire</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Badge non lus */}
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Text style={styles.unreadBannerText}>
              {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.border} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous recevrez ici les alertes de vos rendez-vous et messages
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notif) => (
              <Pressable
                key={notif.id}
                style={[styles.notifCard, !notif.is_read && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(notif)}
                onLongPress={() => handleLongPress(notif)}
              >
                <View style={[styles.notifIcon, !notif.is_read && styles.notifIconUnread]}>
                  <Ionicons
                    name={getIcon(notif.type)}
                    size={20}
                    color={!notif.is_read ? "#FFF" : theme.text}
                  />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {notif.body && (
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {notif.body}
                    </Text>
                  )}
                  <Text style={styles.notifTime}>
                    {formatNotificationDate(notif.created_at)}
                  </Text>
                </View>
                {!notif.is_read && <View style={styles.unreadDot} />}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },
  headerSpacer: {
    width: 44,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  unreadBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
  },
  unreadBannerText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  notificationsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: theme.card,
    borderRadius: 16,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: "#F0F0F0",
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIconUnread: {
    backgroundColor: theme.text,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.text,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});