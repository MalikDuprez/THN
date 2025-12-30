// app/(app)/(tabs)/activity.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  Pressable, 
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useScrollContext } from "./_layout";
import { ROUTES } from "@/constants/routes";
import { 
  getUpcomingBookings, 
  getPastBookings, 
  cancelBooking 
} from "@/api/bookings";
import type { BookingWithDetails } from "@/types/database";
import { formatPriceShort } from "@/types/database";

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
  border: "#E2E8F0",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  warning: "#F57C00",
  warningLight: "#FFF3E0",
  error: "#D32F2F",
  errorLight: "#FFEBEE",
  info: "#1976D2",
  infoLight: "#E3F2FD",
};

type TabType = "active" | "upcoming" | "past";

// ============================================
// HELPERS
// ============================================
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

const getBookingStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case "pending":
      return { label: "En attente", color: theme.warning, bgColor: theme.warningLight, icon: "time-outline" };
    case "confirmed":
      return { label: "Confirmé", color: theme.success, bgColor: theme.successLight, icon: "checkmark-circle-outline" };
    case "completed":
      return { label: "Terminé", color: theme.success, bgColor: theme.successLight, icon: "checkmark-done-outline" };
    case "cancelled":
      return { label: "Annulé", color: theme.error, bgColor: theme.errorLight, icon: "close-circle-outline" };
    case "no_show":
      return { label: "Absent", color: theme.error, bgColor: theme.errorLight, icon: "alert-circle-outline" };
    default:
      return { label: status, color: theme.textMuted, bgColor: theme.card, icon: "help-outline" };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { 
    weekday: "long", 
    day: "numeric", 
    month: "long" 
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
};

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { 
    day: "numeric", 
    month: "short",
    year: "numeric"
  });
};

// Vérifie si une réservation est "en cours" (aujourd'hui et dans les 2 prochaines heures)
const isActiveBooking = (booking: BookingWithDetails) => {
  const now = new Date();
  const bookingStart = new Date(booking.start_at);
  const bookingEnd = new Date(booking.end_at);
  
  // En cours si : déjà commencé mais pas terminé, OU commence dans moins de 2h
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return (
    (bookingStart <= now && bookingEnd >= now) || // En cours
    (bookingStart > now && bookingStart <= twoHoursFromNow) // Commence bientôt
  );
};

// ============================================
// COMPOSANTS
// ============================================

const StatusBadge = ({ label, color, bgColor }: { label: string; color: string; bgColor: string }) => (
  <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
    <Text style={[styles.statusText, { color }]}>{label}</Text>
  </View>
);

