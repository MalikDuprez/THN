// app/(app)/(pro)/(tabs)/dashboard.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet,
  Image,
  Modal,
  Animated,
  Dimensions,
  Switch,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { ROUTES } from "@/constants/routes";

const { height } = Dimensions.get("window");

// ============================================
// THEME
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  card: "#F8FAFC",
  text: "#000000",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  accent: "#3B82F6",
  accentLight: "#EFF6FF",
  success: "#10B981",
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  border: "#E2E8F0",
  gold: "#FFB800",
};

// ============================================
// DONNÉES MOCK
// ============================================
const MOCK_USER = {
  name: "Antoine",
  specialty: "Coiffeur Pro",
  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  rating: 4.8,
  reviewCount: 127,
};

const MOCK_REVENUE = {
  day: { amount: 185, variation: 12 },
  week: { amount: 920, variation: 8 },
  month: { amount: 3450, variation: 15 },
  year: { amount: 42600, variation: 22 },
};

const MOCK_ACTIVITY = {
  prestations: 12,
  clients: 8,
  cancellations: 2,
};

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "reservation", title: "Nouvelle réservation", subtitle: "Marie L. - Coupe femme 14h", time: "Il y a 5 min", read: false },
  { id: "2", type: "reminder", title: "Rappel dans 30 min", subtitle: "Thomas D. - Dégradé 11h00", time: "Il y a 10 min", read: false },
  { id: "3", type: "review", title: "Nouvel avis (5/5)", subtitle: "Julie M. vous a laissé un avis", time: "Il y a 1h", read: false },
  { id: "4", type: "payment", title: "Paiement reçu", subtitle: "45€ - Coupe + Brushing", time: "Hier", read: true },
  { id: "5", type: "reservation", title: "RDV confirmé", subtitle: "Lucas P. - Demain 10h", time: "Hier", read: true },
];

const MOCK_UPCOMING = [
  { id: "1", time: "11:00", client: "Thomas D.", service: "Dégradé", status: "pending", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", price: 25 },
  { id: "2", time: "14:00", client: "Marie L.", service: "Coupe femme", status: "confirmed", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", price: 35 },
  { id: "3", time: "16:00", client: "Julie M.", service: "Coloration", status: "confirmed", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100", price: 65 },
];

const MOCK_MESSAGE_COUNT = 2;

const MENU_ITEMS = [
  { icon: "swap-horizontal", label: "Passer en mode Client", route: "switch" },
  { icon: "settings-outline", label: "Paramètres", route: "settings" },
];

const NOTIF_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "reservation", label: "RDV", icon: "calendar-outline" },
  { key: "review", label: "Avis", icon: "star-outline" },
  { key: "payment", label: "Paiements", icon: "cash-outline" },
];

const REVENUE_PERIODS = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

// ============================================
// HELPERS
// ============================================
const getNotifIcon = (type: string) => {
  switch (type) {
    case "reservation": return { name: "calendar", color: theme.accent, bg: theme.accentLight };
    case "reminder": return { name: "time", color: theme.warning, bg: theme.warningLight };
    case "review": return { name: "star", color: theme.gold, bg: "#FEF3C7" };
    case "payment": return { name: "cash", color: theme.success, bg: theme.successLight };
    default: return { name: "notifications", color: theme.accent, bg: theme.accentLight };
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending": return { color: theme.warning, bg: theme.warningLight, label: "À confirmer" };
    case "confirmed": return { color: theme.success, bg: theme.successLight, label: "Confirmé" };
    case "ongoing": return { color: theme.accent, bg: theme.accentLight, label: "En cours" };
    default: return { color: theme.textMuted, bg: theme.card, label: status };
  }
};

// ============================================
// COMPOSANTS
// ============================================
const NotificationItem = ({ notification, compact = false, onPress }: {
  notification: typeof MOCK_NOTIFICATIONS[0];
  compact?: boolean;
  onPress: () => void;
}) => {
  const icon = getNotifIcon(notification.type);
  
  return (
    <Pressable style={[styles.notifItem, compact && styles.notifItemCompact]} onPress={onPress}>
      <View style={[styles.notifIconContainer, { backgroundColor: icon.bg }]}>  
        <Ionicons name={icon.name as any} size={18} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notification.read && styles.notifTitleUnread]}>
          {notification.title}
        </Text>
        <Text style={styles.notifSubtitle} numberOfLines={1}>{notification.subtitle}</Text>
      </View>
      {!compact && <Text style={styles.notifTime}>{notification.time}</Text>}
      {!notification.read && <View style={styles.notifUnreadDot} />}
    </Pressable>
  );
};

