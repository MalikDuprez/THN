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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useScrollContext } from "./_layout";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/constants/routes";
import { isCurrentUserCoiffeur } from "@/api/coiffeurs";
import { getUserAvatar } from "@/constants/images";

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
  info: "#1976D2",
  infoLight: "#E3F2FD",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  error: "#E53935",
  errorLight: "#FFEBEE",
};

// ============================================
// HELPER
// ============================================
const formatMemberSince = (dateString: string | null): string => {
  if (!dateString) return "Nouveau membre";
  const date = new Date(dateString);
  const month = date.toLocaleDateString("fr-FR", { month: "long" });
  const year = date.getFullYear();
  return `Membre depuis ${month} ${year}`;
};

// ============================================
// TYPES
// ============================================
interface FavoriteCounts {
  coiffeurs: number;
  salons: number;
  inspirations: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setIsScrolling } = useScrollContext();

  const { user, signOut } = useAuthStore();

  const [favoriteCounts, setFavoriteCounts] = useState<FavoriteCounts>({
    coiffeurs: 0,
    salons: 0,
    inspirations: 0,
  });
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  
  // État pour vérifier si l'utilisateur est coiffeur
  const [isCoiffeur, setIsCoiffeur] = useState<boolean | null>(null);
  const [checkingCoiffeur, setCheckingCoiffeur] = useState(true);

  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vérifier si l'utilisateur est coiffeur
  useEffect(() => {
    const checkIfCoiffeur = async () => {
      setCheckingCoiffeur(true);
      const result = await isCurrentUserCoiffeur();
      setIsCoiffeur(result);
      setCheckingCoiffeur(false);
    };

    if (user?.id) {
      checkIfCoiffeur();
    } else {
      setIsCoiffeur(false);
      setCheckingCoiffeur(false);
    }
  }, [user?.id]);

  // Fonction pour charger les compteurs de favoris
  const fetchFavoriteCounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      // ✅ Utilise favorite_type (pas target_type)
      const { count: coiffeursCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("favorite_type", "coiffeur");

      const { count: salonsCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("favorite_type", "salon");

      const { count: inspirationsCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("favorite_type", "inspiration");

      setFavoriteCounts({
        coiffeurs: coiffeursCount || 0,
        salons: salonsCount || 0,
        inspirations: inspirationsCount || 0,
      });
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user?.id]);

  // Charger au montage
  useEffect(() => {
    fetchFavoriteCounts();
  }, [fetchFavoriteCounts]);

  // ✅ Recharger quand on revient sur la page (après ajout/suppression favori)
  useFocusEffect(
    useCallback(() => {
      fetchFavoriteCounts();
    }, [fetchFavoriteCounts])
  );

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

  const handleBecomePro = () => {
    // TODO: Naviguer vers le formulaire d'inscription coiffeur
    Alert.alert(
      "Devenir coiffeur",
      "Cette fonctionnalité sera bientôt disponible. Vous pourrez créer votre profil professionnel et commencer à recevoir des réservations.",
      [{ text: "OK" }]
    );
  };

  // Données utilisateur
  const userName = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Utilisateur";
  const userEmail = user?.email || "";
  const userImage = getUserAvatar(user?.avatar_url, user?.full_name || user?.first_name);
  const memberSince = formatMemberSince(user?.created_at || null);

  const totalFavorites = favoriteCounts.coiffeurs + favoriteCounts.salons + favoriteCounts.inspirations;
  const userRating = user?.rating_as_client || 0;

  const FAVORITES_MENU = [
    {
      icon: "cut-outline",
      label: "Coiffeurs favoris",
      count: favoriteCounts.coiffeurs,
      route: ROUTES.SHARED.FAVORITES.COIFFEURS,
    },
    {
      icon: "storefront-outline",
      label: "Salons favoris",
      count: favoriteCounts.salons,
      route: ROUTES.SHARED.FAVORITES.SALONS,
    },
    {
      icon: "bookmark-outline",
      label: "Inspirations sauvegardées",
      count: favoriteCounts.inspirations,
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 44 }} />
          <Pressable onPress={handleOpenSettings}>
            <Ionicons name="settings-outline" size={24} color={theme.white} />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: userImage }} style={styles.avatar} />
            <Pressable style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color={theme.white} />
            </Pressable>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.memberSince}>{memberSince}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalFavorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              {userRating > 0 ? (
                <>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.statValue}>{userRating.toFixed(1)}</Text>
                </>
              ) : (
                <Text style={styles.statValue}>-</Text>
              )}
            </View>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>
      </View>

      {/* CONTENU */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Switch / Devenir Pro */}
          {checkingCoiffeur ? (
            <View style={styles.switchCardLoading}>
              <ActivityIndicator size="small" color={theme.textMuted} />
            </View>
          ) : isCoiffeur ? (
            // Utilisateur EST coiffeur → Afficher "Passer en mode Pro"
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
          ) : (
            // Utilisateur N'EST PAS coiffeur → Afficher "Devenir coiffeur"
            <Pressable style={styles.becomeProCard} onPress={handleBecomePro}>
              <View style={styles.switchCardLeft}>
                <View style={styles.becomeProIconContainer}>
                  <Ionicons name="sparkles" size={20} color={theme.white} />
                </View>
                <View>
                  <Text style={styles.switchCardTitle}>Devenir coiffeur</Text>
                  <Text style={styles.switchCardSubtitle}>Créez votre profil professionnel</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </Pressable>
          )}

          {/* Mes Favoris */}
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

          {/* Mon Compte */}
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

          {/* Logout */}
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
  switchCardLoading: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
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

  // Become Pro Card
  becomeProCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.successLight,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.success,
  },
  becomeProIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.success,
    alignItems: "center",
    justifyContent: "center",
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