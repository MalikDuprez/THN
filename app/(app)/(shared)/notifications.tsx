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
  getClientNotifications,
  getCoiffeurNotifications,
  checkIsCoiffeur,
  markAsRead,
  markAllClientAsRead,
  markAllCoiffeurAsRead,
  deleteNotification,
  formatNotificationDate,
  subscribeToNotifications,
} from "@/api/notifications";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import type { NotificationWithActor, NotificationType } from "@/types/database";

const theme = {
  background: "#FFFFFF",
  black: "#000000",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
  accent: "#3B82F6",
};

// ============================================
// COMPOSANT LISTE DE NOTIFICATIONS
// ============================================
const NotificationList = ({ 
  notifications, 
  loading, 
  refreshing, 
  onRefresh, 
  onNotificationPress, 
  onNotificationLongPress,
  emptyMessage,
}: {
  notifications: NotificationWithActor[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onNotificationPress: (notification: NotificationWithActor) => void;
  onNotificationLongPress: (notification: NotificationWithActor) => void;
  emptyMessage: string;
}) => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyScrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.border} />
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptySubtitle}>{emptyMessage}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
      }
    >
      <View style={styles.notificationsList}>
        {notifications.map((notif) => (
          <Pressable
            key={notif.id}
            style={[styles.notifCard, !notif.is_read && styles.notifCardUnread]}
            onPress={() => onNotificationPress(notif)}
            onLongPress={() => onNotificationLongPress(notif)}
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
    </ScrollView>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetClientCount, resetCoiffeurCount, fetchUnreadCounts, clientUnreadCount, coiffeurUnreadCount } = useNotificationStore();
  const { user } = useAuthStore();

  // États
  const [activeTab, setActiveTab] = useState<"client" | "coiffeur">("client");
  const [clientNotifications, setClientNotifications] = useState<NotificationWithActor[]>([]);
  const [coiffeurNotifications, setCoiffeurNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDualUser, setIsDualUser] = useState(false);

  // Vérifier si l'utilisateur a les deux profils
  useEffect(() => {
    const checkDualUser = async () => {
      const isCoiffeur = await checkIsCoiffeur();
      setIsDualUser(isCoiffeur);
      // Si c'est seulement un coiffeur (pas de profil client récent), on affiche l'onglet coiffeur par défaut
      // Mais techniquement tout le monde est client, donc on garde "client" par défaut
    };
    checkDualUser();
  }, []);

  // Charger les notifications selon l'onglet actif
  const loadNotifications = useCallback(async () => {
    try {
      if (isDualUser) {
        // Charger les deux listes
        const [clientData, coiffeurData] = await Promise.all([
          getClientNotifications(100),
          getCoiffeurNotifications(100),
        ]);
        setClientNotifications(clientData);
        setCoiffeurNotifications(coiffeurData);
      } else {
        // Utilisateur simple : charger seulement les notifications client
        const clientData = await getClientNotifications(100);
        setClientNotifications(clientData);
      }
      
      // Mettre à jour les compteurs
      await fetchUnreadCounts();
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDualUser, fetchUnreadCounts]);

  // Premier chargement
  useEffect(() => {
    if (isDualUser !== undefined) {
      loadNotifications();
    }
  }, [isDualUser, loadNotifications]);

  // Auto-marquer comme lues après 3 secondes
  useEffect(() => {
    const currentUnread = activeTab === "client" 
      ? clientNotifications.filter(n => !n.is_read).length
      : coiffeurNotifications.filter(n => !n.is_read).length;
    
    if (currentUnread > 0) {
      const timer = setTimeout(async () => {
        if (activeTab === "client") {
          const success = await markAllClientAsRead();
          if (success) {
            setClientNotifications((prev) =>
              prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            resetClientCount();
          }
        } else {
          const success = await markAllCoiffeurAsRead();
          if (success) {
            setCoiffeurNotifications((prev) =>
              prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            resetCoiffeurCount();
          }
        }
      }, 1000); // 1 seconde

      return () => clearTimeout(timer);
    }
  }, [activeTab, clientNotifications, coiffeurNotifications]);

  // Abonnement temps réel
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((newNotification) => {
      // Recharger les notifications pour les mettre à jour
      loadNotifications();
    });

    return () => unsubscribe();
  }, [loadNotifications]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // Marquer tout comme lu (selon l'onglet actif)
  const handleMarkAllRead = async () => {
    if (activeTab === "client") {
      const success = await markAllClientAsRead();
      if (success) {
        setClientNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        resetClientCount();
      }
    } else {
      const success = await markAllCoiffeurAsRead();
      if (success) {
        setCoiffeurNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        resetCoiffeurCount();
      }
    }
  };

  // Clic sur une notification
  const handleNotificationPress = async (notification: NotificationWithActor) => {
    // Marquer comme lu si pas déjà fait
    if (!notification.is_read) {
      await markAsRead(notification.id);
      
      // Mettre à jour la liste locale
      if (activeTab === "client") {
        setClientNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      } else {
        setCoiffeurNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }
      
      // Mettre à jour les compteurs
      fetchUnreadCounts();
    }

    // Navigation selon le type
    navigateToNotification(notification, activeTab === "coiffeur");
  };

  // Navigation selon le type de notification et le rôle utilisateur
  const navigateToNotification = (notification: NotificationWithActor, isCoiffeurContext: boolean) => {
    const { type, data } = notification;

    switch (type) {
      case "new_booking":
        // Nouvelle réservation → Pour le coiffeur
        if (data?.booking_id) {
          router.push({
            pathname: "/(app)/(pro)/(tabs)/agenda",
            params: { bookingId: data.booking_id },
          });
        }
        break;

      case "booking_confirmed":
        // RDV confirmé → Pour le client
        if (!isCoiffeurContext) {
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
        if (isCoiffeurContext && data?.booking_id) {
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
        if (isCoiffeurContext && data?.booking_id) {
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
          if (isCoiffeurContext) {
            router.push(`/(app)/(pro)/conversation/${data.conversation_id}`);
          } else {
            router.push(`/(app)/(client)/conversation/${data.conversation_id}`);
          }
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
              if (activeTab === "client") {
                setClientNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              } else {
                setCoiffeurNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              }
              fetchUnreadCounts();
            }
          },
        },
      ]
    );
  };

  // Notifications actuelles selon l'onglet
  const currentNotifications = activeTab === "client" ? clientNotifications : coiffeurNotifications;
  const currentUnreadCount = activeTab === "client" 
    ? clientNotifications.filter(n => !n.is_read).length 
    : coiffeurNotifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.pageTitle}>Notifications</Text>
        {currentUnreadCount > 0 ? (
          <Pressable style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Sous-onglets (seulement si utilisateur dual) */}
      {isDualUser && (
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "client" && styles.tabActive]}
            onPress={() => setActiveTab("client")}
          >
            <Ionicons 
              name="person-outline" 
              size={18} 
              color={activeTab === "client" ? theme.black : theme.textMuted} 
            />
            <Text style={[styles.tabText, activeTab === "client" && styles.tabTextActive]}>
              Client
            </Text>
            {clientUnreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {clientUnreadCount > 99 ? "99+" : clientUnreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "coiffeur" && styles.tabActive]}
            onPress={() => setActiveTab("coiffeur")}
          >
            <Ionicons 
              name="cut-outline" 
              size={18} 
              color={activeTab === "coiffeur" ? theme.black : theme.textMuted} 
            />
            <Text style={[styles.tabText, activeTab === "coiffeur" && styles.tabTextActive]}>
              Pro
            </Text>
            {coiffeurUnreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {coiffeurUnreadCount > 99 ? "99+" : coiffeurUnreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* Banner non lus */}
      {currentUnreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {currentUnreadCount} notification{currentUnreadCount > 1 ? "s" : ""} non lue{currentUnreadCount > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Liste des notifications */}
      <NotificationList
        notifications={currentNotifications}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onNotificationPress={handleNotificationPress}
        onNotificationLongPress={handleLongPress}
        emptyMessage={
          activeTab === "client" 
            ? "Vous recevrez ici les alertes de vos rendez-vous et messages"
            : "Vous recevrez ici les nouvelles réservations et avis clients"
        }
      />
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
    marginBottom: 16,
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
  
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.textMuted,
  },
  tabTextActive: {
    color: theme.black,
    fontWeight: "600",
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // Unread banner
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

  // Notifications list
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
    backgroundColor: theme.black,
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
    backgroundColor: theme.black,
    marginTop: 4,
  },

  // Empty state
  emptyScrollContainer: {
    flexGrow: 1,
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