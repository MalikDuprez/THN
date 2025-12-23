// app/(app)/(shared)/coiffeur/[id].tsx
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { getCoiffeurById, getServicesByLocation } from "@/api/coiffeurs";
import type { CoiffeurWithDetails, Service } from "@/types/database";
import { formatPriceShort } from "@/types/database";
import BookingModal from "@/components/shared/BookingModal";

const { width } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
};

export default function CoiffeurProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [coiffeur, setCoiffeur] = useState<CoiffeurWithDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    async function loadCoiffeur() {
      if (!id) return;
      setIsLoading(true);
      
      const [coiffeurData, servicesData] = await Promise.all([
        getCoiffeurById(id),
        getServicesByLocation(id, "salon"), // Charge tous les services
      ]);
      
      setCoiffeur(coiffeurData);
      setServices(servicesData);
      setIsLoading(false);
    }
    loadCoiffeur();
  }, [id]);

  const handleBook = () => {
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    // La modale gère déjà la redirection
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!coiffeur) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
        <Text style={styles.errorText}>Coiffeur non trouvé</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = coiffeur.display_name || "Coiffeur";
  const photos = coiffeur.portfolio_urls || [];
  const offersHome = coiffeur.offers_home_service;
  const homeFee = coiffeur.home_service_fee_cents || 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{displayName}</Text>
        <Pressable
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#E53935" : theme.text}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            {coiffeur.avatar_url ? (
              <Image source={{ uri: coiffeur.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={32} color={theme.textMuted} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileHandle}>
                @{displayName.toLowerCase().replace(/\s/g, "")}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{photos.length}</Text> posts
                </Text>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{coiffeur.reviews_count || 0}</Text> avis
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>{Number(coiffeur.rating).toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({coiffeur.reviews_count || 0} avis)</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={theme.textMuted} />
              <Text style={styles.locationText}>{coiffeur.city || "Non renseigné"}</Text>
            </View>
          </View>

          <Text style={styles.bio}>
            {coiffeur.bio || coiffeur.specialty || "Coiffeur professionnel passionné."}
          </Text>

          {/* Badges services disponibles */}
          <View style={styles.serviceBadges}>
            <View style={styles.serviceBadge}>
              <Ionicons name="storefront" size={14} color={theme.textSecondary} />
              <Text style={styles.serviceBadgeText}>En salon</Text>
            </View>
            {offersHome && (
              <View style={styles.serviceBadge}>
                <Ionicons name="home" size={14} color={theme.textSecondary} />
                <Text style={styles.serviceBadgeText}>À domicile (+{formatPriceShort(homeFee)})</Text>
              </View>
            )}
          </View>
        </View>

        {/* Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prestations ({services.length})</Text>
            <View style={styles.servicesPreview}>
              {services.slice(0, 4).map((service) => (
                <View key={service.id} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceItemName}>{service.name}</Text>
                    <Text style={styles.serviceItemDuration}>{service.duration_minutes} min</Text>
                  </View>
                  <Text style={styles.serviceItemPrice}>{formatPriceShort(service.price_cents)}</Text>
                </View>
              ))}
              {services.length > 4 && (
                <Text style={styles.moreServices}>+{services.length - 4} autres prestations</Text>
              )}
            </View>
          </View>
        )}

        {/* Réalisations */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Réalisations</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photoItem}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomServicesCount}>{services.length} prestations</Text>
          <Text style={styles.bottomAvailability}>Disponible 24h/24</Text>
        </View>
        <Pressable onPress={handleBook} style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Réserver</Text>
        </Pressable>
      </View>

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        coiffeur={coiffeur}
        services={services}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 15, color: theme.textMuted },
  errorText: { marginTop: 16, fontSize: 16, color: theme.textSecondary },
  backBtn: { marginTop: 16, backgroundColor: theme.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: "#FFF", fontWeight: "600" },
  
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: theme.background },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  favoriteButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  
  scrollView: { flex: 1 },
  
  profileSection: { padding: 20 },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 22, fontWeight: "bold", color: theme.text },
  profileHandle: { fontSize: 14, color: theme.textMuted, marginTop: 2 },
  statsRow: { flexDirection: "row", marginTop: 8, gap: 16 },
  statText: { fontSize: 14, color: theme.textMuted },
  statNumber: { fontWeight: "600", color: theme.text },
  
  metaSection: { marginTop: 16, gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 15, fontWeight: "bold", color: theme.text },
  reviewsText: { fontSize: 14, color: theme.textMuted },
  locationText: { fontSize: 14, color: theme.textMuted },
  
  bio: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginTop: 16 },
  
  serviceBadges: { flexDirection: "row", gap: 10, marginTop: 16 },
  serviceBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.card, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  serviceBadgeText: { fontSize: 13, color: theme.textSecondary, fontWeight: "500" },
  
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 16 },
  
  servicesPreview: { gap: 10 },
  serviceItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, padding: 14, borderRadius: 12 },
  serviceInfo: { flex: 1 },
  serviceItemName: { fontSize: 15, fontWeight: "600", color: theme.text },
  serviceItemDuration: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  serviceItemPrice: { fontSize: 16, fontWeight: "bold", color: theme.text },
  moreServices: { textAlign: "center", fontSize: 14, color: theme.textMuted, marginTop: 8 },
  
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  photoItem: { width: (width - 48) / 3, height: (width - 48) / 3, borderRadius: 12 },
  
  bottomCTA: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border },
  bottomInfo: { flex: 1 },
  bottomServicesCount: { fontSize: 15, fontWeight: "600", color: theme.text },
  bottomAvailability: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  bookButton: { backgroundColor: theme.text, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  bookButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});