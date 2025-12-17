// app/(app)/(shared)/coiffeur/[id].tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  Pressable, 
  Dimensions, 
  StyleSheet 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { COIFFEURS } from "@/constants/mockData";
import { ROUTES } from "@/constants/routes";

const { width } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
};

type ServiceLocation = "salon" | "domicile";

export default function CoiffeurProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFavorite, setIsFavorite] = useState(false);
  const [serviceLocation, setServiceLocation] = useState<ServiceLocation>("salon");

  const coiffeur = COIFFEURS.find((c) => c.id === id) || COIFFEURS[0];

  const handleBook = () => {
    router.push({
      pathname: ROUTES.CLIENT.BOOKING.SERVICE,
      params: { 
        coiffeurId: coiffeur.id,
        location: serviceLocation,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{coiffeur.name}</Text>
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
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <Image source={{ uri: coiffeur.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{coiffeur.name}</Text>
              <Text style={styles.profileHandle}>
                @{coiffeur.name.toLowerCase().replace(/\s/g, "")}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{coiffeur.photos.length}</Text> posts
                </Text>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{coiffeur.reviews}</Text> avis
                </Text>
              </View>
            </View>
          </View>

          {/* Rating & Location */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>{coiffeur.rating}</Text>
              <Text style={styles.reviewsText}>({coiffeur.reviews} avis)</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={theme.textMuted} />
              <Text style={styles.locationText}>Paris 11ème • {coiffeur.distance}</Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={styles.bio}>
            {coiffeur.specialty}. Passionnée par les colorations et balayages. 
            15 ans d'expérience dans les techniques modernes.
          </Text>
        </View>

        {/* Location Toggle - Cliquable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieu de la prestation</Text>
          <View style={styles.locationToggle}>
            {coiffeur.atHome && (
              <Pressable
                onPress={() => setServiceLocation("domicile")}
                style={[
                  styles.locationOption,
                  serviceLocation === "domicile" && styles.locationOptionSelected,
                ]}
              >
                <Ionicons 
                  name="home" 
                  size={18} 
                  color={serviceLocation === "domicile" ? "#FFF" : theme.text} 
                />
                <Text style={[
                  styles.locationOptionText,
                  serviceLocation === "domicile" && styles.locationOptionTextSelected,
                ]}>
                  À domicile
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setServiceLocation("salon")}
              style={[
                styles.locationOption,
                serviceLocation === "salon" && styles.locationOptionSelected,
              ]}
            >
              <Ionicons 
                name="storefront" 
                size={18} 
                color={serviceLocation === "salon" ? "#FFF" : theme.text} 
              />
              <Text style={[
                styles.locationOptionText,
                serviceLocation === "salon" && styles.locationOptionTextSelected,
              ]}>
                En salon
              </Text>
            </Pressable>
          </View>
          {serviceLocation === "domicile" && (
            <Text style={styles.locationNote}>
              +15€ de frais de déplacement
            </Text>
          )}
        </View>

        {/* Réalisations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réalisations</Text>
          <View style={styles.photosGrid}>
            {coiffeur.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photoItem}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLocationLabel}>
            {serviceLocation === "domicile" ? "À domicile" : "En salon"}
          </Text>
          <Text style={styles.bottomAvailability}>Disponible 24h/24</Text>
        </View>
        <Pressable onPress={handleBook} style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Réserver</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.text,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  
  // Profile Section
  profileSection: {
    padding: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
  },
  profileHandle: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  statNumber: {
    fontWeight: "600",
    color: theme.text,
  },
  
  // Meta Section
  metaSection: {
    marginTop: 16,
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.text,
  },
  reviewsText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  locationText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  
  // Bio
  bio: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginTop: 16,
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 16,
  },
  
  // Location Toggle
  locationToggle: {
    flexDirection: "row",
    gap: 10,
  },
  locationOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.card,
  },
  locationOptionSelected: {
    backgroundColor: theme.text,
  },
  locationOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  locationOptionTextSelected: {
    color: "#FFFFFF",
  },
  locationNote: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 10,
    textAlign: "center",
  },
  
  // Photos Grid
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  photoItem: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    borderRadius: 12,
  },
  
  // Bottom CTA
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomLocationLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  bottomAvailability: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: theme.text,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  bookButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});