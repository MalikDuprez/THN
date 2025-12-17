// app/(app)/(client)/booking/time.tsx
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useMemo } from "react";

const { width } = Dimensions.get("window");
const SLOT_WIDTH = (width - 32 - 20) / 3; // 3 colonnes avec gap de 10

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
};

// Fonction pour formater une date en YYYY-MM-DD sans problème de timezone
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BookingTimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const isAtHome = params.location === "domicile";
  const selectedDateStr = params.date as string;

  // Vérifier si la date sélectionnée est aujourd'hui (en comparant les strings YYYY-MM-DD)
  const now = new Date();
  const todayString = formatDateToLocal(now);
  const isToday = selectedDateStr === todayString;

  // Heure et minutes actuelles
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Générer les créneaux avec vérification des heures passées
  const timeSlots = useMemo(() => {
    const periods = [
      { name: "Nuit", slots: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00"] },
      { name: "Matin", slots: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"] },
      { name: "Après-midi", slots: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"] },
      { name: "Soir", slots: ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"] },
    ];

    return periods.map(period => ({
      ...period,
      slots: period.slots.map(time => {
        const [hour, minute] = time.split(":").map(Number);
        
        // Si c'est aujourd'hui, vérifier si l'heure est passée
        let isPast = false;
        if (isToday) {
          if (hour < currentHour) {
            isPast = true;
          } else if (hour === currentHour && minute <= currentMinutes) {
            isPast = true;
          }
        }

        // Simuler disponibilité coiffeur (seulement si pas passé)
        const coiffeurAvailable = !isPast && Math.random() > 0.25;

        return {
          time,
          isPast,
          available: coiffeurAvailable,
        };
      }),
    }));
  }, [isToday, currentHour, currentMinutes]);

  // Formater la date pour affichage
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    
    const nowDate = new Date();
    const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.getTime() === today.getTime()) return "Aujourd'hui";
    if (d.getTime() === tomorrow.getTime()) return "Demain";
    
    return d.toLocaleDateString("fr-FR", { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
  };

  const handleNext = () => {
    if (selectedTime) {
      router.push({
        pathname: "./confirm",
        params: { ...params, time: selectedTime },
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
          <Text style={styles.headerTitle}>Choisir une heure</Text>
          <Text style={styles.headerSubtitle}>Étape 3/4</Text>
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
        <View style={styles.progressBar} />
      </View>

      {/* Info badges */}
      <View style={styles.badgesContainer}>
        <View style={styles.badge}>
          <Ionicons 
            name={isAtHome ? "home" : "storefront"} 
            size={14} 
            color={theme.text} 
          />
          <Text style={styles.badgeText}>
            {isAtHome ? "À domicile" : "En salon"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="calendar" size={14} color={theme.text} />
          <Text style={styles.badgeText}>
            {formatDate(selectedDateStr)}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.serviceNote}>
          <Ionicons name="time" size={16} color={theme.success} />
          <Text style={styles.serviceNoteText}>
            Service disponible 24h/24
          </Text>
        </View>

        {isToday && (
          <View style={styles.todayNote}>
            <Ionicons name="information-circle" size={16} color={theme.textMuted} />
            <Text style={styles.todayNoteText}>
              Les créneaux passés ne sont plus disponibles
            </Text>
          </View>
        )}

        {timeSlots.map((period, periodIndex) => (
          <View key={periodIndex} style={styles.periodSection}>
            <Text style={styles.periodTitle}>{period.name}</Text>
            <View style={styles.slotsGrid}>
              {period.slots.map((slot, slotIndex) => {
                const isDisabled = slot.isPast || !slot.available;
                const isSelected = selectedTime === slot.time;

                return (
                  <Pressable
                    key={slotIndex}
                    onPress={() => !isDisabled && setSelectedTime(slot.time)}
                    disabled={isDisabled}
                    style={[
                      styles.timeSlot,
                      isDisabled && styles.timeSlotDisabled,
                      isSelected && styles.timeSlotSelected,
                    ]}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      isDisabled && styles.timeSlotTextDisabled,
                      isSelected && styles.timeSlotTextSelected,
                    ]}>
                      {slot.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        {selectedTime && (
          <View style={styles.selectedInfo}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success} />
            <Text style={styles.selectedText}>
              {formatDate(selectedDateStr)} à {selectedTime}
            </Text>
          </View>
        )}
        <Pressable
          onPress={handleNext}
          disabled={!selectedTime}
          style={[
            styles.ctaButton,
            !selectedTime && styles.ctaButtonDisabled,
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
  badgesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
    textTransform: "capitalize",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  serviceNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  serviceNoteText: {
    fontSize: 13,
    color: theme.success,
    fontWeight: "500",
  },
  todayNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  todayNoteText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  periodSection: {
    marginBottom: 24,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    width: SLOT_WIDTH,
    height: 48,
    backgroundColor: theme.card,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timeSlotDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.4,
  },
  timeSlotSelected: {
    backgroundColor: theme.text,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  timeSlotTextDisabled: {
    color: theme.textMuted,
  },
  timeSlotTextSelected: {
    color: "#FFFFFF",
  },
  bottomCTA: {
    padding: 16,
    backgroundColor: theme.background,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  selectedText: {
    fontSize: 14,
    color: theme.success,
    fontWeight: "500",
    textTransform: "capitalize",
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