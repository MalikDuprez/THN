// app/(app)/(pro)/(tabs)/agenda.tsx
import { 
  View, 
  Text, 
  ScrollView,       
  Pressable,                                                                                        
  StyleSheet,
  Modal,                   
  Animated,                                                                           
  Dimensions,
  Image,
  PanResponder,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  getCoiffeurBookingsByDate,
  getCoiffeurDatesWithBookings,
  getBookingById,
  acceptBooking,
  declineBooking,
  completeBooking,
  markNoShow,
  cancelBooking,
} from "@/api/bookings";
import { getOrCreateConversationAsCoiffeur } from "@/api/messaging";
import type { BookingWithDetails } from "@/types/database";

const { height } = Dimensions.get("window");

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
// CONSTANTES
// ============================================
const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const CANCEL_REASONS = [
  { id: "unavailable", label: "Indisponibilité (urgence personnelle, maladie...)", icon: "medical-outline" as const },
  { id: "schedule", label: "Problème de planning / double réservation", icon: "calendar-outline" as const },
  { id: "unreachable", label: "Client injoignable", icon: "call-outline" as const },
  { id: "other", label: "Autre raison", icon: "create-outline" as const },
];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const ALL_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00",
];

// ============================================
// HELPERS
// ============================================
const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending": return { color: theme.warning, bg: theme.warningLight, label: "À confirmer" };
    case "confirmed": return { color: theme.success, bg: theme.successLight, label: "Confirmé" };
    case "completed": return { color: theme.accent, bg: theme.accentLight, label: "Terminé" };
    case "no_show": return { color: theme.error, bg: theme.errorLight, label: "Absent" };
    default: return { color: theme.textMuted, bg: theme.card, label: status };
  }
};

const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const formatPrice = (cents: number): string => {
  return `${(cents / 100).toFixed(0)}€`;
};

const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getWeekDays = (date: Date) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    week.push({
      day: d.getDate(),
      weekDay: DAYS_OF_WEEK[i],
      date: d,
      dateKey: formatDateKey(d),
      isToday: d.toDateString() === new Date().toDateString(),
    });
  }
  return week;
};

// ============================================
// COMPOSANTS
// ============================================
const DayButton = ({ day, weekDay, hasAppointments, isToday, isSelected, onPress }: {
  day: number;
  weekDay: string;
  hasAppointments: boolean;
  isToday?: boolean;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.dayWeekText, isSelected && styles.dayWeekTextSelected]}>
      {weekDay}
    </Text>
    <Text style={[
      styles.dayNumberText,
      isSelected && styles.dayNumberTextSelected,
      isToday && !isSelected && styles.dayNumberToday,
    ]}>
      {day}
    </Text>
    {hasAppointments && (
      <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />
    )}
  </Pressable>
);

