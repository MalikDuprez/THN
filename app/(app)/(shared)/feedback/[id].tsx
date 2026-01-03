// app/(app)/(shared)/feedback/[id].tsx
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
import { submitFeedback, hasFeedbackForBooking } from "@/api/feedback";
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
  border: "#E2E8F0",
  star: "#FBBF24",
};

// ============================================
// COMPOSANTS
// ============================================

const StarRating = ({ 
  rating, 
  onRate 
}: { 
  rating: number; 
  onRate: (rating: number) => void;
}) => (
  <View style={styles.starsContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Pressable key={star} onPress={() => onRate(star)} style={styles.starButton}>
        <Ionicons
          name={star <= rating ? "star" : "star-outline"}
          size={40}
          color={star <= rating ? theme.star : theme.border}
        />
      </Pressable>
    ))}
  </View>
);

const YesNoQuestion = ({
  question,
  value,
  onChange,
}: {
  question: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) => (
  <View style={styles.questionContainer}>
    <Text style={styles.questionText}>{question}</Text>
    <View style={styles.yesNoButtons}>
      <Pressable
        style={[
          styles.yesNoButton,
          value === true && styles.yesNoButtonActive,
        ]}
        onPress={() => onChange(true)}
      >
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={value === true ? theme.white : theme.success}
        />
        <Text
          style={[
            styles.yesNoButtonText,
            value === true && styles.yesNoButtonTextActive,
          ]}
        >
          Oui
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.yesNoButton,
          value === false && styles.yesNoButtonActiveNo,
        ]}
        onPress={() => onChange(false)}
      >
        <Ionicons
          name="close-circle"
          size={20}
          color={value === false ? theme.white : theme.error}
        />
        <Text
          style={[
            styles.yesNoButtonText,
            value === false && styles.yesNoButtonTextActive,
          ]}
        >
          Non
        </Text>
      </Pressable>
    </View>
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [wasOnTime, setWasOnTime] = useState<boolean | null>(null);
  const [locationCorrect, setLocationCorrect] = useState<boolean | null>(null);
  const [serviceAsExpected, setServiceAsExpected] = useState<boolean | null>(null);
  const [durationAsExpected, setDurationAsExpected] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [bookingData, hasSubmitted] = await Promise.all([
        getBookingById(id),
        hasFeedbackForBooking(id),
      ]);

      setBooking(bookingData);
      setAlreadySubmitted(hasSubmitted);
    } catch (error) {
      console.error("Error loading feedback data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Note requise", "Veuillez donner une note globale.");
      return;
    }

    setSubmitting(true);

    try {
      const success = await submitFeedback({
        booking_id: id!,
        overall_rating: rating,
        was_on_time: wasOnTime ?? undefined,
        location_was_correct: locationCorrect ?? undefined,
        service_as_expected: serviceAsExpected ?? undefined,
        duration_as_expected: durationAsExpected ?? undefined,
        comment: comment.trim() || undefined,
      });

      if (success) {
        Alert.alert(
          "Merci !",
          "Votre avis a été enregistré.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Erreur", "Impossible d'enregistrer votre avis.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (alreadySubmitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Avis</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="checkmark-circle" size={64} color={theme.success} />
          <Text style={styles.alreadySubmittedTitle}>Merci !</Text>
          <Text style={styles.alreadySubmittedText}>
            Vous avez déjà donné votre avis pour ce rendez-vous.
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
        <Text style={styles.headerTitle}>Donnez votre avis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={theme.accent} />
          <Text style={styles.introTitle}>Comment s'est passé ce RDV ?</Text>
          <Text style={styles.introText}>
            Votre avis nous aide à améliorer l'expérience pour tous.
          </Text>
        </View>

        {/* Note globale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note globale *</Text>
          <StarRating rating={rating} onRate={setRating} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 && "Très insatisfait"}
              {rating === 2 && "Insatisfait"}
              {rating === 3 && "Correct"}
              {rating === 4 && "Satisfait"}
              {rating === 5 && "Très satisfait"}
            </Text>
          )}
        </View>

        {/* Questions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions rapides</Text>
          <View style={styles.questionsCard}>
            <YesNoQuestion
              question="La personne était-elle à l'heure ?"
              value={wasOnTime}
              onChange={setWasOnTime}
            />
            <YesNoQuestion
              question="L'adresse était-elle correcte ?"
              value={locationCorrect}
              onChange={setLocationCorrect}
            />
            <YesNoQuestion
              question="La prestation correspondait aux attentes ?"
              value={serviceAsExpected}
              onChange={setServiceAsExpected}
            />
            <YesNoQuestion
              question="La durée était-elle conforme ?"
              value={durationAsExpected}
              onChange={setDurationAsExpected}
            />
          </View>
        </View>

        {/* Commentaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Un commentaire ? (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Partagez votre expérience..."
            placeholderTextColor={theme.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[
            styles.submitButton,
            (rating === 0 || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={theme.white} />
              <Text style={styles.submitButtonText}>Envoyer mon avis</Text>
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
    backgroundColor: theme.accentLight,
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

  // Stars
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Questions
  questionsCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  questionContainer: {
    gap: 10,
  },
  questionText: {
    fontSize: 14,
    color: theme.text,
  },
  yesNoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
  },
  yesNoButtonActive: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  yesNoButtonActiveNo: {
    backgroundColor: theme.error,
    borderColor: theme.error,
  },
  yesNoButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  yesNoButtonTextActive: {
    color: theme.white,
  },

  // Comment
  commentInput: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: theme.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    marginTop: 8,
    fontSize: 12,
    color: theme.textMuted,
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
    backgroundColor: theme.black,
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

  // Already submitted
  alreadySubmittedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
    marginTop: 16,
  },
  alreadySubmittedText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
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