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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";

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
// DONNÉES MOCK
// ============================================
const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MOCK_WEEK = [
  { day: 16, weekDay: "Lun", hasAppointments: true, isToday: true },
  { day: 17, weekDay: "Mar", hasAppointments: true },
  { day: 18, weekDay: "Mer", hasAppointments: false },
  { day: 19, weekDay: "Jeu", hasAppointments: true },
  { day: 20, weekDay: "Ven", hasAppointments: true },
  { day: 21, weekDay: "Sam", hasAppointments: false },
  { day: 22, weekDay: "Dim", hasAppointments: false },
];

const MOCK_SCHEDULE = [
  { time: "09:00", type: "available" },
  { time: "09:30", type: "available" },
  { time: "10:00", type: "appointment", client: "Marie L.", service: "Coupe femme", duration: "45min", price: 35, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", status: "confirmed" },
  { time: "11:00", type: "appointment", client: "Thomas D.", service: "Dégradé américain", duration: "30min", price: 25, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", status: "pending" },
  { time: "11:30", type: "available" },
  { time: "12:00", type: "blocked", label: "Pause déjeuner" },
  { time: "12:30", type: "blocked", label: "Pause déjeuner" },
  { time: "13:00", type: "blocked", label: "Pause déjeuner" },
  { time: "14:00", type: "available" },
  { time: "14:30", type: "appointment", client: "Julie M.", service: "Coloration", duration: "1h30", price: 65, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100", status: "confirmed" },
  { time: "16:00", type: "available" },
  { time: "16:30", type: "available" },
  { time: "17:00", type: "appointment", client: "Lucas P.", service: "Coupe + Barbe", duration: "1h", price: 40, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", status: "confirmed" },
  { time: "18:00", type: "available" },
];

const MOCK_AVAILABILITY = [
  { day: "Lundi", enabled: true, start: "09:00", end: "19:00" },
  { day: "Mardi", enabled: true, start: "09:00", end: "19:00" },
  { day: "Mercredi", enabled: true, start: "09:00", end: "19:00" },
  { day: "Jeudi", enabled: true, start: "09:00", end: "19:00" },
  { day: "Vendredi", enabled: true, start: "09:00", end: "19:00" },
  { day: "Samedi", enabled: true, start: "10:00", end: "17:00" },
  { day: "Dimanche", enabled: false, start: "09:00", end: "19:00" },
];

// ============================================
// HELPERS
// ============================================
const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending": return { color: theme.warning, bg: theme.warningLight, label: "À confirmer" };
    case "confirmed": return { color: theme.success, bg: theme.successLight, label: "Confirmé" };
    default: return { color: theme.textMuted, bg: theme.card, label: status };
  }
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

const TimeSlot = ({ slot, onPress }: { slot: any; onPress: () => void }) => {
  if (slot.type === "available") {
    return (
      <View style={styles.slotRow}>
        <Text style={styles.slotTime}>{slot.time}</Text>
        <View style={styles.slotAvailable}>
          <View style={styles.slotAvailableLine} />
          <Text style={styles.slotAvailableText}>Disponible</Text>
        </View>
      </View>
    );
  }

  if (slot.type === "blocked") {
    return (
      <View style={styles.slotRow}>
        <Text style={styles.slotTime}>{slot.time}</Text>
        <View style={styles.slotBlocked}>
          <Ionicons name="ban-outline" size={16} color={theme.textMuted} />
          <Text style={styles.slotBlockedText}>{slot.label}</Text>
        </View>
      </View>
    );
  }

  const status = getStatusStyle(slot.status);

  return (
    <View style={styles.slotRow}>
      <Text style={styles.slotTime}>{slot.time}</Text>
      <Pressable style={[styles.slotAppointment, { borderLeftColor: status.color }]} onPress={onPress}>
        <Image source={{ uri: slot.image }} style={styles.slotAvatar} />
        <View style={styles.slotAppointmentInfo}>
          <Text style={styles.slotClient}>{slot.client}</Text>
          <Text style={styles.slotService}>{slot.service}</Text>
        </View>
        <View style={styles.slotAppointmentRight}>
          <Text style={styles.slotPrice}>{slot.price}€</Text>
          <View style={[styles.slotStatus, { backgroundColor: status.bg }]}>
            <Text style={[styles.slotStatusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

// ============================================
// MODALE DISPONIBILITÉS
// ============================================
const AvailabilityModal = ({ visible, onClose }: {
  visible: boolean;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [availability, setAvailability] = useState(MOCK_AVAILABILITY);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<"start" | "end" | null>(null);

  const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + ":00");
  const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, "0");
    const min = i % 2 === 0 ? "00" : "30";
    return `${hour}:${min}`;
  });

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
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const toggleDay = (index: number) => {
    const newAvailability = [...availability];
    newAvailability[index].enabled = !newAvailability[index].enabled;
    setAvailability(newAvailability);
  };

  const updateTime = (index: number, type: "start" | "end", time: string) => {
    const newAvailability = [...availability];
    newAvailability[index][type] = time;
    setAvailability(newAvailability);
    setEditingDay(null);
    setEditingType(null);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.availabilityModal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes disponibilités</Text>
            </View>
          </View>

          <ScrollView style={styles.availabilityScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.availabilitySubtitle}>
              Définissez vos horaires de travail. Les clients pourront réserver uniquement sur ces créneaux.
            </Text>

            {availability.map((day, index) => (
              <View key={day.day} style={styles.availabilityRow}>
                <Pressable style={styles.availabilityDayToggle} onPress={() => toggleDay(index)}>
                  <View style={[styles.checkbox, day.enabled && styles.checkboxActive]}>
                    {day.enabled && <Ionicons name="checkmark" size={14} color={theme.white} />}
                  </View>
                  <Text style={[styles.availabilityDayName, !day.enabled && styles.availabilityDayDisabled]}>
                    {day.day}
                  </Text>
                </Pressable>
                
                {day.enabled && (
                  <View style={styles.hoursContainer}>
                    <Pressable 
                      style={styles.hourSelector}
                      onPress={() => { setEditingDay(index); setEditingType("start"); }}
                    >
                      <Text style={styles.hourText}>{day.start}</Text>
                    </Pressable>
                    <Text style={styles.hourSeparator}>à</Text>
                    <Pressable 
                      style={styles.hourSelector}
                      onPress={() => { setEditingDay(index); setEditingType("end"); }}
                    >
                      <Text style={styles.hourText}>{day.end}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}

            {/* Time Picker */}
            {editingDay !== null && editingType !== null && (
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerHeader}>
                  <Text style={styles.timePickerTitle}>
                    {availability[editingDay].day} - Heure de {editingType === "start" ? "début" : "fin"}
                  </Text>
                  <Pressable onPress={() => { setEditingDay(null); setEditingType(null); }}>
                    <Ionicons name="close" size={24} color={theme.textMuted} />
                  </Pressable>
                </View>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.timePickerGrid}>
                    {HALF_HOURS.map((time) => (
                      <Pressable
                        key={time}
                        style={[
                          styles.timePickerOption,
                          availability[editingDay][editingType] === time && styles.timePickerOptionActive
                        ]}
                        onPress={() => updateTime(editingDay, editingType, time)}
                      >
                        <Text style={[
                          styles.timePickerOptionText,
                          availability[editingDay][editingType] === time && styles.timePickerOptionTextActive
                        ]}>
                          {time}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <Pressable style={styles.saveButton} onPress={handleClose}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// MODALE BLOQUER CRÉNEAU
// ============================================
const BlockSlotModal = ({ visible, onClose }: {
  visible: boolean;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [reason, setReason] = useState("");

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
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const QUICK_REASONS = [
    { label: "Pause", icon: "cafe-outline" },
    { label: "Congés", icon: "airplane-outline" },
    { label: "Indisponible", icon: "close-circle-outline" },
    { label: "Personnel", icon: "person-outline" },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.blockModal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bloquer un créneau</Text>
            </View>
          </View>

          <View style={styles.blockContent}>
            <Text style={styles.blockLabel}>Raison rapide</Text>
            <View style={styles.quickReasonsRow}>
              {QUICK_REASONS.map((item) => (
                <Pressable 
                  key={item.label} 
                  style={[styles.quickReasonChip, reason === item.label && styles.quickReasonChipActive]}
                  onPress={() => setReason(item.label)}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={18} 
                    color={reason === item.label ? theme.white : theme.textSecondary} 
                  />
                  <Text style={[styles.quickReasonText, reason === item.label && styles.quickReasonTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.blockLabel}>Date et heure</Text>
            <Pressable style={styles.dateTimeSelector}>
              <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              <Text style={styles.dateTimeSelectorText}>Aujourd'hui, 12:00 - 14:00</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </Pressable>

            <Pressable style={styles.blockButton}>
              <Text style={styles.blockButtonText}>Bloquer ce créneau</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// MODALE DÉTAIL RDV
// ============================================
const AppointmentDetailModal = ({ visible, onClose, appointment }: {
  visible: boolean;
  onClose: () => void;
  appointment: any;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!appointment) return null;

  const status = getStatusStyle(appointment.status);

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
            <View style={styles.detailClientSection}>
              <Image source={{ uri: appointment.image }} style={styles.detailAvatar} />
              <Text style={styles.detailClientName}>{appointment.client}</Text>
              <View style={[styles.detailStatusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.detailStatusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            <View style={styles.detailInfoSection}>
              <View style={styles.detailInfoRow}>
                <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>Aujourd'hui à {appointment.time} ({appointment.duration})</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Ionicons name="cut-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>{appointment.service}</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Ionicons name="cash-outline" size={20} color={theme.textMuted} />
                <Text style={styles.detailInfoText}>{appointment.price}€</Text>
              </View>
            </View>

            <View style={styles.detailActions}>
              <Pressable style={styles.detailActionSecondary}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionSecondaryText}>Message</Text>
              </Pressable>
              <Pressable style={styles.detailActionSecondary}>
                <Ionicons name="call-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionSecondaryText}>Appeler</Text>
              </Pressable>
            </View>

            {appointment.status === "pending" && (
              <View style={styles.detailMainActions}>
                <Pressable style={styles.detailDeclineButton}>
                  <Text style={styles.detailDeclineText}>Refuser</Text>
                </Pressable>
                <Pressable style={styles.detailAcceptButton}>
                  <Text style={styles.detailAcceptText}>Accepter</Text>
                </Pressable>
              </View>
            )}

            {appointment.status === "confirmed" && (
              <Pressable style={styles.detailCancelButton}>
                <Text style={styles.detailCancelText}>Annuler le rendez-vous</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(16);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 16)); // Décembre 2024
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const currentMonth = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

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
        hasAppointments: [16, 17, 19, 20].includes(d.getDate()), // Mock
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return week;
  };

  const [weekDays, setWeekDays] = useState(getWeekDays(currentDate));

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setWeekDays(getWeekDays(newDate));
    setSelectedDay(newDate.getDate());
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setWeekDays(getWeekDays(newDate));
    setSelectedDay(newDate.getDate());
  };

  const handleDaySelect = (day: number, date: Date) => {
    setSelectedDay(day);
    setCurrentDate(date);
  };

  const handleAppointmentPress = (slot: any) => {
    if (slot.type === "appointment") {
      setSelectedAppointment(slot);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Pressable style={styles.settingsButton} onPress={() => setAvailabilityModalVisible(true)}>
            <Ionicons name="settings-outline" size={22} color={theme.white} />
          </Pressable>
        </View>
        
        {/* Mois */}
        <View style={styles.monthRow}>
          <Pressable style={styles.monthNavButton} onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={20} color={theme.white} />
          </Pressable>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <Pressable style={styles.monthNavButton} onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={20} color={theme.white} />
          </Pressable>
        </View>

        {/* Semaine */}
        <View style={styles.weekRow}>
          {weekDays.map((item) => (
            <DayButton
              key={item.day}
              day={item.day}
              weekDay={item.weekDay}
              hasAppointments={item.hasAppointments}
              isToday={item.isToday}
              isSelected={selectedDay === item.day}
              onPress={() => handleDaySelect(item.day, item.date)}
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
        >
          {/* Bouton bloquer */}
          <Pressable style={styles.blockSlotButton} onPress={() => setBlockModalVisible(true)}>
            <Ionicons name="ban-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.blockSlotButtonText}>Bloquer un créneau</Text>
          </Pressable>

          {/* Planning */}
          <View style={styles.scheduleContainer}>
            {MOCK_SCHEDULE.map((slot, index) => (
              <TimeSlot key={index} slot={slot} onPress={() => handleAppointmentPress(slot)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Modales */}
      <AvailabilityModal visible={availabilityModalVisible} onClose={() => setAvailabilityModalVisible(false)} />
      <BlockSlotModal visible={blockModalVisible} onClose={() => setBlockModalVisible(false)} />
      <AppointmentDetailModal visible={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} appointment={selectedAppointment} />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },
  
  // Header
  header: { backgroundColor: theme.black, paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: theme.white },
  settingsButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },

  // Month Nav
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  monthNavButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  monthText: { fontSize: 16, fontWeight: "600", color: theme.white, marginHorizontal: 20 },

  // Week
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

  // Contenu
  content: { flex: 1, backgroundColor: theme.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scrollView: { flex: 1, paddingTop: 20 },

  // Block Slot Button
  blockSlotButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.card, marginBottom: 20 },
  blockSlotButtonText: { fontSize: 14, fontWeight: "500", color: theme.textSecondary },

  // Schedule
  scheduleContainer: { paddingHorizontal: 20 },
  slotRow: { flexDirection: "row", marginBottom: 8 },
  slotTime: { width: 50, fontSize: 13, fontWeight: "500", color: theme.textMuted, paddingTop: 12 },

  // Available
  slotAvailable: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.card, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: theme.border },
  slotAvailableLine: { width: 2, height: 16, backgroundColor: theme.border, marginRight: 10, borderRadius: 1 },
  slotAvailableText: { fontSize: 13, color: theme.textMuted },

  // Blocked
  slotBlocked: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.errorLight, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: theme.error },
  slotBlockedText: { fontSize: 13, fontWeight: "500", color: theme.error },

  // Appointment
  slotAppointment: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.accentLight, borderRadius: 12, borderLeftWidth: 3, gap: 10 },
  slotAvatar: { width: 36, height: 36, borderRadius: 18 },
  slotAppointmentInfo: { flex: 1 },
  slotClient: { fontSize: 14, fontWeight: "600", color: theme.text },
  slotService: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  slotAppointmentRight: { alignItems: "flex-end" },
  slotPrice: { fontSize: 14, fontWeight: "bold", color: theme.text, marginBottom: 4 },
  slotStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  slotStatusText: { fontSize: 10, fontWeight: "600" },

  // Modal
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  dragIndicatorContainer: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  modalHeader: { paddingHorizontal: 20, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: theme.text },

  // Availability Modal
  availabilityModal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.9 },
  availabilityScroll: { paddingHorizontal: 20 },
  availabilitySubtitle: { fontSize: 14, color: theme.textMuted, marginBottom: 24, lineHeight: 20 },
  availabilityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  availabilityDayToggle: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  availabilityDayName: { fontSize: 16, fontWeight: "500", color: theme.text },
  availabilityDayDisabled: { color: theme.textMuted },
  hoursContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  hourSelector: { backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  hourText: { fontSize: 15, fontWeight: "600", color: theme.text },
  hourSeparator: { fontSize: 14, color: theme.textMuted },
  timePickerContainer: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginTop: 20, marginBottom: 10 },
  timePickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  timePickerTitle: { fontSize: 16, fontWeight: "600", color: theme.text },
  timePickerScroll: { maxHeight: 200 },
  timePickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timePickerOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.white, minWidth: 70, alignItems: "center" },
  timePickerOptionActive: { backgroundColor: theme.accent },
  timePickerOptionText: { fontSize: 14, fontWeight: "500", color: theme.text },
  timePickerOptionTextActive: { color: theme.white },
  saveButton: { backgroundColor: theme.black, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 24, marginBottom: 20 },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: theme.white },

  // Block Modal
  blockModal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  blockContent: { paddingHorizontal: 20 },
  blockLabel: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  quickReasonsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  quickReasonChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  quickReasonChipActive: { backgroundColor: theme.accent },
  quickReasonText: { fontSize: 14, fontWeight: "500", color: theme.textSecondary },
  quickReasonTextActive: { color: theme.white },
  dateTimeSelector: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.card, padding: 16, borderRadius: 14, marginBottom: 24 },
  dateTimeSelectorText: { flex: 1, fontSize: 15, color: theme.text },
  blockButton: { backgroundColor: theme.error, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  blockButtonText: { fontSize: 16, fontWeight: "600", color: theme.white },

  // Detail Modal
  detailModal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailContent: { paddingHorizontal: 20 },
  detailClientSection: { alignItems: "center", marginBottom: 24 },
  detailAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  detailClientName: { fontSize: 22, fontWeight: "bold", color: theme.text, marginBottom: 8 },
  detailStatusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  detailStatusText: { fontSize: 14, fontWeight: "600" },
  detailInfoSection: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  detailInfoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  detailInfoText: { fontSize: 16, color: theme.text },
  detailActions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  detailActionSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.card, paddingVertical: 14, borderRadius: 14 },
  detailActionSecondaryText: { fontSize: 15, fontWeight: "600", color: theme.text },
  detailMainActions: { flexDirection: "row", gap: 12 },
  detailDeclineButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.errorLight },
  detailDeclineText: { fontSize: 16, fontWeight: "600", color: theme.error },
  detailAcceptButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.success },
  detailAcceptText: { fontSize: 16, fontWeight: "600", color: theme.white },
  detailCancelButton: { alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.errorLight },
  detailCancelText: { fontSize: 16, fontWeight: "600", color: theme.error },
});