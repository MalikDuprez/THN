// app/(app)/(client)/booking/service.tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { COIFFEURS } from "@/constants/mockData";
import { ROUTES } from "@/constants/routes";

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
  const { coiffeurId, location } = useLocalSearchParams();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const coiffeur = COIFFEURS.find((c) => c.id === coiffeurId) || COIFFEURS[0];
  const isAtHome = location === "domicile";

  const handleNext = () => {
    if (selectedService) {
      router.push({
        pathname: "./date",
        params: { 
          coiffeurId: coiffeur.id, 
          serviceId: selectedService,
          location: location as string,
        },
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>

      {/* Coiffeur Info + Location */}
      <View style={styles.coiffeurInfo}>
        <View style={styles.coiffeurRow}>
          <View>
            <Text style={styles.coiffeurLabel}>Réservation chez</Text>
            <Text style={styles.coiffeurName}>{coiffeur.name}</Text>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons 
              name={isAtHome ? "home" : "storefront"} 
              size={14} 
              color={theme.text} 
            />
            <Text style={styles.locationBadgeText}>
              {isAtHome ? "À domicile" : "En salon"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Sélectionnez un service</Text>
        
        {coiffeur.services.map((service) => (
          <Pressable
            key={service.id}
            onPress={() => setSelectedService(service.id)}
            style={[
              styles.serviceCard,
              selectedService === service.id && styles.serviceCardSelected,
            ]}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={styles.serviceMeta}>
                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              </View>
            </View>
            <View style={styles.serviceRight}>
              <Text style={styles.servicePrice}>{service.price} €</Text>
              {selectedService === service.id && (
                <Ionicons name="checkmark-circle" size={24} color={theme.text} />
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleNext}
          disabled={!selectedService}
          style={[
            styles.ctaButton,
            !selectedService && styles.ctaButtonDisabled,
          ]}
        >
          <Text style={styles.ctaText}>Continuer</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: theme.text,
  },
  coiffeurInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  coiffeurRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coiffeurLabel: {
    fontSize: 13,
    color: theme.textMuted,
  },
  coiffeurName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.text,
    marginTop: 4,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  locationBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.card,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  serviceCardSelected: {
    borderColor: theme.text,
    backgroundColor: "#F0F0F0",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: theme.textMuted,
  },
  serviceRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
  },
  bottomCTA: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  ctaButton: {
    backgroundColor: theme.text,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: "#CCC",
  },
  ctaText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});