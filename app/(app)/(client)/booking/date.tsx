// app/(app)/(client)/booking/date.tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useMemo } from "react";

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
};

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Fonction pour formater une date en YYYY-MM-DD sans problème de timezone
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Simuler les disponibilités
const getAvailability = (date: Date): number => {
  const random = Math.random();
  if (random > 0.85) return 0;
  if (random > 0.5) return Math.floor(Math.random() * 8) + 8;
  return Math.floor(Math.random() * 6) + 2;
};

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  availability: number;
  dateString: string;
}

interface CalendarMonth {
  month: number;
  year: number;
  name: string;
  days: CalendarDay[];
}

export default function BookingDateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isAtHome = params.location === "domicile";

  // Générer les mois du calendrier (mois actuel + 2 suivants)
  const calendarMonths = useMemo(() => {
    const months: CalendarMonth[] = [];
    
    // Date d'aujourd'hui à minuit (heure locale)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayString = formatDateToLocal(today);

    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      const monthName = monthDate.toLocaleDateString("fr-FR", { 
        month: "long", 
        year: "numeric" 
      });

      // Premier jour du mois (0 = Dimanche, on veut Lundi = 0)
      let firstDayOfWeek = new Date(year, month, 1).getDay();
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

      // Nombre de jours dans le mois
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const days: CalendarDay[] = [];

      // Jours vides avant le 1er du mois
      for (let i = 0; i < firstDayOfWeek; i++) {
        const prevDate = new Date(year, month, -firstDayOfWeek + i + 1);
        days.push({
          date: prevDate,
          dayNumber: prevDate.getDate(),
          isCurrentMonth: false,
          isPast: true,
          isToday: false,
          availability: 0,
          dateString: formatDateToLocal(prevDate),
        });
      }

      // Jours du mois
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateString = formatDateToLocal(date);
        const isPast = dateString < todayString;
        const isToday = dateString === todayString;

        days.push({
          date,
          dayNumber: d,
          isCurrentMonth: true,
          isPast,
          isToday,
          availability: isPast ? 0 : getAvailability(date),
          dateString,
        });
      }

      // Compléter la dernière semaine
      const remainingDays = 7 - (days.length % 7);
      if (remainingDays < 7) {
        for (let i = 1; i <= remainingDays; i++) {
          const nextDate = new Date(year, month + 1, i);
          days.push({
            date: nextDate,
            dayNumber: i,
            isCurrentMonth: false,
            isPast: false,
            isToday: false,
            availability: 0,
            dateString: formatDateToLocal(nextDate),
          });
        }
      }

      months.push({
        month,
        year,
        name: monthName,
        days,
      });
    }

    return months;
  }, []);

  const selectedDateInfo = useMemo(() => {
    if (!selectedDate) return null;
    for (const month of calendarMonths) {
      const day = month.days.find(d => d.dateString === selectedDate && d.isCurrentMonth);
      if (day) return day;
    }
    return null;
  }, [selectedDate, calendarMonths]);

  const handleNext = () => {
    if (selectedDate) {
      router.push({
        pathname: "./time",
        params: { ...params, date: selectedDate },
      });
    }
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability === 0) return theme.textMuted;
    if (availability < 5) return "#E65100";
    return theme.success;
  };

  const formatSelectedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choisir une date</Text>
          <Text style={styles.headerSubtitle}>Étape 2/4</Text>
        </View>
        <Pressable onPress={() => router.dismissAll()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>

      {/* Location Badge */}
      <View style={styles.badgeContainer}>
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
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
            <Text style={styles.legendText}>Disponible</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E65100" }]} />
            <Text style={styles.legendText}>Peu de créneaux</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.textMuted }]} />
            <Text style={styles.legendText}>Complet</Text>
          </View>
        </View>

        {/* Calendrier par mois */}
        {calendarMonths.map((monthData, monthIndex) => (
          <View key={monthIndex} style={styles.monthContainer}>
            <Text style={styles.monthTitle}>{monthData.name}</Text>
            
            {/* Jours de la semaine */}
            <View style={styles.weekDaysRow}>
              {DAYS_OF_WEEK.map((day, index) => (
                <Text key={index} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Grille des jours */}
            <View style={styles.daysGrid}>
              {monthData.days.map((day, dayIndex) => {
                const isSelectable = day.isCurrentMonth && !day.isPast && day.availability > 0;
                const isSelected = selectedDate === day.dateString && day.isCurrentMonth;

                return (
                  <Pressable
                    key={dayIndex}
                    onPress={() => isSelectable && setSelectedDate(day.dateString)}
                    disabled={!isSelectable}
                    style={[
                      styles.dayCell,
                      !day.isCurrentMonth && styles.dayCellOtherMonth,
                      day.isPast && day.isCurrentMonth && styles.dayCellPast,
                      isSelected && styles.dayCellSelected,
                    ]}
                  >
                    <Text style={[
                      styles.dayNumber,
                      !day.isCurrentMonth && styles.dayNumberOtherMonth,
                      day.isPast && day.isCurrentMonth && styles.dayNumberPast,
                      day.isToday && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected,
                    ]}>
                      {day.dayNumber}
                    </Text>
                    
                    {day.isCurrentMonth && !day.isPast && (
                      <View style={[
                        styles.availabilityDot,
                        { backgroundColor: getAvailabilityColor(day.availability) },
                        isSelected && styles.availabilityDotSelected,
                      ]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sélection info */}
        {selectedDateInfo && (
          <View style={styles.selectionCard}>
            <Ionicons name="calendar" size={20} color={theme.text} />
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionDate}>
                {formatSelectedDate(selectedDate!)}
              </Text>
              <Text style={[
                styles.selectionAvailability,
                { color: getAvailabilityColor(selectedDateInfo.availability) }
              ]}>
                {selectedDateInfo.availability} créneaux disponibles
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleNext}
          disabled={!selectedDate}
          style={[
            styles.ctaButton,
            !selectedDate && styles.ctaButtonDisabled,
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
  badgeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  monthContainer: {
    marginBottom: 32,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
    textTransform: "capitalize",
    marginBottom: 16,
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: theme.textMuted,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayCellOtherMonth: {
    opacity: 0,
  },
  dayCellPast: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: theme.text,
    borderRadius: 100,
  },
  dayNumber: {
    fontSize: 16,
    color: theme.text,
    fontWeight: "500",
  },
  dayNumberOtherMonth: {
    color: theme.border,
  },
  dayNumberPast: {
    color: theme.textMuted,
  },
  dayNumberToday: {
    color: theme.success,
    fontWeight: "bold",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  availabilityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  availabilityDotSelected: {
    backgroundColor: "#FFFFFF",
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionDate: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    textTransform: "capitalize",
  },
  selectionAvailability: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomCTA: {
    padding: 16,
    backgroundColor: theme.background,
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