const TimeSlot = ({ time, booking, onPress }: { 
  time: string; 
  booking: BookingWithDetails | null;
  onPress: () => void;
}) => {
  if (!booking) {
    return (
      <View style={styles.slotRow}>
        <Text style={styles.slotTime}>{time}</Text>
        <View style={styles.slotAvailable}>
          <View style={styles.slotAvailableLine} />
          <Text style={styles.slotAvailableText}>Disponible</Text>
        </View>
      </View>
    );
  }

  const status = getStatusStyle(booking.status);
  const clientName = booking.client?.full_name || 
    `${booking.client?.first_name || ""} ${booking.client?.last_name || ""}`.trim() || 
    "Client";
  const clientImage = booking.client?.avatar_url || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";
  
  const services = booking.items || [];
  const mainService = services.length > 0 ? services[0].service_name : "Prestation";

  return (
    <View style={styles.slotRow}>
      <Text style={styles.slotTime}>{time}</Text>
      <Pressable 
        style={[styles.slotAppointment, { borderLeftColor: status.color }]} 
        onPress={onPress}
      >
        <Image source={{ uri: clientImage }} style={styles.slotAvatar} />
        <View style={styles.slotAppointmentInfo}>
          <Text style={styles.slotClient}>{clientName}</Text>
          <Text style={styles.slotService} numberOfLines={1}>{mainService}</Text>
        </View>
        <View style={styles.slotAppointmentRight}>
          <Text style={styles.slotPrice}>{formatPrice(booking.total_cents)}</Text>
          <View style={[styles.slotStatus, { backgroundColor: status.bg }]}>
            <Text style={[styles.slotStatusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <View style={styles.emptyState}>
    <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

// ============================================
// MODALE DÉTAIL RDV
// ============================================
const AppointmentDetailModal = ({ visible, onClose, booking, onAction }: {
  visible: boolean;
  onClose: () => void;
  booking: BookingWithDetails | null;
  onAction: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && booking) {
      translateY.setValue(height);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, booking]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleAccept = async () => {
    if (!booking) return;
    setLoading(true);
    const success = await acceptBooking(booking.id);
    setLoading(false);
    if (success) {
      Alert.alert("Succès", "Réservation confirmée !");
      handleClose();
      onAction();
    } else {
      Alert.alert("Erreur", "Impossible de confirmer la réservation");
    }
  };

  const handleDecline = async () => {
    if (!booking) return;
    
    Alert.alert(
      "Refuser la réservation",
      "Êtes-vous sûr de vouloir refuser cette réservation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await declineBooking(booking.id, "Refusé par le coiffeur");
            setLoading(false);
            if (success) {
              Alert.alert("Succès", "Réservation refusée");
              handleClose();
              onAction();
            } else {
              Alert.alert("Erreur", "Impossible de refuser la réservation");
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!booking) return;
    setLoading(true);
    const success = await completeBooking(booking.id);
    setLoading(false);
    if (success) {
      Alert.alert("Succès", "Prestation terminée !");
      handleClose();
      onAction();
    } else {
      Alert.alert("Erreur", "Impossible de terminer la prestation");
    }
  };

  const handleNoShow = async () => {
    if (!booking) return;
    
    Alert.alert(
      "Client absent",
      "Marquer ce client comme absent ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await markNoShow(booking.id);
            setLoading(false);
            if (success) {
              Alert.alert("Noté", "Client marqué comme absent");
              handleClose();
              onAction();
            } else {
              Alert.alert("Erreur", "Impossible de mettre à jour le statut");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (!booking) return;
    setSelectedReason(null);
    setCustomReason("");
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!booking || !selectedReason) return;
    
    // Construire le message de raison
    let reasonMessage = "";
    if (selectedReason === "other") {
      reasonMessage = customReason.trim() || "Annulé par le coiffeur";
    } else {
      const reason = CANCEL_REASONS.find(r => r.id === selectedReason);
      reasonMessage = reason?.label || "Annulé par le coiffeur";
    }
    
    setCancelModalVisible(false);
    setLoading(true);
    const success = await cancelBooking(booking.id, reasonMessage);
    setLoading(false);
    
    if (success) {
      Alert.alert("Annulé", "Le rendez-vous a été annulé et le client a été notifié.");
      handleClose();
      onAction();
    } else {
      Alert.alert("Erreur", "Impossible d'annuler le rendez-vous");
    }
  };

  const handleMessage = async () => {
    if (!booking?.client_id) return;
    
    setLoading(true);
    const conversation = await getOrCreateConversationAsCoiffeur(booking.client_id, booking.id);
    setLoading(false);
    
    if (conversation) {
      handleClose();
      router.push({
        pathname: "/(app)/(pro)/conversation/[id]",
        params: { id: conversation.id }
      });
    } else {
      Alert.alert("Erreur", "Impossible d'ouvrir la conversation");
    }
  };

  if (!booking) return null;

  const status = getStatusStyle(booking.status);
  const clientName = booking.client?.full_name || 
    `${booking.client?.first_name || ""} ${booking.client?.last_name || ""}`.trim() || 
    "Client";
  const clientImage = booking.client?.avatar_url || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";
  
  const services = booking.items || [];
  const bookingDate = new Date(booking.start_at);
  const isToday = bookingDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday 
    ? "Aujourd'hui" 
    : bookingDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.detailModal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
          </View>

          <View style={styles.detailContent}>
            {/* Client Info */}
            <View style={styles.detailClientSection}>
              <Image source={{ uri: clientImage }} style={styles.detailAvatar} />
              <Text style={styles.detailClientName}>{clientName}</Text>
              <View style={[styles.detailStatusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.detailStatusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailInfoSection}>
              <View style={styles.detailInfoRow}>
                <Ionicons name="calendar-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>{dateLabel}</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>
                  {formatTime(booking.start_at)} - {formatTime(booking.end_at)} ({booking.total_duration_minutes} min)
                </Text>
              </View>
              
              {services.map((service, index) => (
                <View key={index} style={styles.detailInfoRow}>
                  <Ionicons name="cut-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailInfoText}>{service.service_name}</Text>
                  <Text style={styles.detailInfoPrice}>{formatPrice(service.price_cents)}</Text>
                </View>
              ))}
              
              <View style={[styles.detailInfoRow, styles.detailTotalRow]}>
                <Ionicons name="cash-outline" size={20} color={theme.text} />
                <Text style={styles.detailTotalLabel}>Total</Text>
                <Text style={styles.detailTotalPrice}>{formatPrice(booking.total_cents)}</Text>
              </View>

              {booking.location === "domicile" && (
                <View style={styles.detailInfoRow}>
                  <Ionicons name="home-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailInfoText}>À domicile</Text>
                </View>
              )}

              {booking.client_notes && (
                <View style={styles.detailInfoRow}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailInfoText} numberOfLines={3}>{booking.client_notes}</Text>
                </View>
              )}
            </View>

            {/* Actions secondaires */}
            <View style={styles.detailActions}>
              <Pressable style={styles.detailActionSecondary} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionSecondaryText}>Message</Text>
              </Pressable>
              <Pressable style={styles.detailActionSecondary}>
                <Ionicons name="call-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionSecondaryText}>Appeler</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.accent} style={{ marginVertical: 20 }} />
            ) : (
              <>
                {/* Actions pour RDV en attente */}
                {booking.status === "pending" && (
                  <View style={styles.detailMainActions}>
                    <Pressable style={styles.detailDeclineButton} onPress={handleDecline}>
                      <Text style={styles.detailDeclineText}>Refuser</Text>
                    </Pressable>
                    <Pressable style={styles.detailAcceptButton} onPress={handleAccept}>
                      <Text style={styles.detailAcceptText}>Accepter</Text>
                    </Pressable>
                  </View>
                )}

                {/* Actions pour RDV confirmé */}
                {booking.status === "confirmed" && (
                  <View style={styles.confirmedActions}>
                    <Pressable style={styles.detailCompleteButton} onPress={handleComplete}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.white} />
                      <Text style={styles.detailCompleteText}>Marquer comme terminé</Text>
                    </Pressable>
                    <View style={styles.secondaryActionsRow}>
                      <Pressable style={styles.cancelButton} onPress={handleCancel}>
                        <Ionicons name="close-circle-outline" size={18} color={theme.error} />
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </Pressable>
                      <Pressable style={styles.noShowButton} onPress={handleNoShow}>
                        <Ionicons name="person-remove-outline" size={18} color={theme.warning} />
                        <Text style={styles.noShowText}>Client absent</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Modale de raison d'annulation */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContent}>
            <Text style={styles.cancelModalTitle}>Raison de l'annulation</Text>
            <Text style={styles.cancelModalSubtitle}>
              Sélectionnez la raison pour informer le client
            </Text>
            
            <View style={styles.cancelReasonsList}>
              {CANCEL_REASONS.map((reason) => (
                <Pressable
                  key={reason.id}
                  style={[
                    styles.cancelReasonItem,
                    selectedReason === reason.id && styles.cancelReasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <Ionicons 
                    name={reason.icon} 
                    size={22} 
                    color={selectedReason === reason.id ? theme.error : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.cancelReasonText,
                    selectedReason === reason.id && styles.cancelReasonTextSelected,
                  ]}>
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.error} />
                  )}
                </Pressable>
              ))}
            </View>

            {selectedReason === "other" && (
              <TextInput
                style={styles.cancelReasonInput}
                placeholder="Précisez la raison..."
                placeholderTextColor={theme.textMuted}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                maxLength={200}
              />
            )}

            <View style={styles.cancelModalActions}>
              <Pressable 
                style={styles.cancelModalCancelBtn}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.cancelModalCancelText}>Retour</Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.cancelModalConfirmBtn,
                  (!selectedReason || (selectedReason === "other" && !customReason.trim())) && styles.cancelModalConfirmBtnDisabled,
                ]}
                onPress={handleConfirmCancel}
                disabled={!selectedReason || (selectedReason === "other" && !customReason.trim())}
              >
                <Text style={styles.cancelModalConfirmText}>Confirmer l'annulation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState(getWeekDays(new Date()));
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [datesWithBookings, setDatesWithBookings] = useState<Set<string>>(new Set());
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger un booking depuis une notification
  useEffect(() => {
    const loadBookingFromParams = async () => {
      if (bookingId) {
        const booking = await getBookingById(bookingId);
        if (booking) {
          const bookingDate = new Date(booking.start_at);
          setSelectedDate(bookingDate);
          setWeekDays(getWeekDays(bookingDate));
          setSelectedBooking(booking);
        }
      }
    };
    loadBookingFromParams();
  }, [bookingId]);

  const loadBookings = useCallback(async () => {
    try {
      const data = await getCoiffeurBookingsByDate(selectedDate);
      setBookings(data);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  const loadDatesWithBookings = useCallback(async () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    try {
      const dates = await getCoiffeurDatesWithBookings(startOfMonth, endOfMonth);
      setDatesWithBookings(new Set(dates));
    } catch (error) {
      console.error("Error loading dates with bookings:", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    loadDatesWithBookings();
  }, [loadDatesWithBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
    loadDatesWithBookings();
  }, [loadBookings, loadDatesWithBookings]);

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
    setWeekDays(getWeekDays(newDate));
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
    setWeekDays(getWeekDays(newDate));
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleBookingPress = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
  };

  const getScheduleSlots = () => {
    const bookingsByTime = new Map<string, BookingWithDetails>();
    const occupiedSlots = new Set<string>();

    bookings.forEach(booking => {
      const startTime = formatTime(booking.start_at);
      bookingsByTime.set(startTime, booking);
      
      const startMinutes = new Date(booking.start_at).getHours() * 60 + new Date(booking.start_at).getMinutes();
      const duration = booking.total_duration_minutes || 30;
      
      for (let m = 0; m < duration; m += 30) {
        const slotMinutes = startMinutes + m;
        const hours = Math.floor(slotMinutes / 60);
        const mins = slotMinutes % 60;
        const slotTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        occupiedSlots.add(slotTime);
      }
    });

    return ALL_TIME_SLOTS.map(time => {
      const booking = bookingsByTime.get(time);
      const isOccupied = occupiedSlots.has(time) && !booking;
      
      return {
        time,
        booking: booking || null,
        isOccupied,
      };
    }).filter(slot => !slot.isOccupied);
  };

  const scheduleSlots = getScheduleSlots();
  const currentMonth = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Agenda</Text>
        </View>

        <View style={styles.monthRow}>
          <Pressable style={styles.monthNavButton} onPress={handlePrevWeek}>
            <Ionicons name="chevron-back" size={20} color={theme.white} />
          </Pressable>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <Pressable style={styles.monthNavButton} onPress={handleNextWeek}>
            <Ionicons name="chevron-forward" size={20} color={theme.white} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((item) => (
            <DayButton
              key={item.dateKey}
              day={item.day}
              weekDay={item.weekDay}
              hasAppointments={datesWithBookings.has(item.dateKey)}
              isToday={item.isToday}
              isSelected={item.dateKey === formatDateKey(selectedDate)}
              onPress={() => handleDaySelect(item.date)}
            />
          ))}
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.daySummary}>
            <Text style={styles.daySummaryDate}>
              {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
            <Text style={styles.daySummaryCount}>
              {bookings.length} rendez-vous
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : bookings.length === 0 ? (
            <EmptyState message="Aucun rendez-vous ce jour" />
          ) : (
            <View style={styles.scheduleContainer}>
              {scheduleSlots.map((slot, index) => (
                <TimeSlot 
                  key={`${slot.time}-${index}`} 
                  time={slot.time} 
                  booking={slot.booking}
                  onPress={() => slot.booking && handleBookingPress(slot.booking)} 
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal détail */}
      <AppointmentDetailModal 
        visible={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking}
        onAction={() => {
          loadBookings();
          loadDatesWithBookings();
        }}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },
  header: { backgroundColor: theme.black, paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: theme.white },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  monthNavButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  monthText: { fontSize: 16, fontWeight: "600", color: theme.white, marginHorizontal: 20 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayButton: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, minWidth: 44 },
  dayButtonSelected: { backgroundColor: theme.white },
  dayWeekText: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500", marginBottom: 6 },
  dayWeekTextSelected: { color: theme.textMuted },
  dayNumberText: { fontSize: 16, fontWeight: "bold", color: theme.white },
  dayNumberTextSelected: { color: theme.text },
  dayNumberToday: { color: theme.accent },
  dayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.accent, marginTop: 6 },
  dayDotSelected: { backgroundColor: theme.accent },
  content: { flex: 1, backgroundColor: theme.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scrollView: { flex: 1, paddingTop: 20 },
  daySummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  daySummaryDate: { fontSize: 16, fontWeight: "600", color: theme.text, textTransform: "capitalize" },
  daySummaryCount: { fontSize: 14, color: theme.textSecondary },
  loadingContainer: { paddingVertical: 60, alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: theme.textMuted, marginTop: 12 },
  scheduleContainer: { paddingHorizontal: 20 },
  slotRow: { flexDirection: "row", marginBottom: 8 },
  slotTime: { width: 50, fontSize: 13, fontWeight: "500", color: theme.textMuted, paddingTop: 12 },
  slotAvailable: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.card, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: theme.border },
  slotAvailableLine: { width: 2, height: 16, backgroundColor: theme.border, marginRight: 10, borderRadius: 1 },
  slotAvailableText: { fontSize: 13, color: theme.textMuted },
  slotAppointment: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.accentLight, borderRadius: 12, borderLeftWidth: 3, gap: 10 },
  slotAvatar: { width: 36, height: 36, borderRadius: 18 },
  slotAppointmentInfo: { flex: 1 },
  slotClient: { fontSize: 14, fontWeight: "600", color: theme.text },
  slotService: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  slotAppointmentRight: { alignItems: "flex-end" },
  slotPrice: { fontSize: 14, fontWeight: "bold", color: theme.text, marginBottom: 4 },
  slotStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  slotStatusText: { fontSize: 10, fontWeight: "600" },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  dragIndicatorContainer: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  detailModal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailContent: { paddingHorizontal: 20, paddingBottom: 20 },
  detailClientSection: { alignItems: "center", marginBottom: 24 },
  detailAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  detailClientName: { fontSize: 22, fontWeight: "bold", color: theme.text, marginBottom: 8 },
  detailStatusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  detailStatusText: { fontSize: 14, fontWeight: "600" },
  detailInfoSection: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  detailInfoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  detailInfoText: { fontSize: 16, color: theme.text, flex: 1 },
  detailInfoPrice: { fontSize: 14, fontWeight: "600", color: theme.textSecondary },
  detailTotalRow: { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8, paddingTop: 12 },
  detailTotalLabel: { fontSize: 16, fontWeight: "600", color: theme.text, flex: 1 },
  detailTotalPrice: { fontSize: 18, fontWeight: "bold", color: theme.text },
  detailActions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  detailActionSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.card, paddingVertical: 14, borderRadius: 14 },
  detailActionSecondaryText: { fontSize: 15, fontWeight: "600", color: theme.text },
  detailMainActions: { flexDirection: "row", gap: 12 },
  detailDeclineButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.errorLight },
  detailDeclineText: { fontSize: 16, fontWeight: "600", color: theme.error },
  detailAcceptButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.success },
  detailAcceptText: { fontSize: 16, fontWeight: "600", color: theme.white },
  confirmedActions: { gap: 12 },
  detailCompleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: theme.accent },
  detailCompleteText: { fontSize: 16, fontWeight: "600", color: theme.white },
  secondaryActionsRow: { flexDirection: "row", gap: 10 },
  cancelButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.errorLight },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: theme.error },
  noShowButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.warningLight },
  noShowText: { fontSize: 14, fontWeight: "600", color: theme.warning },

  // Modale d'annulation
  cancelModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  cancelModalContent: { backgroundColor: theme.white, borderRadius: 24, padding: 24, width: "100%", maxWidth: 400 },
  cancelModalTitle: { fontSize: 20, fontWeight: "bold", color: theme.text, textAlign: "center", marginBottom: 8 },
  cancelModalSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: "center", marginBottom: 20 },
  cancelReasonsList: { gap: 10, marginBottom: 16 },
  cancelReasonItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: theme.card, borderWidth: 2, borderColor: "transparent" },
  cancelReasonItemSelected: { borderColor: theme.error, backgroundColor: theme.errorLight },
  cancelReasonText: { flex: 1, fontSize: 14, color: theme.text },
  cancelReasonTextSelected: { color: theme.error, fontWeight: "500" },
  cancelReasonInput: { backgroundColor: theme.card, borderRadius: 12, padding: 14, fontSize: 14, color: theme.text, minHeight: 80, textAlignVertical: "top", marginBottom: 16 },
  cancelModalActions: { flexDirection: "row", gap: 12 },
  cancelModalCancelBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: theme.card },
  cancelModalCancelText: { fontSize: 15, fontWeight: "600", color: theme.textSecondary },
  cancelModalConfirmBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: theme.error },
  cancelModalConfirmBtnDisabled: { backgroundColor: theme.textMuted },
  cancelModalConfirmText: { fontSize: 15, fontWeight: "600", color: theme.white },
});