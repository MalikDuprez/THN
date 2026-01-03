// app/(app)/(pro)/(tabs)/agenda.tsx
import { 
  View, 
  Text, 
  ScrollView,       
  Pressable,                                                                                        
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { 
  getCoiffeurBookingsByDate,
  getCoiffeurDatesWithBookings,
} from "@/api/bookings";
import type { BookingWithDetails } from "@/types/database";
import { getUserAvatar } from "@/constants/images";
import { BookingDetailModal } from "@/components/shared/BookingDetailModal";

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
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// Tous les créneaux horaires possibles
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

// Récupérer les jours de la semaine pour une date donnée
const getWeekDays = (date: Date) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
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

// Slot de temps avec ou sans RDV
const TimeSlot = ({ time, booking, onPress }: { 
  time: string; 
  booking: BookingWithDetails | null;
  onPress: () => void;
}) => {
  if (!booking) {
    // Créneau disponible
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

  // Créneau avec RDV
  const status = getStatusStyle(booking.status);
  const clientName = booking.client?.full_name || 
    `${booking.client?.first_name || ""} ${booking.client?.last_name || ""}`.trim() || 
    "Client";
  const clientImage = getUserAvatar(booking.client?.avatar_url, clientName);
  
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

// État vide
const EmptyState = ({ message }: { message: string }) => (
  <View style={styles.emptyState}>
    <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  
  // Date sélectionnée
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState(getWeekDays(new Date()));
  
  // Données
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [datesWithBookings, setDatesWithBookings] = useState<Set<string>>(new Set());
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les RDV pour la date sélectionnée
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

  // Charger les dates avec RDV pour le mois
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
    loadBookings();
    loadDatesWithBookings();
  }, [loadBookings, loadDatesWithBookings]);

  // Mise à jour de la semaine quand la date change
  useEffect(() => {
    setWeekDays(getWeekDays(selectedDate));
  }, [selectedDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
    loadDatesWithBookings();
  }, [loadBookings, loadDatesWithBookings]);

  // Navigation semaine
  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Construire les créneaux avec les RDV
  const getScheduleSlots = () => {
    // Mapper les RDV par heure de début
    const bookingsByTime = new Map<string, BookingWithDetails>();
    const occupiedSlots = new Set<string>();

    bookings.forEach((booking) => {
      const startTime = formatTime(booking.start_at);
      bookingsByTime.set(startTime, booking);
      
      // Marquer tous les créneaux occupés par ce RDV
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

    // Créer la liste des créneaux
    return ALL_TIME_SLOTS.map(time => {
      const booking = bookingsByTime.get(time);
      const isOccupied = occupiedSlots.has(time) && !booking;
      
      return {
        time,
        booking: booking || null,
        isOccupied,
      };
    }).filter(slot => !slot.isOccupied); // Filtrer les créneaux occupés (milieu de RDV)
  };

  const scheduleSlots = getScheduleSlots();
  const currentMonth = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const selectedDateLabel = selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const rdvCount = bookings.filter(b => !["cancelled", "no_show"].includes(b.status)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Agenda</Text>
        </View>

        {/* Navigation semaine */}
        <View style={styles.monthRow}>
          <Pressable style={styles.monthNavButton} onPress={handlePrevWeek}>
            <Ionicons name="chevron-back" size={20} color={theme.white} />
          </Pressable>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <Pressable style={styles.monthNavButton} onPress={handleNextWeek}>
            <Ionicons name="chevron-forward" size={20} color={theme.white} />
          </Pressable>
        </View>

        {/* Semaine */}
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
          {/* Résumé du jour */}
          <View style={styles.daySummary}>
            <Text style={styles.daySummaryDate}>{selectedDateLabel}</Text>
            <Text style={styles.daySummaryCount}>
              {rdvCount} rendez-vous
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
              {scheduleSlots.map((slot) => (
                <TimeSlot
                  key={slot.time}
                  time={slot.time}
                  booking={slot.booking}
                  onPress={() => slot.booking && setSelectedBooking(slot.booking)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal détail - Composant partagé */}
      <BookingDetailModal 
        visible={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking}
        viewMode="coiffeur"
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
  container: { 
    flex: 1, 
    backgroundColor: theme.black 
  },

  // Header
  header: { 
    backgroundColor: theme.black, 
    paddingHorizontal: 20, 
    paddingBottom: 24 
  },
  headerTop: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: theme.white 
  },

  // Month Nav
  monthRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 20 
  },
  monthNavButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: "rgba(255,255,255,0.1)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  monthText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: theme.white, 
    marginHorizontal: 20 
  },

  // Week
  weekRow: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  dayButton: { 
    alignItems: "center", 
    paddingVertical: 10, 
    paddingHorizontal: 8, 
    borderRadius: 14, 
    minWidth: 44 
  },
  dayButtonSelected: { 
    backgroundColor: theme.white 
  },
  dayWeekText: { 
    fontSize: 12, 
    color: "rgba(255,255,255,0.6)", 
    fontWeight: "500", 
    marginBottom: 6 
  },
  dayWeekTextSelected: { 
    color: theme.textMuted 
  },
  dayNumberText: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: theme.white 
  },
  dayNumberTextSelected: { 
    color: theme.black 
  },
  dayNumberToday: { 
    color: theme.accent 
  },
  dayDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: theme.accent, 
    marginTop: 6 
  },
  dayDotSelected: { 
    backgroundColor: theme.black 
  },

  // Content
  content: { 
    flex: 1, 
    backgroundColor: theme.white, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28 
  },
  scrollView: { 
    flex: 1, 
    paddingTop: 20 
  },

  // Day Summary
  daySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  daySummaryDate: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    textTransform: "capitalize",
  },
  daySummaryCount: {
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
  },

  // Schedule
  scheduleContainer: { 
    paddingHorizontal: 20 
  },
  slotRow: { 
    flexDirection: "row", 
    marginBottom: 8 
  },
  slotTime: { 
    width: 50, 
    fontSize: 13, 
    fontWeight: "500", 
    color: theme.textMuted, 
    paddingTop: 12 
  },

  // Available
  slotAvailable: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    backgroundColor: theme.card, 
    borderRadius: 12, 
    borderLeftWidth: 3, 
    borderLeftColor: theme.border 
  },
  slotAvailableLine: { 
    width: 2, 
    height: 16, 
    backgroundColor: theme.border, 
    marginRight: 10, 
    borderRadius: 1 
  },
  slotAvailableText: { 
    fontSize: 13, 
    color: theme.textMuted 
  },

  // Appointment Slot
  slotAppointment: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    backgroundColor: theme.accentLight, 
    borderRadius: 12, 
    borderLeftWidth: 3, 
    gap: 10 
  },
  slotAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18 
  },
  slotAppointmentInfo: { 
    flex: 1 
  },
  slotClient: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: theme.text 
  },
  slotService: { 
    fontSize: 12, 
    color: theme.textSecondary, 
    marginTop: 2 
  },
  slotAppointmentRight: { 
    alignItems: "flex-end" 
  },
  slotPrice: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: theme.text, 
    marginBottom: 4 
  },
  slotStatus: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  slotStatusText: { 
    fontSize: 10, 
    fontWeight: "600" 
  },
});