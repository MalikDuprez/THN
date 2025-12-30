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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { ROUTES } from "@/constants/routes";
import { getMyCoiffeurProfile, updateCoiffeurOnlineStatus } from "@/api/coiffeurs";
import { 
  getCoiffeurTodayBookings, 
  getCoiffeurStats,
  acceptBooking,
  declineBooking,
  completeBooking,
  type CoiffeurStats,
} from "@/api/bookings";
import type { BookingWithDetails, CoiffeurWithDetails } from "@/types/database";
import { NotificationBell } from "@/components/shared/NotificationBell";

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
// MENU ITEMS
// ============================================
const MENU_ITEMS = [
  { icon: "swap-horizontal", label: "Passer en mode Client", route: "switch" },
  { icon: "settings-outline", label: "Paramètres", route: "settings" },
];

const REVENUE_PERIODS = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

// ============================================
// HELPERS
// ============================================
const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending": return { color: theme.warning, bg: theme.warningLight, label: "À confirmer" };
    case "confirmed": return { color: theme.success, bg: theme.successLight, label: "Confirmé" };
    case "completed": return { color: theme.accent, bg: theme.accentLight, label: "Terminé" };
    default: return { color: theme.textMuted, bg: theme.card, label: status };
  }
};

const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const formatPrice = (cents: number): string => {
  return `${(cents / 100).toFixed(0)}€`;
};

