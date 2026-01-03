// app/(app)/(shared)/dispute/[id].tsx
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getBookingById } from "@/api/bookings";
import { 
  openDispute, 
  hasOpenDispute,
  DISPUTE_TYPE_LABELS,
  type DisputeType 
} from "@/api/disputes";
import type { BookingWithDetails } from "@/types/database";

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
};

// ============================================
// DONNÉES
// ============================================

interface DisputeOption {
  type: DisputeType;
  label: string;
  icon: string;
  description: string;
}

const DISPUTE_OPTIONS: DisputeOption[] = [
  {
    type: "no_show_coiffeur",
    label: "Coiffeur absent",
    icon: "person-remove-outline",
    description: "Le coiffeur ne s'est pas présenté au rendez-vous",
  },
  {
    type: "no_show_client",
    label: "Client absent",
    icon: "person-remove-outline",
    description: "Le client n'était pas présent au lieu de rendez-vous",
  },
  {
    type: "late_arrival",
    label: "Retard important",
    icon: "time-outline",
    description: "Retard de plus de 15 minutes sans prévenir",
  },
  {
    type: "wrong_location",
    label: "Mauvaise adresse",
    icon: "location-outline",
    description: "L'adresse fournie était incorrecte ou introuvable",
  },
  {
    type: "service_issue",
    label: "Problème de prestation",
    icon: "cut-outline",
    description: "La prestation ne correspondait pas à la demande",
  },
  {
    type: "payment_issue",
    label: "Problème de paiement",
    icon: "card-outline",
    description: "Souci avec le paiement ou le montant",
  },
  {
    type: "behavior_issue",
    label: "Comportement inapproprié",
    icon: "warning-outline",
    description: "Comportement irrespectueux ou problématique",
  },
  {
    type: "other",
    label: "Autre problème",
    icon: "help-circle-outline",
    description: "Un autre problème non listé ci-dessus",
  },
];

// ============================================
// COMPOSANTS
// ============================================

const DisputeTypeCard = ({
  option,
  selected,
  onSelect,
}: {
  option: DisputeOption;
  selected: boolean;
  onSelect: () => void;
}) => (
  <Pressable
    style={[styles.disputeTypeCard, selected && styles.disputeTypeCardSelected]}
    onPress={onSelect}
  >
    <View style={[styles.disputeTypeIcon, selected && styles.disputeTypeIconSelected]}>
      <Ionicons
        name={option.icon as any}
        size={22}
        color={selected ? theme.white : theme.error}
      />
    </View>
    <View style={styles.disputeTypeContent}>
      <Text style={[styles.disputeTypeLabel, selected && styles.disputeTypeLabelSelected]}>
        {option.label}
      </Text>
      <Text style={styles.disputeTypeDescription}>{option.description}</Text>
    </View>
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </Pressable>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function DisputeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [hasExistingDispute, setHasExistingDispute] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<DisputeType | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [bookingData, existingDispute] = await Promise.all([
        getBookingById(id),
        hasOpenDispute(id),
      ]);

      setBooking(bookingData);
      setHasExistingDispute(existingDispute);
    } catch (error) {
      console.error("Error loading dispute data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert("Type requis", "Veuillez sélectionner le type de problème.");
      return;
    }

    if (description.trim().length < 20) {
      Alert.alert(
        "Description requise",
        "Veuillez décrire le problème en au moins 20 caractères."
      );
      return;
    }

    Alert.alert(
      "Confirmer la réclamation",
      "Êtes-vous sûr de vouloir ouvrir cette réclamation ? Notre équipe l'examinera dans les plus brefs délais.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setSubmitting(true);

            try {
              const dispute = await openDispute({
                booking_id: id!,
                dispute_type: selectedType,
                description: description.trim(),
              });

              if (dispute) {
                Alert.alert(
                  "Réclamation envoyée",
                  "Nous avons bien reçu votre réclamation. Notre équipe vous contactera sous 24-48h.",
                  [{ text: "OK", onPress: () => router.back() }]
                );
              } else {
                Alert.alert("Erreur", "Impossible d'envoyer la réclamation.");
              }
            } catch (error) {
              console.error("Error submitting dispute:", error);
              Alert.alert("Erreur", "Une erreur est survenue.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (hasExistingDispute) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Réclamation</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.centered, { flex: 1 }]}>
          <View style={styles.existingDisputeIcon}>
            <Ionicons name="document-text" size={40} color={theme.warning} />
          </View>
          <Text style={styles.existingDisputeTitle}>Réclamation en cours</Text>
          <Text style={styles.existingDisputeText}>
            Une réclamation est déjà ouverte pour ce rendez-vous. Notre équipe
            l'examine actuellement.
          </Text>
          <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonLargeText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Signaler un problème</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color={theme.error} />
          <Text style={styles.introTitle}>Nous sommes là pour vous aider</Text>
          <Text style={styles.introText}>
            Décrivez le problème rencontré et notre équipe examinera votre
            réclamation dans les plus brefs délais.
          </Text>
        </View>

        {/* Type de problème */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quel est le problème ? *</Text>
          <View style={styles.disputeTypesList}>
            {DISPUTE_OPTIONS.map((option) => (
              <DisputeTypeCard
                key={option.type}
                option={option}
                selected={selectedType === option.type}
                onSelect={() => setSelectedType(option.type)}
              />
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Décrivez le problème *</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Expliquez en détail ce qui s'est passé..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {description.length}/1000 (min. 20 caractères)
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={theme.accent} />
          <Text style={styles.infoText}>
            Une fois la réclamation envoyée, le statut du rendez-vous passera en
            "En litige" et notre équipe vous contactera sous 24-48h.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[
            styles.submitButton,
            (!selectedType || description.length < 20 || submitting) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedType || description.length < 20 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={theme.white} />
              <Text style={styles.submitButtonText}>Envoyer la réclamation</Text>
            </>
          )}
        </Pressable>
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
    backgroundColor: theme.white,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },

  // Intro Card
  introCard: {
    alignItems: "center",
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: theme.errorLight,
    borderRadius: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginTop: 12,
  },
  introText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },

  // Dispute Types
  disputeTypesList: {
    gap: 12,
  },
  disputeTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  disputeTypeCardSelected: {
    borderColor: theme.error,
    backgroundColor: theme.errorLight,
  },
  disputeTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  disputeTypeIconSelected: {
    backgroundColor: theme.error,
  },
  disputeTypeContent: {
    flex: 1,
    marginLeft: 12,
  },
  disputeTypeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  disputeTypeLabelSelected: {
    color: theme.error,
  },
  disputeTypeDescription: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: theme.error,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.error,
  },

  // Description
  descriptionInput: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: theme.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    marginTop: 8,
    fontSize: 12,
    color: theme.textMuted,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.accentLight,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.white,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.error,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    backgroundColor: theme.textMuted,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
  },

  // Existing Dispute
  existingDisputeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  existingDisputeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
    marginTop: 16,
  },
  existingDisputeText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  backButtonLarge: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderRadius: 12,
  },
  backButtonLargeText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
});