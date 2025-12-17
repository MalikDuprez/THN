// app/(app)/(client)/booking/checkout.tsx
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { ROUTES } from "@/constants/routes";

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  error: "#C62828",
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentBooking, confirmBooking } = useBookingStore();
  
  const [selectedPayment, setSelectedPayment] = useState<"card" | "apple" | "google">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Sauvegarder les données avant confirmation pour l'affichage
  const [bookingData, setBookingData] = useState<typeof currentBooking>(null);

  // Stocker les données dès qu'on a un currentBooking
  useEffect(() => {
    if (currentBooking && !bookingData) {
      setBookingData(currentBooking);
    }
  }, [currentBooking]);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulation du paiement (2 secondes)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    
    // Confirmer la réservation dans le store
    confirmBooking();
    
    // Redirection vers Activity après 2 secondes
    setTimeout(() => {
      router.replace(ROUTES.CLIENT.ACTIVITY);
    }, 2000);
  };

  // Écran de succès (PRIORITAIRE)
  if (isSuccess) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#FFF" />
          </View>
          <Text style={styles.successTitle}>Paiement réussi !</Text>
          <Text style={styles.successSubtitle}>
            Votre réservation a bien été confirmée.{"\n"}
            Vous allez être redirigé...
          </Text>
        </View>
      </View>
    );
  }

  // Utiliser bookingData si currentBooking est null (pendant la transition)
  const displayData = currentBooking || bookingData;

  // Si pas de données du tout, afficher l'écran vide
  if (!displayData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={theme.textMuted} />
          <Text style={styles.emptyText}>Aucune réservation en cours</Text>
          <Pressable style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { inspiration, coiffeur, date, dateFormatted, time } = displayData;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Récapitulatif de la réservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre réservation</Text>
          
          <View style={styles.bookingCard}>
            <Image source={{ uri: inspiration.image }} style={styles.bookingImage} />
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingTitle}>{inspiration.title}</Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                <Text style={styles.bookingMetaText}>{inspiration.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Coiffeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre coiffeur</Text>
          
          <View style={styles.coiffeurCard}>
            <Image source={{ uri: coiffeur.image }} style={styles.coiffeurImage} />
            <View style={styles.coiffeurInfo}>
              <Text style={styles.coiffeurName}>{coiffeur.name}</Text>
              <Text style={styles.coiffeurSalon}>{coiffeur.salon}</Text>
              <View style={styles.coiffeurRating}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.coiffeurRatingText}>{coiffeur.rating}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date et heure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date et heure</Text>
          
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.text} />
              <View>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{date}, {dateFormatted}</Text>
              </View>
            </View>
            <View style={styles.dateTimeDivider} />
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={20} color={theme.text} />
              <View>
                <Text style={styles.dateTimeLabel}>Heure</Text>
                <Text style={styles.dateTimeValue}>{time}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mode de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de paiement</Text>
          
          <Pressable 
            style={[styles.paymentOption, selectedPayment === "card" && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment("card")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Ionicons name="card-outline" size={20} color={theme.text} />
              </View>
              <View>
                <Text style={styles.paymentTitle}>Carte bancaire</Text>
                <Text style={styles.paymentSubtitle}>•••• •••• •••• 4242</Text>
              </View>
            </View>
            <View style={[styles.radio, selectedPayment === "card" && styles.radioSelected]}>
              {selectedPayment === "card" && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          <Pressable 
            style={[styles.paymentOption, selectedPayment === "apple" && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment("apple")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Ionicons name="logo-apple" size={20} color={theme.text} />
              </View>
              <Text style={styles.paymentTitle}>Apple Pay</Text>
            </View>
            <View style={[styles.radio, selectedPayment === "apple" && styles.radioSelected]}>
              {selectedPayment === "apple" && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          <Pressable 
            style={[styles.paymentOption, selectedPayment === "google" && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment("google")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Ionicons name="logo-google" size={20} color={theme.text} />
              </View>
              <Text style={styles.paymentTitle}>Google Pay</Text>
            </View>
            <View style={[styles.radio, selectedPayment === "google" && styles.radioSelected]}>
              {selectedPayment === "google" && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        </View>

        {/* Récapitulatif prix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{inspiration.title}</Text>
              <Text style={styles.priceValue}>{inspiration.price}€</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais de service</Text>
              <Text style={styles.priceValue}>0€</Text>
            </View>
            <View style={[styles.priceRow, styles.priceRowTotal]}>
              <Text style={styles.priceLabelTotal}>Total</Text>
              <Text style={styles.priceValueTotal}>{inspiration.price}€</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer fixe avec CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable 
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Payer {inspiration.price}€</Text>
              <Ionicons name="lock-closed" size={16} color="#FFF" />
            </>
          )}
        </Pressable>
        <Text style={styles.secureText}>
          <Ionicons name="shield-checkmark" size={12} color={theme.textMuted} /> Paiement sécurisé
        </Text>
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
    fontSize: 17,
    fontWeight: "600",
    color: theme.text,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  
  // Success
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  successContent: {
    alignItems: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: "center",
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  
  // Section
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 16,
  },
  
  // Booking Card
  bookingCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  bookingImage: {
    width: 100,
    height: 100,
  },
  bookingInfo: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  bookingTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bookingMetaText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  
  // Coiffeur Card
  coiffeurCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
  },
  coiffeurImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  coiffeurInfo: {
    flex: 1,
  },
  coiffeurName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  coiffeurSalon: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  coiffeurRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  coiffeurRatingText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.text,
  },
  
  // DateTime Card
  dateTimeCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateTimeDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: 16,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: theme.textMuted,
  },
  dateTimeValue: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
    marginTop: 2,
  },
  
  // Payment Options
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionSelected: {
    borderColor: theme.text,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: theme.text,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.text,
  },
  
  // Price Card
  priceCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceRowTotal: {
    marginBottom: 0,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  priceLabelTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  priceValueTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
  },
  
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  payButton: {
    backgroundColor: theme.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#999",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  secureText: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
});