// ============================================
// COMPOSANTS
// ============================================
const AppointmentCard = ({ booking, onPress }: {
  booking: BookingWithDetails;
  onPress: () => void;
}) => {
  const status = getStatusStyle(booking.status);
  const clientName = booking.client?.full_name || 
    `${booking.client?.first_name || ""} ${booking.client?.last_name || ""}`.trim() || 
    "Client";
  const clientImage = booking.client?.avatar_url || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";
  
  // Récupérer le premier service ou résumer
  const services = booking.items || [];
  const mainService = services.length > 0 ? services[0].service_name : "Prestation";
  const serviceText = services.length > 1 
    ? `${mainService} +${services.length - 1}` 
    : mainService;

  return (
    <Pressable style={styles.appointmentCard} onPress={onPress}>
      <View style={[styles.appointmentStatusBar, { backgroundColor: status.color }]} />
      <Image source={{ uri: clientImage }} style={styles.appointmentAvatar} />
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentTime}>{formatTime(booking.start_at)}</Text>
        <Text style={styles.appointmentClient}>{clientName}</Text>
        <Text style={styles.appointmentService} numberOfLines={1}>{serviceText}</Text>
      </View>
      <View style={styles.appointmentRight}>
        <Text style={styles.appointmentPrice}>{formatPrice(booking.total_cents)}</Text>
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

const EmptyState = ({ message }: { message: string }) => (
  <View style={styles.emptyState}>
    <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
    <Text style={styles.emptyStateText}>{message}</Text>
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
// APPOINTMENT DETAIL MODAL
// ============================================
const AppointmentDetailModal = ({ visible, onClose, booking, onAction }: {
  visible: boolean;
  onClose: () => void;
  booking: BookingWithDetails | null;
  onAction: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

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

  const handleAccept = async () => {
    if (!booking) return;
    setLoading(true);
    const success = await acceptBooking(booking.id);
    setLoading(false);
    if (success) {
      Alert.alert("Succès", "Réservation confirmée !");
      handleClose();
      onAction();
    } else {
      Alert.alert("Erreur", "Impossible de confirmer la réservation");
    }
  };

  const handleDecline = async () => {
    if (!booking) return;
    
    Alert.alert(
      "Refuser la réservation",
      "Êtes-vous sûr de vouloir refuser cette réservation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await declineBooking(booking.id, "Refusé par le coiffeur");
            setLoading(false);
            if (success) {
              Alert.alert("Succès", "Réservation refusée");
              handleClose();
              onAction();
            } else {
              Alert.alert("Erreur", "Impossible de refuser la réservation");
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!booking) return;
    setLoading(true);
    const success = await completeBooking(booking.id);
    setLoading(false);
    if (success) {
      Alert.alert("Succès", "Prestation terminée !");
      handleClose();
      onAction();
    } else {
      Alert.alert("Erreur", "Impossible de terminer la prestation");
    }
  };

  if (!booking) return null;

  const status = getStatusStyle(booking.status);
  const clientName = booking.client?.full_name || 
    `${booking.client?.first_name || ""} ${booking.client?.last_name || ""}`.trim() || 
    "Client";
  const clientImage = booking.client?.avatar_url || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";
  
  const services = booking.items || [];

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
              <Image source={{ uri: clientImage }} style={styles.detailAvatar} />
              <Text style={styles.detailClientName}>{clientName}</Text>
              <View style={[styles.detailStatusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.detailStatusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailInfoSection}>
              <View style={styles.detailInfoRow}>
                <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>
                  {formatTime(booking.start_at)} - {formatTime(booking.end_at)} ({booking.total_duration_minutes} min)
                </Text>
              </View>
              
              {services.map((service, index) => (
                <View key={index} style={styles.detailInfoRow}>
                  <Ionicons name="cut-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailInfoText}>{service.service_name}</Text>
                  <Text style={styles.detailInfoPrice}>{formatPrice(service.price_cents)}</Text>
                </View>
              ))}
              
              <View style={[styles.detailInfoRow, styles.detailTotalRow]}>
                <Ionicons name="cash-outline" size={20} color={theme.text} />
                <Text style={styles.detailTotalLabel}>Total</Text>
                <Text style={styles.detailTotalPrice}>{formatPrice(booking.total_cents)}</Text>
              </View>

              {booking.location === "domicile" && (
                <View style={styles.detailInfoRow}>
                  <Ionicons name="home-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailInfoText}>À domicile</Text>
                </View>
              )}

              {booking.client_notes && (
                <View style={styles.detailInfoRow}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailInfoText} numberOfLines={2}>{booking.client_notes}</Text>
                </View>
              )}
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

            {loading ? (
              <ActivityIndicator size="large" color={theme.accent} style={{ marginVertical: 20 }} />
            ) : (
              <>
                {booking.status === "pending" && (
                  <View style={styles.detailMainActions}>
                    <Pressable style={styles.detailDeclineButton} onPress={handleDecline}>
                      <Text style={styles.detailDeclineText}>Refuser</Text>
                    </Pressable>
                    <Pressable style={styles.detailAcceptButton} onPress={handleAccept}>
                      <Text style={styles.detailAcceptText}>Accepter</Text>
                    </Pressable>
                  </View>
                )}

                {booking.status === "confirmed" && (
                  <Pressable style={styles.detailCompleteButton} onPress={handleComplete}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.white} />
                    <Text style={styles.detailCompleteText}>Marquer comme terminé</Text>
                  </Pressable>
                )}
              </>
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
  
  // États
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "week" | "month">("day");
  
  // Données
  const [coiffeurProfile, setCoiffeurProfile] = useState<CoiffeurWithDetails | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingWithDetails[]>([]);
  const [stats, setStats] = useState<CoiffeurStats | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      const [profile, bookings, statsData] = await Promise.all([
        getMyCoiffeurProfile(),
        getCoiffeurTodayBookings(),
        getCoiffeurStats(),
      ]);
      
      setCoiffeurProfile(profile);
      setTodayBookings(bookings);
      setStats(statsData);
      setIsOnline(profile?.is_available ?? true);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    const success = await updateCoiffeurOnlineStatus(value);
    if (!success) {
      // Rollback si échec
      setIsOnline(!value);
      Alert.alert("Erreur", "Impossible de mettre à jour votre statut");
    }
  };

  const handleMenuItemPress = (route: string) => {
    switch (route) {
      case "switch": 
        router.replace(ROUTES.CLIENT.HOME); 
        break;
      case "settings": 
        router.push(ROUTES.SHARED.SETTINGS.INDEX); 
        break;
    }
  };

  const handleBookingPress = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
  };

  const handleViewAgenda = () => {
    router.push(ROUTES.PRO.AGENDA);
  };

  const handleOpenMessages = () => {
    router.push(ROUTES.PRO.MESSAGES);
  };

  // Données du profil
  const userName = coiffeurProfile?.display_name || 
    coiffeurProfile?.profile?.full_name || 
    coiffeurProfile?.profile?.first_name || 
    "Pro";
  const userImage = coiffeurProfile?.avatar_url || 
    coiffeurProfile?.profile?.avatar_url || 
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200";
  const rating = coiffeurProfile?.rating || 0;
  const reviewCount = coiffeurProfile?.reviews_count || 0;

  // Revenus selon la période
  const currentRevenue = stats ? {
    day: stats.todayRevenue,
    week: stats.weekRevenue,
    month: stats.monthRevenue,
  }[revenuePeriod] : 0;

  // Nombre de RDV en attente
  const pendingCount = stats?.pendingBookings || 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.white} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <Image source={{ uri: userImage }} style={styles.profileImage} />
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.greeting}>Bonjour, {userName}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.success : theme.textMuted }]} />
              <Text style={styles.statusText}>{isOnline ? "En ligne" : "Hors ligne"}</Text>
              {rating > 0 && (
                <>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color={theme.gold} />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.reviewCount}>({reviewCount} avis)</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerButton}>
              <NotificationBell size={22} color={theme.white} />
            </View>
            <Pressable style={styles.headerButton} onPress={handleOpenMessages}>
              <Ionicons name="chatbubbles-outline" size={22} color={theme.white} />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={22} color={theme.white} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={{ paddingBottom: 120 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Alerte RDV en attente */}
          {pendingCount > 0 && (
            <Pressable style={styles.pendingAlert} onPress={handleViewAgenda}>
              <View style={styles.pendingAlertLeft}>
                <View style={styles.pendingAlertIcon}>
                  <Ionicons name="time" size={20} color={theme.warning} />
                </View>
                <View>
                  <Text style={styles.pendingAlertTitle}>
                    {pendingCount} réservation{pendingCount > 1 ? "s" : ""} en attente
                  </Text>
                  <Text style={styles.pendingAlertSubtitle}>À confirmer</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </Pressable>
          )}

          {/* À Venir aujourd'hui */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aujourd'hui</Text>
              <Pressable onPress={handleViewAgenda}>
                <Text style={styles.seeAll}>Agenda</Text>
              </Pressable>
            </View>
            
            {todayBookings.length > 0 ? (
              <View style={styles.appointmentsList}>
                {todayBookings.map((booking) => (
                  <AppointmentCard 
                    key={booking.id} 
                    booking={booking} 
                    onPress={() => handleBookingPress(booking)} 
                  />
                ))}
              </View>
            ) : (
              <EmptyState message="Aucun rendez-vous aujourd'hui" />
            )}
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
              <Text style={styles.revenueAmount}>{formatPrice(currentRevenue)}</Text>
              <Text style={styles.revenueSubtext}>
                {revenuePeriod === "day" && "Revenus du jour"}
                {revenuePeriod === "week" && "Revenus de la semaine"}
                {revenuePeriod === "month" && "Revenus du mois"}
              </Text>
            </View>
          </View>

          {/* Activité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsRow}>
              <StatCard 
                value={stats?.todayBookings || 0} 
                label="RDV aujourd'hui" 
                icon="calendar-outline" 
              />
              <StatCard 
                value={stats?.totalClients || 0} 
                label="Clients" 
                icon="people-outline" 
              />
              <StatCard 
                value={stats?.completedBookings || 0} 
                label="Prestations" 
                icon="checkmark-circle-outline" 
              />
            </View>
          </View>

        </ScrollView>
      </View>

      {/* Modals */}
      <MenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onItemPress={handleMenuItemPress} 
        isOnline={isOnline} 
        onToggleOnline={handleToggleOnline} 
      />
      <AppointmentDetailModal 
        visible={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking}
        onAction={loadData}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.black 
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.white,
    marginTop: 16,
    fontSize: 16,
  },

  // Header
  header: { 
    backgroundColor: theme.black, 
    paddingHorizontal: 20, 
    paddingBottom: 30 
  },
  headerContent: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  profileImage: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    borderWidth: 2, 
    borderColor: "rgba(255,255,255,0.2)" 
  },
  headerText: { 
    flex: 1, 
    marginLeft: 14 
  },
  headerNameRow: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  greeting: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: theme.white 
  },
  statusRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 4, 
    gap: 4 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  statusText: { 
    fontSize: 13, 
    color: "rgba(255,255,255,0.7)" 
  },
  ratingContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 3, 
    marginLeft: 6 
  },
  ratingText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: theme.white 
  },
  reviewCount: { 
    fontSize: 13, 
    color: "rgba(255,255,255,0.5)" 
  },
  headerActions: { 
    flexDirection: "row", 
    gap: 12 
  },
  headerButton: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center" 
  },

  // Content
  content: { 
    flex: 1, 
    backgroundColor: theme.white, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    marginTop: -10 
  },
  scrollView: { 
    flex: 1, 
    paddingTop: 24 
  },

  // Pending Alert
  pendingAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.warningLight,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.warning,
  },
  pendingAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingAlertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingAlertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  pendingAlertSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Section
  section: { 
    paddingHorizontal: 20, 
    marginBottom: 24 
  },
  sectionHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 14 
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: "600", 
    color: theme.text 
  },
  seeAll: { 
    fontSize: 14, 
    color: theme.accent, 
    fontWeight: "500" 
  },

  // Appointments
  appointmentsList: { 
    gap: 10 
  },
  appointmentCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: theme.card, 
    borderRadius: 14, 
    padding: 12, 
    gap: 12, 
    overflow: "hidden" 
  },
  appointmentStatusBar: { 
    position: "absolute", 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: 4, 
    borderTopLeftRadius: 14, 
    borderBottomLeftRadius: 14 
  },
  appointmentAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    marginLeft: 4 
  },
  appointmentInfo: { 
    flex: 1 
  },
  appointmentTime: { 
    fontSize: 15, 
    fontWeight: "bold", 
    color: theme.text 
  },
  appointmentClient: { 
    fontSize: 14, 
    color: theme.textSecondary, 
    marginTop: 2 
  },
  appointmentService: { 
    fontSize: 13, 
    color: theme.textMuted, 
    marginTop: 1 
  },
  appointmentRight: { 
    alignItems: "flex-end" 
  },
  appointmentPrice: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: theme.text, 
    marginBottom: 4 
  },
  appointmentStatus: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  appointmentStatusText: { 
    fontSize: 11, 
    fontWeight: "600" 
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: theme.card,
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
  },

  // Revenue
  revenuePeriodTabs: { 
    flexDirection: "row", 
    backgroundColor: theme.card, 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 14 
  },
  periodTab: { 
    flex: 1, 
    paddingVertical: 8, 
    alignItems: "center", 
    borderRadius: 8 
  },
  periodTabActive: { 
    backgroundColor: theme.white 
  },
  periodTabText: { 
    fontSize: 13, 
    fontWeight: "500", 
    color: theme.textMuted 
  },
  periodTabTextActive: { 
    color: theme.text, 
    fontWeight: "600" 
  },
  revenueCard: { 
    backgroundColor: theme.card, 
    borderRadius: 16, 
    padding: 20, 
    alignItems: "center" 
  },
  revenueAmount: { 
    fontSize: 36, 
    fontWeight: "bold", 
    color: theme.text 
  },
  revenueSubtext: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },

  // Stats
  statsRow: { 
    flexDirection: "row", 
    gap: 12 
  },
  statCard: { 
    flex: 1, 
    backgroundColor: theme.card, 
    borderRadius: 14, 
    padding: 14, 
    alignItems: "center" 
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: theme.text 
  },
  statLabel: { 
    fontSize: 12, 
    color: theme.textMuted, 
    marginTop: 4,
    textAlign: "center",
  },

  // Modal
  modalContainer: { 
    flex: 1, 
    justifyContent: "flex-end" 
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  menuCard: { 
    backgroundColor: theme.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24 
  },
  dragIndicatorContainer: { 
    alignItems: "center", 
    paddingVertical: 12 
  },
  dragIndicator: { 
    width: 40, 
    height: 4, 
    backgroundColor: theme.border, 
    borderRadius: 2 
  },
  menuContent: { 
    paddingHorizontal: 20 
  },

  // Online Toggle
  onlineToggleContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    backgroundColor: theme.card, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20 
  },
  onlineToggleLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    flex: 1 
  },
  onlineIndicator: { 
    width: 12, 
    height: 12, 
    borderRadius: 6 
  },
  onlineToggleLabel: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: theme.text 
  },
  onlineToggleSubtext: { 
    fontSize: 12, 
    color: theme.textMuted, 
    marginTop: 2 
  },

  // Menu Items
  menuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 16 
  },
  menuItemBorder: { 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  menuItemLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 14 
  },
  menuIconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: theme.card, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  menuItemLabel: { 
    fontSize: 16, 
    fontWeight: "500", 
    color: theme.text 
  },

  // Appointment Detail Modal
  detailModalCard: { 
    backgroundColor: theme.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24 
  },
  detailContent: { 
    paddingHorizontal: 20 
  },
  detailClientSection: { 
    alignItems: "center", 
    marginBottom: 24 
  },
  detailAvatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 12 
  },
  detailClientName: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: theme.text, 
    marginBottom: 8 
  },
  detailStatusBadge: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  detailStatusText: { 
    fontSize: 14, 
    fontWeight: "600" 
  },
  detailInfoSection: { 
    backgroundColor: theme.card, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20 
  },
  detailInfoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    paddingVertical: 8 
  },
  detailInfoText: { 
    fontSize: 16, 
    color: theme.text,
    flex: 1,
  },
  detailInfoPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  detailTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 8,
    paddingTop: 12,
  },
  detailTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    flex: 1,
  },
  detailTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
  },
  detailActions: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 16 
  },
  detailActionSecondary: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    backgroundColor: theme.card, 
    paddingVertical: 14, 
    borderRadius: 14 
  },
  detailActionSecondaryText: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: theme.text 
  },
  detailMainActions: { 
    flexDirection: "row", 
    gap: 12 
  },
  detailDeclineButton: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 16, 
    borderRadius: 14, 
    backgroundColor: theme.errorLight 
  },
  detailDeclineText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: theme.error 
  },
  detailAcceptButton: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 16, 
    borderRadius: 14, 
    backgroundColor: theme.success 
  },
  detailAcceptText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: theme.white 
  },
  detailCompleteButton: { 
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16, 
    borderRadius: 14, 
    backgroundColor: theme.accent 
  },
  detailCompleteText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: theme.white 
  },
});