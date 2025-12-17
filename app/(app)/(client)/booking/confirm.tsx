// app/(app)/(client)/booking/confirm.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef } from "react";
import { COIFFEURS } from "@/constants/mockData";
import { useBookingStore } from "@/stores/bookingStore";
import { ROUTES } from "@/constants/routes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
  successLight: "#E8F5E9",
};

// Fonction pour formater une date en YYYY-MM-DD sans problème de timezone
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BookingConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coiffeurId, serviceId, date, time, location } = useLocalSearchParams();
  
  const { setCurrentBooking, confirmBooking } = useBookingStore();
  
  const [selectedPayment, setSelectedPayment] = useState<"card" | "apple" | "google">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Animation pour la modal
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const coiffeur = COIFFEURS.find((c) => c.id === coiffeurId) || COIFFEURS[0];
  const service = coiffeur.services.find((s) => s.id === serviceId) || coiffeur.services[0];
  const isAtHome = location === "domicile";

  const formatDateLong = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("fr-FR", { 
      weekday: "long", 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  const formatDateShort = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.getTime() === today.getTime()) return "Aujourd'hui";
    if (d.getTime() === tomorrow.getTime()) return "Demain";
    
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Calcul du prix
  const basePrice = service.price;
  const homeServiceFee = isAtHome ? 15 : 0;
  const totalPrice = basePrice + homeServiceFee;

  // PanResponder pour le swipe down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const openModal = () => {
    setShowSuccessModal(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      router.dismissAll();
      router.replace(ROUTES.CLIENT.ACTIVITY);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Stocker la réservation dans le store
    setCurrentBooking({
      inspiration: {
        id: service.id,
        title: service.name,
        image: coiffeur.photos[0] || coiffeur.avatar,
        category: "Service",
        duration: service.duration,
        price: totalPrice,
      },
      coiffeur: {
        id: coiffeur.id,
        name: coiffeur.name,
        salon: coiffeur.salon,
        image: coiffeur.avatar,
        rating: coiffeur.rating,
      },
      date: formatDateShort(date as string),
      dateFormatted: formatDateLong(date as string),
      time: time as string,
    });

    // Simulation du paiement (2 secondes)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Confirmer la réservation
    confirmBooking();
    
    setIsProcessing(false);
    
    // Ouvrir la modal de succès
    openModal();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Paiement</Text>
          <Text style={styles.headerSubtitle}>Étape 4/4</Text>
        </View>
        <Pressable onPress={() => router.dismissAll()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Récap réservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre réservation</Text>
          
          <View style={styles.bookingCard}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingTitle}>{service.name}</Text>
              <Text style={styles.bookingCoiffeur}>avec {coiffeur.name}</Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                <Text style={styles.bookingMetaText}>{service.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date et heure + Lieu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date, heure et lieu</Text>
          
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.text} />
              <View>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDateShort(date as string)}</Text>
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
            <View style={styles.dateTimeDivider} />
            <View style={styles.dateTimeItem}>
              <Ionicons name={isAtHome ? "home" : "storefront"} size={20} color={theme.text} />
              <View>
                <Text style={styles.dateTimeLabel}>Lieu</Text>
                <Text style={styles.dateTimeValue}>{isAtHome ? "Domicile" : "Salon"}</Text>
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
              <Text style={styles.priceLabel}>{service.name}</Text>
              <Text style={styles.priceValue}>{basePrice}€</Text>
            </View>
            {isAtHome && (
              <View style={styles.priceRow}>
                <View style={styles.priceLabelRow}>
                  <Text style={styles.priceLabel}>Frais de déplacement</Text>
                  <Ionicons name="home" size={12} color={theme.textMuted} />
                </View>
                <Text style={styles.priceValue}>{homeServiceFee}€</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais de service</Text>
              <Text style={styles.priceValue}>0€</Text>
            </View>
            <View style={[styles.priceRow, styles.priceRowTotal]}>
              <Text style={styles.priceLabelTotal}>Total</Text>
              <Text style={styles.priceValueTotal}>{totalPrice}€</Text>
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
              <Text style={styles.payButtonText}>Payer {totalPrice}€</Text>
              <Ionicons name="lock-closed" size={16} color="#FFF" />
            </>
          )}
        </Pressable>
        <Text style={styles.secureText}>
          <Ionicons name="shield-checkmark" size={12} color={theme.textMuted} /> Paiement sécurisé
        </Text>
      </View>

      {/* Modal de Succès */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Animated.View 
            style={[
              styles.modalBackdrop,
              { opacity: backdropAnim }
            ]}
          >
            <Pressable style={styles.backdropPressable} onPress={closeModal} />
          </Animated.View>

          {/* Card */}
          <Animated.View 
            style={[
              styles.successCard,
              { 
                transform: [{ translateY: slideAnim }],
                paddingBottom: insets.bottom + 24,
              }
            ]}
            {...panResponder.panHandlers}
          >
            {/* Drag Indicator */}
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>

            {/* Success Content */}
            <View style={styles.successContent}>
              <View style={styles.successIconContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color="#FFF" />
                </View>
              </View>

              <Text style={styles.successTitle}>Réservation confirmée !</Text>
              <Text style={styles.successSubtitle}>
                Votre rendez-vous a bien été enregistré
              </Text>

              {/* Récap Card */}
              <View style={styles.successRecapCard}>
                <Image 
                  source={{ uri: coiffeur.avatar }} 
                  style={styles.successCoiffeurImage} 
                />
                <View style={styles.successRecapInfo}>
                  <Text style={styles.successServiceName}>{service.name}</Text>
                  <Text style={styles.successCoiffeurName}>avec {coiffeur.name}</Text>
                  <View style={styles.successRecapMeta}>
                    <View style={styles.successMetaItem}>
                      <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.successMetaText}>{formatDateShort(date as string)}</Text>
                    </View>
                    <View style={styles.successMetaItem}>
                      <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.successMetaText}>{time}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Prix total */}
              <View style={styles.successPriceRow}>
                <Text style={styles.successPriceLabel}>Total payé</Text>
                <Text style={styles.successPriceValue}>{totalPrice}€</Text>
              </View>

              {/* CTA */}
              <Pressable style={styles.successButton} onPress={closeModal}>
                <Text style={styles.successButtonText}>Voir mes réservations</Text>
              </Pressable>

              <Text style={styles.swipeHint}>Glissez vers le bas pour fermer</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  
  // Section
  section: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  
  // Booking Card
  bookingCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.text,
  },
  bookingCoiffeur: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  bookingMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  bookingMetaText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  
  // DateTime Card
  dateTimeCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateTimeDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  dateTimeLabel: {
    fontSize: 11,
    color: theme.textMuted,
  },
  dateTimeValue: {
    fontSize: 14,
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
    borderRadius: 14,
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    paddingTop: 12,
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

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropPressable: {
    flex: 1,
  },
  successCard: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SCREEN_HEIGHT * 0.55,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  successContent: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.success,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 24,
  },
  successRecapCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  successCoiffeurImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  successRecapInfo: {
    flex: 1,
    marginLeft: 14,
  },
  successServiceName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  successCoiffeurName: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  successRecapMeta: {
    flexDirection: "row",
    marginTop: 10,
    gap: 16,
  },
  successMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  successMetaText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  successPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 20,
  },
  successPriceLabel: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  successPriceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
  },
  successButton: {
    backgroundColor: theme.text,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  swipeHint: {
    fontSize: 12,
    color: theme.textMuted,
  },
});