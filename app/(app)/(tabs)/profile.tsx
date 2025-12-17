// app/(app)/(tabs)/profile.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  Pressable, 
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef } from "react";
import { useRouter } from "expo-router";
import { useScrollContext } from "./_layout";
import { useAuthStore } from "@/stores/authStore";
import { useBookingStore } from "@/stores/bookingStore";
import { ROUTES } from "@/constants/routes";

// ============================================
// THEME - Style Premium (Header noir)
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  card: "#F8FAFC",
  text: "#000000",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  info: "#1976D2",
  infoLight: "#E3F2FD",
  error: "#E53935",
  errorLight: "#FFEBEE",
};

// Données mock pour les stats
const MOCK_STATS = {
  favorites: 12,
  appointments: 8,
  rating: 4.9,
};

const FAVORITES_MENU = [
  { 
    icon: "cut-outline", 
    label: "Coiffeurs favoris", 
    count: 5,
    route: ROUTES.SHARED.FAVORITES.COIFFEURS,
  },
  { 
    icon: "storefront-outline", 
    label: "Salons favoris", 
    count: 3,
    route: ROUTES.SHARED.FAVORITES.SALONS,
  },
  { 
    icon: "bookmark-outline", 
    label: "Inspirations sauvegardées", 
    count: 24,
    route: ROUTES.SHARED.FAVORITES.INSPIRATIONS,
  },
];

const ACCOUNT_MENU = [
  { 
    icon: "person-outline", 
    label: "Informations personnelles",
    route: ROUTES.SHARED.ACCOUNT.PERSONAL_INFO,
  },
  { 
    icon: "card-outline", 
    label: "Moyens de paiement",
    route: ROUTES.SHARED.ACCOUNT.PAYMENT_METHODS,
  },
  { 
    icon: "location-outline", 
    label: "Adresses enregistrées",
    route: ROUTES.SHARED.ACCOUNT.ADDRESSES,
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setIsScrolling } = useScrollContext();
  
  // Auth store
  const { user, signOut } = useAuthStore();
  
  // Booking store pour les stats
  const { bookings } = useBookingStore();
  const completedBookings = bookings.filter(b => b.status === "completed").length;
  
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const isGoingDown = currentY > lastScrollY.current;
    const isGoingUp = currentY < lastScrollY.current;
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    if (isGoingDown && currentY > 30) {
      setIsScrolling(true);
    } else if (isGoingUp) {
      setIsScrolling(false);
    }
    
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 800);
    lastScrollY.current = currentY;
  };

  const handleSignOut = () => {
    Alert.alert(
      "Se déconnecter",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace(ROUTES.AUTH.WELCOME);
          },
        },
      ]
    );
  };

  const handleOpenSettings = () => {
    router.push(ROUTES.SHARED.SETTINGS.INDEX);
  };

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const handleSwitchToPro = () => {
    router.replace(ROUTES.PRO.DASHBOARD);
  };

  // Vérifier si l'utilisateur est un professionnel
  const isProfessional = true;

  // Données utilisateur (mock si non connecté)
  const userName = user?.full_name || "Utilisateur";
  const userEmail = user?.email || "email@example.com";
  const userImage = user?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200";
  const memberYear = "2023";

  return (
    <View style={styles.container}>
      {/* HEADER NOIR AVEC PROFIL */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Top row - juste settings */}
        <View style={styles.headerTopRow}>
          <View style={{ width: 44 }} />
          <Pressable onPress={handleOpenSettings}>
            <Ionicons name="settings-outline" size={24} color={theme.white} />
          </Pressable>
        </View>

        {/* Photo + Infos */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: userImage }} style={styles.avatar} />
            <Pressable style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color={theme.white} />
            </Pressable>
          </View>
          
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.memberSince}>Membre depuis {memberYear}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{MOCK_STATS.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedBookings || MOCK_STATS.appointments}</Text>
            <Text style={styles.statLabel}>RDV</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.statValue}>{MOCK_STATS.rating}</Text>
            </View>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>
      </View>

      {/* CONTENU BLANC ARRONDI */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Switch to Pro */}
          {isProfessional && (
            <Pressable style={styles.switchCard} onPress={handleSwitchToPro}>
              <View style={styles.switchCardLeft}>
                <View style={styles.switchIconContainer}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.white} />
                </View>
                <View>
                  <Text style={styles.switchCardTitle}>Passer en mode Pro</Text>
                  <Text style={styles.switchCardSubtitle}>Gérer vos RDV et revenus</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </Pressable>
          )}

          {/* Mes Favoris Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Mes favoris</Text>
            <View style={styles.menuCard}>
              {FAVORITES_MENU.map((item, index) => (
                <Pressable 
                  key={index} 
                  style={[
                    styles.menuItem,
                    index < FAVORITES_MENU.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={20} color={theme.text} />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{item.count}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Mon Compte Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Mon compte</Text>
            <View style={styles.menuCard}>
              {ACCOUNT_MENU.map((item, index) => (
                <Pressable 
                  key={index} 
                  style={[
                    styles.menuItem,
                    index < ACCOUNT_MENU.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={20} color={theme.text} />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>
        </ScrollView>
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
  
  // Header noir avec profil
  header: {
    backgroundColor: theme.black,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  // Profile section dans le header
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.black,
    borderWidth: 2,
    borderColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },

  // Stats dans le header
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.white,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  
  // Content blanc arrondi
  content: {
    flex: 1,
    backgroundColor: theme.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollView: {
    flex: 1,
  },

  // Switch Card (Mode Pro)
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  switchCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.black,
    alignItems: "center",
    justifyContent: "center",
  },
  switchCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  switchCardSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },

  // Menu Sections
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textMuted,
    marginLeft: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    color: theme.text,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: theme.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textSecondary,
  },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.errorLight,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.error,
  },
});