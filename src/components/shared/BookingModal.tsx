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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { createBooking, confirmPayment, getCoiffeurAvailableSlots } from "@/api/bookings";
import type { Service, CoiffeurWithDetails } from "@/types/database";
import { formatPriceShort } from "@/types/database";
import { ROUTES } from "@/constants/routes";

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

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<"salon" | "domicile">("salon");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"card" | "apple" | "google">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Calculer les services sélectionnés et la durée totale
  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );
  
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0),
    [selectedServices]
  );

  const subtotalCents = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price_cents, 0),
    [selectedServices]
  );

  const homeFeeCents = selectedLocation === "domicile" ? (coiffeur?.home_service_fee_cents || 0) : 0;
  const totalCents = subtotalCents + homeFeeCents;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getVisibleTimes = () => {
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
  };

  const visibleTimes = getVisibleTimes();

  // Charger les créneaux réservés quand la date OU la durée change
  useEffect(() => {
    async function loadBookedSlots() {
      if (!selectedDate || !coiffeur || totalDuration === 0) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);

      const dateStr = formatDateISO(selectedDate);
      const availableSlots = await getCoiffeurAvailableSlots(
        coiffeur.id,
        dateStr,
        totalDuration // Passer la durée totale des services sélectionnés
      );

      const booked = ALL_TIMES.filter(time => !availableSlots.includes(time));
      setBookedSlots(booked);

      setLoadingSlots(false);
    }

    loadBookedSlots();
  }, [selectedDate, coiffeur, totalDuration]); // ← totalDuration ajouté ici

  useEffect(() => {
    if (selectedTime) {
      const isVisible = visibleTimes.includes(selectedTime);
      const isBooked = bookedSlots.includes(selectedTime);
      if (!isVisible || isBooked) {
        setSelectedTime(null);
      }
    }
  }, [visibleTimes, bookedSlots]);

  useEffect(() => {
    if (visible) {
      if (preselectedServiceId && services.some(s => s.id === preselectedServiceId)) {
        setSelectedServiceIds([preselectedServiceId]);
      } else {
        setSelectedServiceIds([]);
      }

      setSelectedLocation(coiffeur?.offers_home_service ? "salon" : "salon");
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

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const canBook = selectedServiceIds.length > 0 && selectedDate && selectedTime;

  const formatDateShort = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Auj.";
    if (date.toDateString() === tomorrow.toDateString()) return "Dem.";
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleBook = async () => {
    if (!canBook || !coiffeur || !selectedDate || !selectedTime) return;

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

      const result = await createBooking({
        coiffeur_id: coiffeur.id,
        start_at: startAt,
        location: selectedLocation,
        home_fee_cents: homeFeeCents,
        services: selectedServices.map((s, index) => ({
          service_id: s.id,
          service_name: s.name,
          price_cents: s.price_cents,
          duration_minutes: s.duration_minutes,
          position: index,
        })),
      });

      if (result.success && result.booking) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await confirmPayment(result.booking.id, `pi_simulated_${Date.now()}`);

        setIsProcessing(false);
        setShowSuccess(true);

        setTimeout(() => {
          handleClose();
          if (onSuccess) {
            onSuccess();
          } else {
            router.replace(ROUTES.CLIENT.ACTIVITY);
          }
        }, 2000);
      } else {
        setError(result.error || "Erreur lors de la réservation");
        setIsProcessing(false);
      }
    } catch (e) {
      setError("Une erreur est survenue");
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
                  <Text style={styles.coiffeurCity}>{coiffeur.city || ""}</Text>
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

                  <Text style={styles.sectionTitle}>Mode de paiement</Text>
                  {(["card", "apple", "google"] as const).map(method => (
                    <Pressable
                      key={method}
                      style={[styles.paymentOption, selectedPayment === method && styles.paymentOptionSelected]}
                      onPress={() => setSelectedPayment(method)}
                    >
                      <View style={styles.paymentLeft}>
                        <View style={styles.paymentIcon}>
                          <Ionicons
                            name={method === "card" ? "card-outline" : method === "apple" ? "logo-apple" : "logo-google"}
                            size={20}
                            color={theme.text}
                          />
                        </View>
                        <Text style={styles.paymentTitle}>
                          {method === "card" ? "Carte bancaire" : method === "apple" ? "Apple Pay" : "Google Pay"}
                        </Text>
                      </View>
                      <View style={[styles.radio, selectedPayment === method && styles.radioSelected]}>
                        {selectedPayment === method && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  ))}

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
  coiffeurCity: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

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
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: theme.text },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.text },

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
});