const AppointmentCard = ({ appointment, onPress }: { 
  appointment: typeof MOCK_UPCOMING[0];
  onPress: () => void;
}) => {
  const status = getStatusStyle(appointment.status);
  
  return (
    <Pressable style={styles.appointmentCard} onPress={onPress}>
      <View style={[styles.appointmentStatusBar, { backgroundColor: status.color }]} />
      <Image source={{ uri: appointment.image }} style={styles.appointmentAvatar} />
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentTime}>{appointment.time}</Text>
        <Text style={styles.appointmentClient}>{appointment.client}</Text>
        <Text style={styles.appointmentService}>{appointment.service}</Text>
      </View>
      <View style={styles.appointmentRight}>
        <Text style={styles.appointmentPrice}>{appointment.price}€</Text>
        <View style={[styles.appointmentStatus, { backgroundColor: status.bg }]}>
          <Text style={[styles.appointmentStatusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const StatCard = ({ value, label, icon }: { value: number | string; label: string; icon: string }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon as any} size={20} color={theme.accent} style={{ marginBottom: 8 }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ============================================
// MENU MODAL
// ============================================
const MenuModal = ({ visible, onClose, onItemPress, isOnline, onToggleOnline }: {
  visible: boolean;
  onClose: () => void;
  onItemPress: (route: string) => void;
  isOnline: boolean;
  onToggleOnline: (value: boolean) => void;
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleItemPress = (route: string) => {
    handleClose();
    setTimeout(() => onItemPress(route), 300);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.menuCard, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.menuContent}>
            <View style={styles.onlineToggleContainer}>
              <View style={styles.onlineToggleLeft}>
                <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? theme.success : theme.textMuted }]} />
                <View>
                  <Text style={styles.onlineToggleLabel}>{isOnline ? "En ligne" : "Hors ligne"}</Text>
                  <Text style={styles.onlineToggleSubtext}>
                    {isOnline ? "Visible par les clients" : "Invisible dans les recherches"}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={onToggleOnline}
                trackColor={{ false: theme.border, true: theme.successLight }}
                thumbColor={isOnline ? theme.success : theme.textMuted}
              />
            </View>

            {MENU_ITEMS.map((item, index) => (
              <Pressable key={index} style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]} onPress={() => handleItemPress(item.route)}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={22} color={theme.text} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// NOTIFICATIONS MODAL
// ============================================
const NotificationsModal = ({ visible, onClose, notifications, onNotifPress }: {
  visible: boolean;
  onClose: () => void;
  notifications: typeof MOCK_NOTIFICATIONS;
  onNotifPress: (id: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [activeFilter, setActiveFilter] = useState("all");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const filteredNotifs = activeFilter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  const todayNotifs = filteredNotifs.filter(n => !n.time.includes("Hier"));
  const yesterdayNotifs = filteredNotifs.filter(n => n.time.includes("Hier"));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.notifModalCard, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.notifModalHeader}>
              <Text style={styles.notifModalTitle}>Notifications</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
            {NOTIF_FILTERS.map((filter) => (
              <Pressable
                key={filter.key}
                style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                {filter.icon && <Ionicons name={filter.icon as any} size={16} color={activeFilter === filter.key ? theme.white : theme.textSecondary} />}
                <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView style={styles.notifModalScroll} showsVerticalScrollIndicator={false}>
            {todayNotifs.length > 0 && (
              <View style={styles.notifSection}>
                <Text style={styles.notifSectionTitle}>Aujourd'hui</Text>
                <View style={styles.notifList}>
                  {todayNotifs.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} onPress={() => onNotifPress(notif.id)} />
                  ))}
                </View>
              </View>
            )}

            {yesterdayNotifs.length > 0 && (
              <View style={styles.notifSection}>
                <Text style={styles.notifSectionTitle}>Hier</Text>
                <View style={styles.notifList}>
                  {yesterdayNotifs.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} onPress={() => onNotifPress(notif.id)} />
                  ))}
                </View>
              </View>
            )}

            {filteredNotifs.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.textMuted} />
                <Text style={styles.emptyStateText}>Aucune notification</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// APPOINTMENT DETAIL MODAL
// ============================================
const AppointmentDetailModal = ({ visible, onClose, appointment }: {
  visible: boolean;
  onClose: () => void;
  appointment: typeof MOCK_UPCOMING[0] | null;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!appointment) return null;

  const status = getStatusStyle(appointment.status);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.detailModalCard, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
          </View>

          <View style={styles.detailContent}>
            {/* Client Info */}
            <View style={styles.detailClientSection}>
              <Image source={{ uri: appointment.image }} style={styles.detailAvatar} />
              <Text style={styles.detailClientName}>{appointment.client}</Text>
              <View style={[styles.detailStatusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.detailStatusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailInfoSection}>
              <View style={styles.detailInfoRow}>
                <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>Aujourd'hui à {appointment.time}</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Ionicons name="cut-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>{appointment.service}</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Ionicons name="cash-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>{appointment.price}€</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.detailActions}>
              <Pressable style={styles.detailActionSecondary}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionSecondaryText}>Message</Text>
              </Pressable>
              <Pressable style={styles.detailActionSecondary}>
                <Ionicons name="call-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionSecondaryText}>Appeler</Text>
              </Pressable>
            </View>

            {appointment.status === "pending" && (
              <View style={styles.detailMainActions}>
                <Pressable style={styles.detailDeclineButton}>
                  <Text style={styles.detailDeclineText}>Refuser</Text>
                </Pressable>
                <Pressable style={styles.detailAcceptButton}>
                  <Text style={styles.detailAcceptText}>Accepter</Text>
                </Pressable>
              </View>
            )}

            {appointment.status === "confirmed" && (
              <Pressable style={styles.detailCancelButton}>
                <Text style={styles.detailCancelText}>Annuler le rendez-vous</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof MOCK_UPCOMING[0] | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "week" | "month" | "year">("day");

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
  const previewNotifs = MOCK_NOTIFICATIONS.slice(0, 2);
  const currentRevenue = MOCK_REVENUE[revenuePeriod];

  const handleToggleOnline = (value: boolean) => setIsOnline(value);

  const handleMenuItemPress = (route: string) => {
    switch (route) {
      case "switch": router.replace(ROUTES.CLIENT.SALON); break;
      case "settings": router.push(ROUTES.SHARED.SETTINGS.INDEX); break;
    }
  };

  const handleNotifPress = (id: string) => {
    console.log("Open notification:", id);
  };

  const handleAppointmentPress = (appointment: typeof MOCK_UPCOMING[0]) => {
    setSelectedAppointment(appointment);
  };

  const handleViewAgenda = () => {
    router.push(ROUTES.PRO.AGENDA);
  };

  const handleOpenMessages = () => {
    router.push(ROUTES.PRO.MESSAGES);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Image source={{ uri: MOCK_USER.image }} style={styles.profileImage} />
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.greeting}>Bonjour, {MOCK_USER.name}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.success : theme.textMuted }]} />
              <Text style={styles.statusText}>{isOnline ? "En ligne" : "Hors ligne"}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={theme.gold} />
                <Text style={styles.ratingText}>{MOCK_USER.rating}</Text>
              </View>
              <Text style={styles.reviewCount}>({MOCK_USER.reviewCount} avis)</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={handleOpenMessages}>
              <Ionicons name="chatbubbles-outline" size={22} color={theme.white} />
              {MOCK_MESSAGE_COUNT > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{MOCK_MESSAGE_COUNT}</Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={22} color={theme.white} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          {/* À Venir */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>À venir</Text>
              <Pressable onPress={handleViewAgenda}>
                <Text style={styles.seeAll}>Agenda</Text>
              </Pressable>
            </View>
            <View style={styles.appointmentsList}>
              {MOCK_UPCOMING.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} onPress={() => handleAppointmentPress(apt)} />
              ))}
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => setNotifModalVisible(true)}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </Pressable>
            </View>
            <View style={styles.notifPreviewList}>
              {previewNotifs.map((notif, index) => (
                <View key={notif.id}>
                  <NotificationItem notification={notif} compact onPress={() => handleNotifPress(notif.id)} />
                  {index < previewNotifs.length - 1 && <View style={styles.notifDivider} />}
                </View>
              ))}
            </View>
          </View>

          {/* Revenus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenus</Text>
            <View style={styles.revenuePeriodTabs}>
              {REVENUE_PERIODS.map((period) => (
                <Pressable
                  key={period.key}
                  style={[styles.periodTab, revenuePeriod === period.key && styles.periodTabActive]}
                  onPress={() => setRevenuePeriod(period.key as any)}
                >
                  <Text style={[styles.periodTabText, revenuePeriod === period.key && styles.periodTabTextActive]}>
                    {period.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueAmount}>{currentRevenue.amount} €</Text>
              <View style={styles.revenueVariation}>
                <Ionicons 
                  name={currentRevenue.variation >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={currentRevenue.variation >= 0 ? theme.success : theme.error} 
                />
                <Text style={[styles.revenueVariationText, { color: currentRevenue.variation >= 0 ? theme.success : theme.error }]}>
                  {currentRevenue.variation >= 0 ? "+" : ""}{currentRevenue.variation}%
                </Text>
                <Text style={styles.revenueVariationLabel}>vs période précédente</Text>
              </View>
            </View>
          </View>

          {/* Activité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité ce mois</Text>
            <View style={styles.statsRow}>
              <StatCard value={MOCK_ACTIVITY.prestations} label="Prestations" icon="cut-outline" />
              <StatCard value={MOCK_ACTIVITY.clients} label="Clients" icon="people-outline" />
              <StatCard value={MOCK_ACTIVITY.cancellations} label="Annulations" icon="close-circle-outline" />
            </View>
          </View>

        </ScrollView>
      </View>

      {/* Modals */}
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} onItemPress={handleMenuItemPress} isOnline={isOnline} onToggleOnline={handleToggleOnline} />
      <NotificationsModal visible={notifModalVisible} onClose={() => setNotifModalVisible(false)} notifications={MOCK_NOTIFICATIONS} onNotifPress={handleNotifPress} />
      <AppointmentDetailModal visible={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} appointment={selectedAppointment} />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },
  
  // Header
  header: { backgroundColor: theme.black, paddingHorizontal: 20, paddingBottom: 30 },
  headerContent: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  headerText: { flex: 1, marginLeft: 14 },
  headerNameRow: { flexDirection: "row", alignItems: "center" },
  greeting: { fontSize: 20, fontWeight: "bold", color: theme.white },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 6 },
  ratingText: { fontSize: 13, fontWeight: "600", color: theme.white },
  reviewCount: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  headerActions: { flexDirection: "row", gap: 12 },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 11, fontWeight: "bold", color: theme.white },

  // Content
  content: { flex: 1, backgroundColor: theme.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -10 },
  scrollView: { flex: 1, paddingTop: 24 },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  sectionBadge: { backgroundColor: theme.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionBadgeText: { fontSize: 12, fontWeight: "bold", color: theme.white },
  seeAll: { fontSize: 14, color: theme.accent, fontWeight: "500" },

  // Appointments
  appointmentsList: { gap: 10 },
  appointmentCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 14, padding: 12, gap: 12, overflow: "hidden" },
  appointmentStatusBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  appointmentAvatar: { width: 44, height: 44, borderRadius: 22, marginLeft: 4 },
  appointmentInfo: { flex: 1 },
  appointmentTime: { fontSize: 15, fontWeight: "bold", color: theme.text },
  appointmentClient: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  appointmentService: { fontSize: 13, color: theme.textMuted, marginTop: 1 },
  appointmentRight: { alignItems: "flex-end" },
  appointmentPrice: { fontSize: 16, fontWeight: "bold", color: theme.text, marginBottom: 4 },
  appointmentStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  appointmentStatusText: { fontSize: 11, fontWeight: "600" },

  // Notifications Preview
  notifPreviewList: { backgroundColor: theme.card, borderRadius: 16, overflow: "hidden" },
  notifItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  notifItemCompact: { paddingVertical: 12 },
  notifIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, color: theme.text },
  notifTitleUnread: { fontWeight: "600" },
  notifSubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  notifTime: { fontSize: 12, color: theme.textMuted },
  notifUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  notifDivider: { height: 1, backgroundColor: theme.border, marginLeft: 66 },

  // Revenue
  revenuePeriodTabs: { flexDirection: "row", backgroundColor: theme.card, borderRadius: 12, padding: 4, marginBottom: 14 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  periodTabActive: { backgroundColor: theme.white },
  periodTabText: { fontSize: 13, fontWeight: "500", color: theme.textMuted },
  periodTabTextActive: { color: theme.text, fontWeight: "600" },
  revenueCard: { backgroundColor: theme.card, borderRadius: 16, padding: 20, alignItems: "center" },
  revenueAmount: { fontSize: 36, fontWeight: "bold", color: theme.text },
  revenueVariation: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  revenueVariationText: { fontSize: 14, fontWeight: "600" },
  revenueVariationLabel: { fontSize: 13, color: theme.textMuted },

  // Stats
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: theme.text },
  statLabel: { fontSize: 12, color: theme.textMuted, marginTop: 4 },

  // Modal
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  menuCard: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  dragIndicatorContainer: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  menuContent: { paddingHorizontal: 20 },
  
  // Online Toggle
  onlineToggleContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  onlineToggleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  onlineIndicator: { width: 12, height: 12, borderRadius: 6 },
  onlineToggleLabel: { fontSize: 16, fontWeight: "600", color: theme.text },
  onlineToggleSubtext: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

  // Menu Items
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  menuItemLabel: { fontSize: 16, fontWeight: "500", color: theme.text },

  // Notifications Modal
  notifModalCard: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.85 },
  notifModalHeader: { paddingHorizontal: 20, marginBottom: 16 },
  notifModalTitle: { fontSize: 20, fontWeight: "bold", color: theme.text },
  filtersContainer: { marginBottom: 16 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterChipActive: { backgroundColor: theme.accent },
  filterChipText: { fontSize: 14, fontWeight: "500", color: theme.textSecondary },
  filterChipTextActive: { color: theme.white },
  notifModalScroll: { paddingHorizontal: 20 },
  notifSection: { marginBottom: 24 },
  notifSectionTitle: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  notifList: { backgroundColor: theme.card, borderRadius: 16, overflow: "hidden" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 16, color: theme.textMuted, marginTop: 12 },

  // Appointment Detail Modal
  detailModalCard: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailContent: { paddingHorizontal: 20 },
  detailClientSection: { alignItems: "center", marginBottom: 24 },
  detailAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  detailClientName: { fontSize: 22, fontWeight: "bold", color: theme.text, marginBottom: 8 },
  detailStatusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  detailStatusText: { fontSize: 14, fontWeight: "600" },
  detailInfoSection: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  detailInfoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  detailInfoText: { fontSize: 16, color: theme.text },
  detailActions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  detailActionSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.card, paddingVertical: 14, borderRadius: 14 },
  detailActionSecondaryText: { fontSize: 15, fontWeight: "600", color: theme.text },
  detailMainActions: { flexDirection: "row", gap: 12 },
  detailDeclineButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.errorLight },
  detailDeclineText: { fontSize: 16, fontWeight: "600", color: theme.error },
  detailAcceptButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.success },
  detailAcceptText: { fontSize: 16, fontWeight: "600", color: theme.white },
  detailCancelButton: { alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.errorLight },
  detailCancelText: { fontSize: 16, fontWeight: "600", color: theme.error },
});