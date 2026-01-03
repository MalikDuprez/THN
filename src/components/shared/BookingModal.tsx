// src/components/shared/BookingModal.tsx
import {
  View,
  Text,
  Modal,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import { createBooking, getCoiffeurAvailableSlots } from "@/api/bookings";
import { createPaymentIntent, confirmPaymentSuccess, markPaymentFailed, cancelPendingBooking } from "@/api/payments";
import { getMyAddresses, getDefaultAddress, formatAddressShort, type Address } from "@/api/addresses";
import { calculatePlatformFee } from "@/constants/pricing";
import type { Service, CoiffeurWithDetails, AddressSnapshot } from "@/types/database";
import { formatPriceShort } from "@/types/database";

const { height } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  disabled: "#E0E0E0",
};

interface BookingModalProps {
  visible: boolean;
  coiffeur: CoiffeurWithDetails | null;
  services: Service[];
  preselectedServiceId?: string;
  inspirationImage?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ALL_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
];

export default function BookingModal({
  visible,
  coiffeur,
  services,
  preselectedServiceId,
  inspirationImage,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<"salon" | "domicile">("domicile");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPayment] = useState<"card">("card"); // Stripe gère les méthodes de paiement
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // États pour les adresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const selectedServices = useMemo(() => {
    return services.filter(s => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  }, [selectedServices]);

  const subtotalCents = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price_cents, 0);
  }, [selectedServices]);

  // Prix minimum des services
  const minPriceCents = useMemo(() => {
    if (services.length === 0) return 0;
    return Math.min(...services.map(s => s.price_cents));
  }, [services]);

  const homeFeeCents = selectedLocation === "domicile" ? (coiffeur?.home_service_fee_cents || 0) : 0;
  
  // Calcul avec frais de plateforme (0€ si salon, 5% max 1.99€ si domicile)
  const platformFeeCents = useMemo(() => {
    return calculatePlatformFee(subtotalCents + homeFeeCents, selectedLocation);
  }, [subtotalCents, homeFeeCents, selectedLocation]);
  
  const totalCents = subtotalCents + homeFeeCents + platformFeeCents;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Charger les adresses de l'utilisateur
  useEffect(() => {
    async function loadAddresses() {
      const userAddresses = await getMyAddresses();
      setAddresses(userAddresses);
      
      // Sélectionner l'adresse par défaut
      const defaultAddr = userAddresses.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else if (userAddresses.length > 0) {
        setSelectedAddress(userAddresses[0]);
      }
    }
    
    if (visible) {
      loadAddresses();
    }
  }, [visible]);

  const availableDates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const getVisibleTimes = useCallback(() => {
    if (!selectedDate) return ALL_TIMES;

    if (isToday(selectedDate)) {
      const now = currentTime;
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      return ALL_TIMES.filter(time => {
        const [hours, minutes] = time.split(":").map(Number);
        if (hours > currentHours) return true;
        if (hours === currentHours && minutes > currentMinutes + 30) return true;
        return false;
      });
    }

    return ALL_TIMES;
  }, [selectedDate, currentTime, isToday]);

  const visibleTimes = getVisibleTimes();

  const formatDateISO = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    async function loadBookedSlots() {
      if (!selectedDate || !coiffeur) {
        setBookedSlots([]);
        return;
      }

      if (totalDuration === 0) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);

      const dateStr = formatDateISO(selectedDate);
      const availableSlots = await getCoiffeurAvailableSlots(
        coiffeur.id,
        dateStr,
        totalDuration
      );

      const booked = ALL_TIMES.filter(time => !availableSlots.includes(time));
      setBookedSlots(booked);
      setLoadingSlots(false);
    }

    loadBookedSlots();
  }, [selectedDate, coiffeur, totalDuration, formatDateISO]);

  useEffect(() => {
    if (selectedTime) {
      const isVisible = visibleTimes.includes(selectedTime);
      const isBooked = bookedSlots.includes(selectedTime);
      if (!isVisible || isBooked) {
        setSelectedTime(null);
      }
    }
  }, [visibleTimes, bookedSlots, selectedTime]);

  useEffect(() => {
    if (visible) {
      if (preselectedServiceId && services.some(s => s.id === preselectedServiceId)) {
        setSelectedServiceIds([preselectedServiceId]);
      } else {
        setSelectedServiceIds([]);
      }

      setSelectedLocation("domicile"); // V1: Domicile uniquement
      setSelectedDate(null);
      setSelectedTime(null);
      setShowSuccess(false);
      setError(null);
      setCurrentTime(new Date());
      setBookedSlots([]);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, preselectedServiceId, services]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      onClose();
    });
  };

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds(prev => {
      return prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
    });
  }, []);

  const canBook = selectedServiceIds.length > 0 && selectedDate && selectedTime;

  const formatDateShort = useCallback((date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Auj.";
    if (date.toDateString() === tomorrow.toDateString()) return "Dem.";
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }, []);

  const formatDateFull = useCallback((date: Date) => {
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  const handleBook = async () => {
    if (!canBook || !coiffeur || !selectedDate || !selectedTime) return;

    // Vérifier l'adresse si domicile
    if (selectedLocation === "domicile" && !selectedAddress) {
      Alert.alert(
        "Adresse requise",
        "Veuillez ajouter une adresse pour la prestation à domicile.",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Ajouter une adresse", 
            onPress: () => router.push("/(app)/(shared)/account/address-form" as any)
          },
        ]
      );
      return;
    }

    if (isToday(selectedDate)) {
      const now = new Date();
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const bookingTime = new Date(selectedDate);
      bookingTime.setHours(hours, minutes, 0, 0);

      if (bookingTime <= now) {
        setError("Ce créneau n'est plus disponible. Veuillez en choisir un autre.");
        setSelectedTime(null);
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(hours, minutes, 0, 0);
      const startAt = bookingDate.toISOString();

      // Préparer l'address_snapshot si domicile
      let addressSnapshot: AddressSnapshot | undefined = undefined;
      if (selectedLocation === "domicile" && selectedAddress) {
        addressSnapshot = {
          address_line: selectedAddress.address_line,
          city: selectedAddress.city,
          postal_code: selectedAddress.postal_code,
          country: selectedAddress.country,
        };
      }

      // 1. Créer le booking (statut pending)
      const result = await createBooking({
        coiffeur_id: coiffeur.id,
        start_at: startAt,
        location: selectedLocation,
        home_fee_cents: homeFeeCents,
        address_snapshot: addressSnapshot,
        payment_method: selectedPayment,
        services: selectedServices.map((s, index) => ({
          service_id: s.id,
          service_name: s.name,
          price_cents: s.price_cents,
          duration_minutes: s.duration_minutes,
          position: index,
        })),
      });

      if (!result.success || !result.booking) {
        setError(result.error || "Erreur lors de la réservation");
        setIsProcessing(false);
        return;
      }

      const booking = result.booking;

      // 2. Créer le PaymentIntent (avec le montant en ligne uniquement)
      const paymentResult = await createPaymentIntent({
        booking_id: booking.id,
        amount_cents: totalCents,
      });

      if (!paymentResult.success || !paymentResult.clientSecret) {
        await cancelPendingBooking(booking.id);
        setError(paymentResult.error || "Erreur lors de la création du paiement");
        setIsProcessing(false);
        return;
      }

      // 3. Initialiser le PaymentSheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "ClipperConnect",
        paymentIntentClientSecret: paymentResult.clientSecret,
        defaultBillingDetails: {
          name: "",
        },
        style: "automatic",
      });

      if (initError) {
        await cancelPendingBooking(booking.id);
        setError("Erreur d'initialisation du paiement");
        setIsProcessing(false);
        return;
      }

      // 4. Afficher le PaymentSheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // L'utilisateur a annulé ou erreur
        if (paymentError.code === "Canceled") {
          // Annulation par l'utilisateur - supprimer le booking pending
          await cancelPendingBooking(booking.id);
          setError(null);
          setIsProcessing(false);
          return;
        }
        await markPaymentFailed(booking.id, paymentError.message);
        setError(paymentError.message || "Paiement échoué");
        setIsProcessing(false);
        return;
      }

      // 5. Paiement réussi - confirmer côté serveur
      await confirmPaymentSuccess(booking.id, paymentResult.paymentIntentId!);

      setIsProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        onClose();
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.replace("/(app)/(tabs)/activity" as any);
          }
        }, 100);
      }, 2000);

    } catch (e: any) {
      console.error("Booking error:", e);
      setError(e.message || "Une erreur est survenue");
      setIsProcessing(false);
    }
  };

  if (!coiffeur) return null;

  const offersHome = coiffeur.offers_home_service;
  const isSlotBooked = (time: string) => bookedSlots.includes(time);
  const availableVisibleTimes = visibleTimes.filter(time => !isSlotBooked(time));

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          {showSuccess ? (
            <View style={[styles.successContainer, { paddingBottom: insets.bottom + 40 }]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={48} color="#FFF" />
              </View>
              <Text style={styles.successTitle}>Réservation confirmée !</Text>
              <Text style={styles.successSubtitle}>
                Vous serez redirigé vers vos réservations...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Text style={styles.headerTitle}>Réserver</Text>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              {inspirationImage && (
                <View style={styles.inspirationContainer}>
                  <Image source={{ uri: inspirationImage }} style={styles.inspirationImage} />
                </View>
              )}

              <View style={styles.coiffeurCard}>
                {coiffeur.avatar_url ? (
                  <Image source={{ uri: coiffeur.avatar_url }} style={styles.coiffeurImage} />
                ) : (
                  <View style={[styles.coiffeurImage, styles.placeholder]}>
                    <Ionicons name="person" size={24} color={theme.textMuted} />
                  </View>
                )}
                <View style={styles.coiffeurInfo}>
                  <Text style={styles.coiffeurName}>{coiffeur.display_name || "Coiffeur"}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.ratingText}>{Number(coiffeur.rating).toFixed(1)}</Text>
                    <Text style={styles.reviewsText}>({coiffeur.reviews_count || 0} avis)</Text>
                  </View>
                  <View style={styles.coiffeurMeta}>
                    <Text style={styles.coiffeurCity}>{coiffeur.city || ""}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Choisir vos prestations
                  {selectedServiceIds.length > 0 && (
                    <Text style={styles.sectionBadge}> ({selectedServiceIds.length})</Text>
                  )}
                </Text>
                {totalDuration > 0 && (
                  <Text style={styles.durationHint}>Durée totale : {totalDuration} min</Text>
                )}
                <View style={styles.servicesGrid}>
                  {services.map(service => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <Pressable
                        key={service.id}
                        style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                        onPress={() => toggleService(service.id)}
                      >
                        <View style={styles.serviceInfo}>
                          <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                            {service.name}
                          </Text>
                          <Text style={[styles.serviceDuration, isSelected && styles.serviceDurationSelected]}>
                            {service.duration_minutes} min
                          </Text>
                        </View>
                        <View style={styles.serviceRight}>
                          <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>
                            {formatPriceShort(service.price_cents)}
                          </Text>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {selectedServiceIds.length > 0 && (
                <View style={styles.section}>
                  {/* V2: Réactiver quand le parcours salon sera prêt
                  <Text style={styles.sectionTitle}>Lieu du rendez-vous</Text>
                  <View style={styles.locationOptions}>
                    <Pressable
                      style={[styles.locationOption, selectedLocation === "salon" && styles.locationOptionSelected]}
                      onPress={() => setSelectedLocation("salon")}
                    >
                      <Ionicons name="storefront" size={18} color={selectedLocation === "salon" ? "#FFF" : theme.text} />
                      <Text style={[styles.locationText, selectedLocation === "salon" && styles.locationTextSelected]}>
                        En salon
                      </Text>
                    </Pressable>
                    {offersHome && (
                      <Pressable
                        style={[styles.locationOption, selectedLocation === "domicile" && styles.locationOptionSelected]}
                        onPress={() => setSelectedLocation("domicile")}
                      >
                        <Ionicons name="home" size={18} color={selectedLocation === "domicile" ? "#FFF" : theme.text} />
                        <Text style={[styles.locationText, selectedLocation === "domicile" && styles.locationTextSelected]}>
                          À domicile
                        </Text>
                        <Text style={[styles.locationFee, selectedLocation === "domicile" && styles.locationFeeSelected]}>
                          +{formatPriceShort(coiffeur.home_service_fee_cents || 0)}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  */}

                  {/* V1: Domicile uniquement - afficher un badge informatif */}
                  <View style={styles.homeOnlyBadge}>
                    <Ionicons name="home" size={18} color="#059669" />
                    <Text style={styles.homeOnlyText}>Prestation à domicile</Text>
                    {(coiffeur.home_service_fee_cents || 0) > 0 && (
                      <Text style={styles.homeOnlyFee}>+{formatPriceShort(coiffeur.home_service_fee_cents || 0)} déplacement</Text>
                    )}
                  </View>

                  {/* Afficher l'adresse si domicile sélectionné */}
                  {selectedLocation === "domicile" && (
                    <View style={styles.addressSection}>
                      {selectedAddress ? (
                        <Pressable 
                          style={styles.addressCard}
                          onPress={() => setShowAddressPicker(true)}
                        >
                          <View style={styles.addressCardIcon}>
                            <Ionicons name="location" size={20} color={theme.text} />
                          </View>
                          <View style={styles.addressCardContent}>
                            <Text style={styles.addressCardLabel}>{selectedAddress.label || "Adresse"}</Text>
                            <Text style={styles.addressCardLine}>{selectedAddress.address_line}</Text>
                            <Text style={styles.addressCardCity}>{selectedAddress.postal_code} {selectedAddress.city}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                        </Pressable>
                      ) : (
                        <Pressable 
                          style={styles.addAddressButton}
                          onPress={() => router.push("/(app)/(shared)/account/address-form" as any)}
                        >
                          <Ionicons name="add-circle-outline" size={22} color={theme.text} />
                          <Text style={styles.addAddressText}>Ajouter une adresse</Text>
                        </Pressable>
                      )}

                      {/* Instructions si présentes */}
                      {selectedAddress?.instructions && (
                        <View style={styles.instructionsBox}>
                          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
                          <Text style={styles.instructionsText}>{selectedAddress.instructions}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {selectedServiceIds.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Choisir une date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.datesRow}>
                      {availableDates.map((date, index) => {
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        return (
                          <Pressable
                            key={index}
                            style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                            onPress={() => { setSelectedDate(date); setSelectedTime(null); }}
                          >
                            <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                              {formatDateShort(date)}
                            </Text>
                            <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                              {date.getDate()}
                            </Text>
                            <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                              {date.toLocaleDateString("fr-FR", { month: "short" })}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {selectedDate && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Choisir une heure</Text>
                    {loadingSlots && (
                      <ActivityIndicator size="small" color={theme.textMuted} />
                    )}
                  </View>
                  {isToday(selectedDate) && visibleTimes.length > 0 && (
                    <Text style={styles.sectionSubtitle}>
                      Créneaux disponibles à partir de maintenant
                    </Text>
                  )}
                  {!loadingSlots && visibleTimes.length === 0 ? (
                    <View style={styles.noTimesCard}>
                      <Ionicons name="time-outline" size={24} color={theme.textMuted} />
                      <Text style={styles.noTimesText}>
                        Plus de créneaux disponibles ce jour
                      </Text>
                      <Text style={styles.noTimesHint}>
                        Sélectionnez une autre date
                      </Text>
                    </View>
                  ) : !loadingSlots && availableVisibleTimes.length === 0 ? (
                    <View style={styles.noTimesCard}>
                      <Ionicons name="calendar-outline" size={24} color={theme.textMuted} />
                      <Text style={styles.noTimesText}>
                        Tous les créneaux sont réservés
                      </Text>
                      <Text style={styles.noTimesHint}>
                        Sélectionnez une autre date
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.timesGrid}>
                      {visibleTimes.map(time => {
                        const isSelected = selectedTime === time;
                        const isBooked = isSlotBooked(time);
                        return (
                          <Pressable
                            key={time}
                            style={[
                              styles.timeSlot,
                              isSelected && styles.timeSlotSelected,
                              isBooked && styles.timeSlotDisabled,
                            ]}
                            onPress={() => !isBooked && setSelectedTime(time)}
                            disabled={isBooked}
                          >
                            <Text style={[
                              styles.timeText,
                              isSelected && styles.timeTextSelected,
                              isBooked && styles.timeTextDisabled,
                            ]}>
                              {time}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {canBook && (
                <View style={styles.section}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Récapitulatif</Text>
                    {selectedServices.map(s => (
                      <View key={s.id} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{s.name}</Text>
                        <Text style={styles.summaryValue}>{formatPriceShort(s.price_cents)}</Text>
                      </View>
                    ))}
                    {homeFeeCents > 0 && (
                      <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelRow}>
                          <Text style={styles.summaryLabel}>Déplacement</Text>
                          <Ionicons name="home" size={12} color={theme.textMuted} />
                        </View>
                        <Text style={styles.summaryValue}>{formatPriceShort(homeFeeCents)}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelRow}>
                        <Text style={styles.summaryLabel}>Frais de service</Text>
                        <Ionicons name="shield-checkmark-outline" size={12} color={theme.textMuted} />
                      </View>
                      <Text style={styles.summaryValue}>{formatPriceShort(platformFeeCents)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                      <Text style={styles.summaryLabelTotal}>Total</Text>
                      <Text style={styles.summaryValueTotal}>{formatPriceShort(totalCents)}</Text>
                    </View>
                    <View style={styles.summaryMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                        <Text style={styles.metaText}>{totalDuration} min</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                        <Text style={styles.metaText}>{formatDateFull(selectedDate!)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name={selectedLocation === "salon" ? "storefront" : "home"} size={14} color={theme.textMuted} />
                        <Text style={styles.metaText}>{selectedLocation === "salon" ? "Salon" : "Domicile"}</Text>
                      </View>
                    </View>
                  </View>

                  {error && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={18} color="#C62828" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <Pressable
                    style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                    onPress={handleBook}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <View style={styles.payButtonLoading}>
                        <ActivityIndicator color="#FFF" size="small" />
                        <Text style={styles.payButtonText}>Paiement en cours...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.payButtonText}>Payer {formatPriceShort(totalCents)}</Text>
                        <Ionicons name="lock-closed" size={16} color="#FFF" />
                      </>
                    )}
                  </Pressable>
                  <Text style={styles.secureText}>
                    <Ionicons name="shield-checkmark" size={12} color={theme.textMuted} /> Paiement sécurisé
                  </Text>
                </View>
              )}

              {selectedServiceIds.length === 0 && (
                <View style={styles.hintCard}>
                  <Ionicons name="cut-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.hintText}>Sélectionnez une ou plusieurs prestations</Text>
                </View>
              )}

              <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
          )}
        </Animated.View>
      </View>

      {/* Modal de sélection d'adresse */}
      <Modal
        visible={showAddressPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <View style={styles.addressPickerOverlay}>
          <View style={styles.addressPickerContent}>
            <View style={styles.addressPickerHeader}>
              <Text style={styles.addressPickerTitle}>Choisir une adresse</Text>
              <Pressable onPress={() => setShowAddressPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.addressPickerList}>
              {addresses.map((addr) => (
                <Pressable
                  key={addr.id}
                  style={[
                    styles.addressPickerItem,
                    selectedAddress?.id === addr.id && styles.addressPickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedAddress(addr);
                    setShowAddressPicker(false);
                  }}
                >
                  <View style={styles.addressPickerItemIcon}>
                    <Ionicons 
                      name={addr.label === "Travail" ? "briefcase-outline" : "home-outline"} 
                      size={20} 
                      color={selectedAddress?.id === addr.id ? "#FFF" : theme.text} 
                    />
                  </View>
                  <View style={styles.addressPickerItemContent}>
                    <Text style={[
                      styles.addressPickerItemLabel,
                      selectedAddress?.id === addr.id && styles.addressPickerItemTextSelected,
                    ]}>
                      {addr.label || "Adresse"}
                    </Text>
                    <Text style={[
                      styles.addressPickerItemAddress,
                      selectedAddress?.id === addr.id && styles.addressPickerItemTextSelected,
                    ]}>
                      {addr.address_line}, {addr.city}
                    </Text>
                  </View>
                  {selectedAddress?.id === addr.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  )}
                </Pressable>
              ))}
              <Pressable
                style={styles.addressPickerAddButton}
                onPress={() => {
                  setShowAddressPicker(false);
                  router.push("/(app)/(shared)/account/address-form" as any);
                }}
              >
                <Ionicons name="add-circle-outline" size={22} color={theme.text} />
                <Text style={styles.addressPickerAddText}>Ajouter une nouvelle adresse</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.92, minHeight: height * 0.5 },

  handleContainer: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: theme.text },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },

  inspirationContainer: { paddingHorizontal: 20, marginBottom: 16 },
  inspirationImage: { width: "100%", height: 180, borderRadius: 16 },

  coiffeurCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 14, backgroundColor: theme.card, borderRadius: 16, marginBottom: 24 },
  coiffeurImage: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  placeholder: { backgroundColor: theme.border, alignItems: "center", justifyContent: "center" },
  coiffeurInfo: { flex: 1 },
  coiffeurName: { fontSize: 17, fontWeight: "600", color: theme.text },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "600", color: theme.text },
  reviewsText: { fontSize: 13, color: theme.textMuted },
  coiffeurMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  coiffeurCity: { fontSize: 13, color: theme.textMuted },
  coiffeurPrice: { fontSize: 13, fontWeight: "600", color: theme.success },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  sectionSubtitle: { fontSize: 13, color: theme.success, marginBottom: 12, marginTop: -8 },
  sectionBadge: { color: theme.success, fontWeight: "bold" },
  durationHint: { fontSize: 13, color: theme.textMuted, marginBottom: 12, marginTop: -4 },

  servicesGrid: { gap: 10 },
  serviceCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, backgroundColor: theme.card, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  serviceCardSelected: { borderColor: theme.text, backgroundColor: "#F0F0F0" },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "600", color: theme.text },
  serviceNameSelected: { color: theme.text },
  serviceDuration: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  serviceDurationSelected: { color: theme.textSecondary },
  serviceRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  servicePrice: { fontSize: 17, fontWeight: "bold", color: theme.text },
  servicePriceSelected: { color: theme.text },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: theme.text, borderColor: theme.text },

  locationOptions: { flexDirection: "row", gap: 10 },
  locationOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: theme.card, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  locationOptionSelected: { backgroundColor: theme.text, borderColor: theme.text },
  locationText: { fontSize: 14, fontWeight: "600", color: theme.text },
  locationTextSelected: { color: "#FFF" },
  locationFee: { fontSize: 12, color: theme.textMuted },
  locationFeeSelected: { color: "rgba(255,255,255,0.7)" },

  // V1: Badge domicile uniquement
  homeOnlyBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#ECFDF5", borderRadius: 12, marginBottom: 8 },
  homeOnlyText: { fontSize: 14, fontWeight: "600", color: "#059669" },
  homeOnlyFee: { fontSize: 12, color: "#10B981", marginLeft: "auto" },

  datesRow: { flexDirection: "row", gap: 10 },
  dateCard: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.card, borderRadius: 14, minWidth: 65 },
  dateCardSelected: { backgroundColor: theme.text },
  dateDay: { fontSize: 11, color: theme.textMuted, marginBottom: 2, textTransform: "capitalize" },
  dateDaySelected: { color: "rgba(255,255,255,0.7)" },
  dateNum: { fontSize: 20, fontWeight: "bold", color: theme.text },
  dateNumSelected: { color: "#FFF" },
  dateMonth: { fontSize: 11, color: theme.textMuted, marginTop: 2, textTransform: "capitalize" },
  dateMonthSelected: { color: "rgba(255,255,255,0.7)" },

  timesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeSlot: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.card, borderRadius: 12 },
  timeSlotSelected: { backgroundColor: theme.text },
  timeSlotDisabled: { backgroundColor: theme.disabled, opacity: 0.5 },
  timeText: { fontSize: 14, fontWeight: "500", color: theme.text },
  timeTextSelected: { color: "#FFF" },
  timeTextDisabled: { color: theme.textMuted },

  noTimesCard: { alignItems: "center", paddingVertical: 32, backgroundColor: theme.card, borderRadius: 14, gap: 8 },
  noTimesText: { fontSize: 15, fontWeight: "600", color: theme.text },
  noTimesHint: { fontSize: 13, color: theme.textMuted },

  summaryCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryRowTotal: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, marginBottom: 0 },
  summaryLabel: { fontSize: 14, color: theme.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: "500", color: theme.text },
  summaryLabelTotal: { fontSize: 16, fontWeight: "600", color: theme.text },
  summaryValueTotal: { fontSize: 22, fontWeight: "bold", color: theme.text },
  summaryMeta: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: theme.textMuted, textTransform: "capitalize" },

  paymentOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: "transparent" },
  paymentOptionSelected: { borderColor: theme.text },
  paymentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
  paymentTitle: { fontSize: 15, fontWeight: "600", color: theme.text },
  paymentDescription: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: theme.text },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.text },

  cashInfoBox: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, backgroundColor: "#FEF3C7", borderRadius: 12, marginTop: 6, marginBottom: 10 },
  cashInfoContent: { flex: 1 },
  cashInfoTitle: { fontSize: 14, fontWeight: "600", color: "#92400E", marginBottom: 4 },
  cashInfoText: { fontSize: 13, color: "#A16207", lineHeight: 18 },

  errorContainer: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFEBEE", padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 13, color: "#C62828" },

  payButton: { backgroundColor: theme.text, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8, marginTop: 10 },
  payButtonDisabled: { backgroundColor: "#999" },
  payButtonLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
  payButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  secureText: { fontSize: 12, color: theme.textMuted, textAlign: "center", marginTop: 12 },

  hintCard: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 16 },
  hintText: { fontSize: 15, color: theme.textMuted },

  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.success, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: "bold", color: theme.text, marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: theme.textMuted, textAlign: "center" },

  // Styles pour les adresses
  addressSection: { marginTop: 16 },
  addressCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 14, padding: 14 },
  addressCardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: "center", justifyContent: "center", marginRight: 12 },
  addressCardContent: { flex: 1 },
  addressCardLabel: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 2 },
  addressCardLine: { fontSize: 13, color: theme.textSecondary },
  addressCardCity: { fontSize: 12, color: theme.textMuted },
  addAddressButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, backgroundColor: theme.card, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: theme.border },
  addAddressText: { fontSize: 14, fontWeight: "500", color: theme.text },
  instructionsBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10, padding: 10, backgroundColor: "#FFF8E1", borderRadius: 10 },
  instructionsText: { flex: 1, fontSize: 12, color: "#F57C00", fontStyle: "italic" },

  // Address Picker Modal
  addressPickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  addressPickerContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.6, paddingBottom: 40 },
  addressPickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  addressPickerTitle: { fontSize: 18, fontWeight: "600", color: theme.text },
  addressPickerList: { paddingHorizontal: 20, paddingTop: 16 },
  addressPickerItem: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: theme.card, borderRadius: 14, marginBottom: 10 },
  addressPickerItemSelected: { backgroundColor: theme.text },
  addressPickerItemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: "center", justifyContent: "center", marginRight: 12 },
  addressPickerItemContent: { flex: 1 },
  addressPickerItemLabel: { fontSize: 15, fontWeight: "600", color: theme.text, marginBottom: 2 },
  addressPickerItemAddress: { fontSize: 13, color: theme.textSecondary },
  addressPickerItemTextSelected: { color: "#FFF" },
  addressPickerAddButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderWidth: 2, borderStyle: "dashed", borderColor: theme.border, borderRadius: 14, marginTop: 6 },
  addressPickerAddText: { fontSize: 14, fontWeight: "500", color: theme.text },
});