// Carte RDV En cours (style premium)
const ActiveBookingCard = ({ 
  booking, 
  onContact, 
  onCancel 
}: { 
  booking: BookingWithDetails; 
  onContact: () => void;
  onCancel: () => void;
}) => {
  const statusConfig = getBookingStatusConfig(booking.status as BookingStatus);
  const coiffeur = booking.coiffeur;
  const items = booking.items || [];
  const firstServiceName = items.length > 0 ? items[0].service_name : "Prestation";

  return (
    <View style={styles.activeCard}>
      <View style={styles.activeCardHeader}>
        <View style={styles.activeCardType}>
          <Ionicons name="cut" size={16} color={theme.text} />
          <Text style={styles.activeCardTypeText}>Rendez-vous</Text>
        </View>
        <StatusBadge {...statusConfig} />
      </View>
      
      <View style={styles.activeCardContent}>
        {coiffeur?.avatar_url ? (
          <Image source={{ uri: coiffeur.avatar_url }} style={styles.activeCoiffeurImage} />
        ) : (
          <View style={[styles.activeCoiffeurImage, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={theme.textMuted} />
          </View>
        )}
        <View style={styles.activeCardInfo}>
          <Text style={styles.activeCoiffeurName}>{coiffeur?.display_name || "Coiffeur"}</Text>
          <Text style={styles.activeServiceName}>
            {items.length > 1 
              ? `${firstServiceName} +${items.length - 1} autre${items.length > 2 ? "s" : ""}`
              : firstServiceName
            }
          </Text>
          <View style={styles.activeMetaRow}>
            <Ionicons 
              name={booking.location === "domicile" ? "home-outline" : "storefront-outline"} 
              size={14} 
              color={theme.textMuted} 
            />
            <Text style={styles.activeMetaText}>
              {booking.location === "domicile" ? "À domicile" : "En salon"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.activeTimeSection}>
        <View style={styles.activeTimeItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.info} />
          <Text style={styles.activeTimeText}>{formatDate(booking.start_at)}</Text>
        </View>
        <View style={styles.activeTimeItem}>
          <Ionicons name="time-outline" size={16} color={theme.info} />
          <Text style={styles.activeTimeText}>{formatTime(booking.start_at)}</Text>
        </View>
      </View>

      <View style={styles.activeCardActions}>
        <Pressable style={styles.activeActionBtn} onPress={onContact}>
          <Ionicons name="call-outline" size={18} color={theme.text} />
          <Text style={styles.activeActionText}>Contacter</Text>
        </Pressable>
        <Pressable style={[styles.activeActionBtn, styles.activeActionBtnDanger]} onPress={onCancel}>
          <Ionicons name="close-outline" size={18} color={theme.error} />
          <Text style={[styles.activeActionText, { color: theme.error }]}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
};

// Carte réservation à venir
const UpcomingBookingCard = ({ 
  booking, 
  onCancel,
  onPress,
}: { 
  booking: BookingWithDetails;
  onCancel: () => void;
  onPress: () => void;
}) => {
  const statusConfig = getBookingStatusConfig(booking.status as BookingStatus);
  const coiffeur = booking.coiffeur;
  const items = booking.items || [];
  const firstServiceName = items.length > 0 ? items[0].service_name : "Prestation";
  const totalDuration = booking.total_duration_minutes || 0;

  return (
    <Pressable style={styles.upcomingCard} onPress={onPress}>
      <View style={styles.upcomingContent}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingSalon}>
            {coiffeur?.display_name || "Coiffeur"}
          </Text>
          <StatusBadge {...statusConfig} />
        </View>
        
        <Text style={styles.upcomingService}>
          {items.length > 1 
            ? `${firstServiceName} +${items.length - 1} autre${items.length > 2 ? "s" : ""}`
            : firstServiceName
          }
        </Text>
        
        <View style={styles.upcomingMeta}>
          <View style={styles.upcomingMetaItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
            <Text style={styles.metaText}>{formatDate(booking.start_at)}</Text>
          </View>
          <View style={styles.upcomingMetaItem}>
            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
            <Text style={styles.metaText}>{formatTime(booking.start_at)}</Text>
          </View>
          <View style={styles.upcomingMetaItem}>
            <Ionicons name="hourglass-outline" size={14} color={theme.textMuted} />
            <Text style={styles.metaText}>{totalDuration} min</Text>
          </View>
        </View>

        <View style={styles.upcomingMeta}>
          <View style={styles.upcomingMetaItem}>
            <Ionicons 
              name={booking.location === "domicile" ? "home-outline" : "storefront-outline"} 
              size={14} 
              color={theme.textMuted} 
            />
            <Text style={styles.metaText}>
              {booking.location === "domicile" ? "À domicile" : "En salon"}
            </Text>
          </View>
        </View>

        <View style={styles.upcomingCoiffeur}>
          {coiffeur?.avatar_url ? (
            <Image source={{ uri: coiffeur.avatar_url }} style={styles.coiffeurAvatar} />
          ) : (
            <View style={[styles.coiffeurAvatar, styles.coiffeurAvatarPlaceholder]}>
              <Ionicons name="person" size={18} color={theme.textMuted} />
            </View>
          )}
          <View style={styles.coiffeurInfo}>
            <Text style={styles.coiffeurName}>{coiffeur?.display_name || "Coiffeur"}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>
                {Number(coiffeur?.rating || 0).toFixed(1)} ({coiffeur?.reviews_count || 0} avis)
              </Text>
            </View>
          </View>
          <Text style={styles.priceText}>{formatPriceShort(booking.total_cents)}</Text>
        </View>

        <View style={styles.upcomingActions}>
          <Pressable 
            style={[styles.actionBtn, styles.actionBtnOutline]} 
            onPress={onCancel}
          >
            <Text style={styles.actionBtnTextOutline}>Annuler</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onPress}>
            <Text style={styles.actionBtnText}>Voir détails</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

// Carte réservation passée
const PastBookingCard = ({ 
  booking,
  onRebook,
}: { 
  booking: BookingWithDetails;
  onRebook: () => void;
}) => {
  const statusConfig = getBookingStatusConfig(booking.status as BookingStatus);
  const coiffeur = booking.coiffeur;
  const items = booking.items || [];
  const firstServiceName = items.length > 0 ? items[0].service_name : "Prestation";
  const isCancelled = booking.status === "cancelled";

  return (
    <View style={[styles.pastCard, isCancelled && styles.pastCardCancelled]}>
      {coiffeur?.avatar_url ? (
        <Image source={{ uri: coiffeur.avatar_url }} style={styles.pastImage} />
      ) : (
        <View style={[styles.pastImage, styles.pastImagePlaceholder]}>
          <Ionicons name="cut" size={28} color={theme.textMuted} />
        </View>
      )}
      
      <View style={styles.pastContent}>
        <View style={styles.pastHeader}>
          <View style={styles.pastTypeIcon}>
            <Ionicons name="cut" size={10} color={theme.textSecondary} />
          </View>
          <StatusBadge {...statusConfig} />
        </View>
        
        <Text style={styles.pastTitle}>{firstServiceName}</Text>
        <Text style={styles.pastSubtitle}>{coiffeur?.display_name || "Coiffeur"}</Text>
        <Text style={styles.pastMeta}>
          {formatDateShort(booking.start_at)} • {formatPriceShort(booking.total_cents)}
        </Text>
        
        {!isCancelled && (
          <View style={styles.pastActions}>
            {!booking.client_has_reviewed && (
              <Pressable style={styles.rateBtn}>
                <Ionicons name="star-outline" size={14} color={theme.text} />
                <Text style={styles.rateBtnText}>Noter</Text>
              </Pressable>
            )}
            <Pressable style={styles.rebookBtn} onPress={onRebook}>
              <Ionicons name="refresh" size={14} color="#FFF" />
              <Text style={styles.rebookBtnText}>Réserver</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

// État vide
const EmptyState = ({ 
  icon, 
  title, 
  subtitle, 
  buttonText, 
  onPress 
}: { 
  icon: string; 
  title: string; 
  subtitle: string; 
  buttonText?: string; 
  onPress?: () => void;
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name={icon as any} size={48} color={theme.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
    {buttonText && onPress && (
      <Pressable style={styles.emptyButton} onPress={onPress}>
        <Text style={styles.emptyButtonText}>{buttonText}</Text>
      </Pressable>
    )}
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIsScrolling } = useScrollContext();
  
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const [upcoming, past] = await Promise.all([
        getUpcomingBookings(),
        getPastBookings(),
      ]);
      setUpcomingBookings(upcoming);
      setPastBookings(past);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, [loadBookings]);

  // Séparer les réservations "en cours" des "à venir"
  const activeBookings = upcomingBookings.filter(isActiveBooking);
  const futureBookings = upcomingBookings.filter(b => !isActiveBooking(b));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const isGoingDown = currentY > lastScrollY.current;
    const isGoingUp = currentY < lastScrollY.current;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    if (isGoingDown && currentY > 30) {
      setIsScrolling(true);
    } else if (isGoingUp) {
      setIsScrolling(false);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);

    lastScrollY.current = currentY;
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Annuler la réservation",
      "Êtes-vous sûr de vouloir annuler cette réservation ?",
      [
        { text: "Non", style: "cancel" },
        { 
          text: "Oui, annuler", 
          style: "destructive",
          onPress: async () => {
            const success = await cancelBooking(bookingId);
            if (success) {
              loadBookings();
            } else {
              Alert.alert("Erreur", "Impossible d'annuler la réservation");
            }
          }
        },
      ]
    );
  };

  const handleContact = (booking: BookingWithDetails) => {
    // TODO: Implémenter l'appel ou le chat
    Alert.alert("Contacter", `Appeler ${booking.coiffeur?.display_name || "le coiffeur"}`);
  };

  const handleRebook = (booking: BookingWithDetails) => {
    if (booking.coiffeur?.id) {
      router.push(ROUTES.SHARED.COIFFEUR(booking.coiffeur.id));
    }
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    if (booking.coiffeur?.id) {
      router.push(ROUTES.SHARED.COIFFEUR(booking.coiffeur.id));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Activité</Text>
        
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "active" && styles.tabActive]}
            onPress={() => setActiveTab("active")}
          >
            <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
              En cours
            </Text>
            {activeBookings.length > 0 && (
              <View style={[styles.tabBadge, styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeTextActive}>{activeBookings.length}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>
              À venir
            </Text>
            {futureBookings.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{futureBookings.length}</Text>
              </View>
            )}
          </Pressable>
          
          <Pressable
            style={[styles.tab, activeTab === "past" && styles.tabActive]}
            onPress={() => setActiveTab("past")}
          >
            <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>
              Historique
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.black} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Onglet En cours */}
            {activeTab === "active" && (
              <View style={styles.section}>
                {activeBookings.length === 0 ? (
                  <EmptyState
                    icon="cut-outline"
                    title="Aucun rendez-vous en cours"
                    subtitle="Vos rendez-vous imminents apparaîtront ici."
                    buttonText="Réserver"
                    onPress={() => router.push(ROUTES.CLIENT.HOME)}
                  />
                ) : (
                  activeBookings.map((booking) => (
                    <ActiveBookingCard
                      key={booking.id}
                      booking={booking}
                      onContact={() => handleContact(booking)}
                      onCancel={() => handleCancelBooking(booking.id)}
                    />
                  ))
                )}
              </View>
            )}

            {/* Onglet À venir */}
            {activeTab === "upcoming" && (
              <View style={styles.section}>
                {futureBookings.length === 0 ? (
                  <EmptyState
                    icon="calendar-outline"
                    title="Aucune réservation"
                    subtitle="Vous n'avez pas de réservation à venir. Trouvez votre prochain coiffeur !"
                    buttonText="Découvrir"
                    onPress={() => router.push(ROUTES.CLIENT.HOME)}
                  />
                ) : (
                  futureBookings.map((booking) => (
                    <UpcomingBookingCard
                      key={booking.id}
                      booking={booking}
                      onCancel={() => handleCancelBooking(booking.id)}
                      onPress={() => handleViewDetails(booking)}
                    />
                  ))
                )}
              </View>
            )}

            {/* Onglet Historique */}
            {activeTab === "past" && (
              <View style={styles.section}>
                {pastBookings.length === 0 ? (
                  <EmptyState
                    icon="time-outline"
                    title="Aucun historique"
                    subtitle="Vos réservations passées apparaîtront ici."
                  />
                ) : (
                  pastBookings.map((booking) => (
                    <PastBookingCard
                      key={booking.id}
                      booking={booking}
                      onRebook={() => handleRebook(booking)}
                    />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },
  header: {
    backgroundColor: theme.black,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.white,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  tabTextActive: {
    color: theme.white,
    fontWeight: "600",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: theme.success,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: theme.black,
  },
  tabBadgeTextActive: {
    fontSize: 11,
    fontWeight: "bold",
    color: theme.white,
  },
  content: {
    flex: 1,
    backgroundColor: theme.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Active Card (En cours)
  activeCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.info,
  },
  activeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  activeCardType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeCardTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
  activeCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  activeCoiffeurImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeCoiffeurName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.text,
  },
  activeServiceName: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  activeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  activeMetaText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  activeTimeSection: {
    flexDirection: "row",
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 14,
  },
  activeTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  activeCardActions: {
    flexDirection: "row",
    gap: 10,
  },
  activeActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeActionBtnDanger: {
    borderColor: theme.errorLight,
    backgroundColor: theme.errorLight,
  },
  activeActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },

  // Upcoming Card
  upcomingCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  upcomingContent: {
    padding: 16,
  },
  upcomingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  upcomingSalon: {
    fontSize: 17,
    fontWeight: "bold",
    color: theme.text,
  },
  upcomingService: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  upcomingMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 10,
  },
  upcomingMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  upcomingCoiffeur: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 14,
  },
  coiffeurAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  coiffeurAvatarPlaceholder: {
    backgroundColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  coiffeurInfo: {
    flex: 1,
    marginLeft: 10,
  },
  coiffeurName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
  },
  upcomingActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.black,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  actionBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionBtnTextOutline: {
    color: theme.text,
    fontWeight: "600",
    fontSize: 14,
  },

  // Past Card
  pastCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  pastCardCancelled: {
    opacity: 0.6,
  },
  pastImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  pastImagePlaceholder: {
    backgroundColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pastContent: {
    flex: 1,
    marginLeft: 12,
  },
  pastHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pastTypeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pastTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  pastSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pastMeta: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
  pastActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.text,
  },
  rebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.black,
  },
  rebookBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFF",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: theme.black,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
});