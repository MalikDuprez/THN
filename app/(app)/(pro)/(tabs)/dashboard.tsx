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
  type CoiffeurStats,
} from "@/api/bookings";
import type { BookingWithDetails, CoiffeurWithDetails } from "@/types/database";
import { getUserAvatar } from "@/constants/images";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { BookingDetailModal } from "@/components/shared/BookingDetailModal";

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
  const clientImage = getUserAvatar(booking.client?.avatar_url, clientName);
  
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
      slideAnim.setValue(height);
      backdropAnim.setValue(0);
      
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
  const userImage = getUserAvatar(
    coiffeurProfile?.avatar_url || coiffeurProfile?.profile?.avatar_url, 
    userName
  );
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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
            <NotificationBell size={22} color={theme.white} />
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
                  <Text style={styles.pendingAlertSubtext}>Appuyez pour voir l'agenda</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </Pressable>
          )}

          {/* Revenus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenus</Text>
            <View style={styles.periodTabs}>
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
                {revenuePeriod === "day" && "Aujourd'hui"}
                {revenuePeriod === "week" && "Cette semaine"}
                {revenuePeriod === "month" && "Ce mois"}
              </Text>
            </View>
          </View>

          {/* RDV Aujourd'hui */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aujourd'hui</Text>
              <Pressable onPress={handleViewAgenda}>
                <Text style={styles.sectionLink}>Voir l'agenda</Text>
              </Pressable>
            </View>

            {todayBookings.length === 0 ? (
              <EmptyState message="Pas de rendez-vous aujourd'hui" />
            ) : (
              <View style={styles.appointmentsList}>
                {todayBookings.slice(0, 4).map((booking) => (
                  <AppointmentCard
                    key={booking.id}
                    booking={booking}
                    onPress={() => handleBookingPress(booking)}
                  />
                ))}
                {todayBookings.length > 4 && (
                  <Pressable style={styles.viewMoreButton} onPress={handleViewAgenda}>
                    <Text style={styles.viewMoreText}>
                      +{todayBookings.length - 4} autres rendez-vous
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.accent} />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Statistiques */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ce mois</Text>
            <View style={styles.statsRow}>
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
      <BookingDetailModal 
        visible={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking}
        viewMode="coiffeur"
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
    paddingBottom: 24 
  },
  headerContent: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  profileImage: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 12 
  },
  headerText: { 
    flex: 1 
  },
  headerNameRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
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
    gap: 6 
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
    gap: 2, 
    marginLeft: 8 
  },
  ratingText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: theme.gold 
  },
  reviewCount: { 
    fontSize: 12, 
    color: "rgba(255,255,255,0.5)" 
  },
  headerActions: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  headerButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: "rgba(255,255,255,0.1)", 
    alignItems: "center", 
    justifyContent: "center" 
  },

  // Content
  content: { 
    flex: 1, 
    backgroundColor: theme.white, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28 
  },
  scrollView: { 
    flex: 1, 
    paddingTop: 24, 
    paddingHorizontal: 20 
  },

  // Pending Alert
  pendingAlert: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    backgroundColor: theme.warningLight, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 24 
  },
  pendingAlertLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  pendingAlertIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: theme.white, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  pendingAlertTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: theme.text 
  },
  pendingAlertSubtext: { 
    fontSize: 13, 
    color: theme.textSecondary, 
    marginTop: 2 
  },

  // Sections
  section: { 
    marginBottom: 28 
  },
  sectionHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: theme.text, 
    marginBottom: 16 
  },
  sectionLink: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: theme.accent 
  },

  // Appointments
  appointmentsList: { 
    gap: 12 
  },
  appointmentCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: theme.card, 
    borderRadius: 14, 
    padding: 12, 
    gap: 12 
  },
  appointmentStatusBar: { 
    width: 4, 
    height: 40, 
    borderRadius: 2 
  },
  appointmentAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22 
  },
  appointmentInfo: { 
    flex: 1 
  },
  appointmentTime: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: theme.accent, 
    marginBottom: 2 
  },
  appointmentClient: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: theme.text 
  },
  appointmentService: { 
    fontSize: 13, 
    color: theme.textSecondary, 
    marginTop: 2 
  },
  appointmentRight: { 
    alignItems: "flex-end" 
  },
  appointmentPrice: { 
    fontSize: 15, 
    fontWeight: "bold", 
    color: theme.text, 
    marginBottom: 4 
  },
  appointmentStatus: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  appointmentStatusText: { 
    fontSize: 11, 
    fontWeight: "600" 
  },
  viewMoreButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 4, 
    paddingVertical: 12 
  },
  viewMoreText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: theme.accent 
  },

  // Empty State
  emptyState: { 
    alignItems: "center", 
    paddingVertical: 32, 
    backgroundColor: theme.card, 
    borderRadius: 16 
  },
  emptyStateText: { 
    fontSize: 15, 
    color: theme.textMuted, 
    marginTop: 12 
  },

  // Revenue
  periodTabs: { 
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
});