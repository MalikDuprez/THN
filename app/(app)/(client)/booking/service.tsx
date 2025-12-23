// app/(app)/(client)/booking/service.tsx
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { getCoiffeurById, getServicesByLocation } from "@/api/coiffeurs";
import { useBookingStore } from "@/stores/bookingStore";
import type { Service, CoiffeurWithDetails } from "@/types/database";
import { formatPriceShort } from "@/types/database";

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
};

export default function BookingServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coiffeurId, location } = useLocalSearchParams<{ coiffeurId: string; location: string }>();
  
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [coiffeur, setCoiffeur] = useState<CoiffeurWithDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { setCoiffeur: setStoreCoiffeur, setService, setLocation } = useBookingStore();

  const isAtHome = location === "domicile";

  useEffect(() => {
    async function loadData() {
      if (!coiffeurId) return;
      
      setIsLoading(true);
      
      const [coiffeurData, servicesData] = await Promise.all([
        getCoiffeurById(coiffeurId),
        getServicesByLocation(coiffeurId, isAtHome ? "domicile" : "salon"),
      ]);

      if (coiffeurData) {
        setCoiffeur(coiffeurData);
        setStoreCoiffeur({
          id: coiffeurData.id,
          display_name: coiffeurData.display_name || "Coiffeur",
          avatar_url: coiffeurData.avatar_url,
          rating: Number(coiffeurData.rating) || 0,
          salon_name: coiffeurData.salon?.name,
        });
        setLocation(
          isAtHome ? "domicile" : "salon",
          isAtHome ? coiffeurData.home_service_fee_cents : 0
        );
      }
      
      setServices(servicesData);
      setIsLoading(false);
    }

    loadData();
  }, [coiffeurId, isAtHome]);

  const handleNext = () => {
    const selectedService = services.find((s) => s.id === selectedServiceId);
    if (selectedService) {
      setService({
        id: selectedService.id,
        name: selectedService.name,
        price_cents: selectedService.price_cents,
        duration_minutes: selectedService.duration_minutes,
      });

      router.push({
        pathname: "./date",
        params: { 
          coiffeurId: coiffeurId,
          serviceId: selectedServiceId,
          location: location,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={styles.loadingText}>Chargement des services...</Text>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choisir un service</Text>
          <Text style={styles.headerSubtitle}>Étape 1/4</Text>
        </View>
        <Pressable onPress={() => router.dismissAll()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>

      <View style={styles.coiffeurInfo}>
        <View style={styles.coiffeurRow}>
          <View>
            <Text style={styles.coiffeurLabel}>Réservation chez</Text>
            <Text style={styles.coiffeurName}>{coiffeur.display_name}</Text>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons name={isAtHome ? "home" : "storefront"} size={14} color={theme.text} />
            <Text style={styles.locationBadgeText}>{isAtHome ? "À domicile" : "En salon"}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Sélectionnez un service</Text>
        
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyText}>Aucun service disponible</Text>
          </View>
        ) : (
          services.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => setSelectedServiceId(service.id)}
              style={[styles.serviceCard, selectedServiceId === service.id && styles.serviceCardSelected]}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={1}>{service.description}</Text>
                )}
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                  <Text style={styles.serviceDuration}>{service.duration_minutes} min</Text>
                </View>
              </View>
              <View style={styles.serviceRight}>
                <Text style={styles.servicePrice}>{formatPriceShort(service.price_cents)}</Text>
                {selectedServiceId === service.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.text} />
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleNext}
          disabled={!selectedServiceId}
          style={[styles.ctaButton, !selectedServiceId && styles.ctaButtonDisabled]}
        >
          <Text style={styles.ctaText}>Continuer</Text>
        </Pressable>
      </View>
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  headerSubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  progressContainer: { flexDirection: "row", padding: 16, gap: 4 },
  progressBar: { flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  progressActive: { backgroundColor: theme.text },
  coiffeurInfo: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  coiffeurRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coiffeurLabel: { fontSize: 13, color: theme.textMuted },
  coiffeurName: { fontSize: 16, fontWeight: "bold", color: theme.text, marginTop: 4 },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.card, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  locationBadgeText: { fontSize: 13, fontWeight: "600", color: theme.text },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 16 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { marginTop: 12, fontSize: 15, color: theme.textMuted },
  serviceCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: theme.card, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderColor: "transparent" },
  serviceCardSelected: { borderColor: theme.text, backgroundColor: "#F0F0F0" },
  serviceInfo: { flex: 1, marginRight: 12 },
  serviceName: { fontSize: 16, fontWeight: "600", color: theme.text },
  serviceDescription: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  serviceMeta: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  serviceDuration: { fontSize: 14, color: theme.textMuted },
  serviceRight: { alignItems: "flex-end", gap: 4 },
  servicePrice: { fontSize: 20, fontWeight: "bold", color: theme.text },
  bottomCTA: { padding: 16, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background },
  ctaButton: { backgroundColor: theme.text, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  ctaButtonDisabled: { backgroundColor: "#CCC" },
  ctaText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});