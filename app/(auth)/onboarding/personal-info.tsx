// app/(auth)/onboarding/personal-info.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

// ============================================
// TYPES
// ============================================
type Gender = "male" | "female" | "other" | null;

// ============================================
// THEME
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  gray100: "#F5F5F5",
  gray300: "#E0E0E0",
  gray500: "#9E9E9E",
  gray700: "#616161",
  primary: "#000000",
};

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [genderCustom, setGenderCustom] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Validation - si "other", il faut préciser
  const isGenderValid = gender && (gender !== "other" || genderCustom.trim().length > 0);
  const isValid = firstName.trim() && lastName.trim() && isGenderValid && birthDate;

  const handleNext = () => {
    if (!isValid) return;

    // Passer les données à l'écran suivant via params
    router.push({
      pathname: "/(auth)/onboarding/contact",
      params: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        genderCustom: gender === "other" ? genderCustom.trim() : "",
        birthDate: birthDate?.toISOString(),
      },
    });
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Sur Android, fermer après sélection
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    // Sur iOS, le picker reste ouvert jusqu'à "Valider"
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  // Date max = 16 ans minimum
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 16);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "33%" }]} />
          </View>
          <Text style={styles.progressText}>Étape 1/3</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Parlez-nous de vous</Text>
          <Text style={styles.subtitle}>
            Ces informations nous aident à personnaliser votre expérience
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre prénom"
              placeholderTextColor={theme.gray500}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom"
              placeholderTextColor={theme.gray500}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Genre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Genre</Text>
            <View style={styles.genderContainer}>
              <Pressable
                style={[
                  styles.genderOption,
                  gender === "female" && styles.genderOptionSelected,
                ]}
                onPress={() => setGender("female")}
              >
                <Ionicons
                  name="female"
                  size={24}
                  color={gender === "female" ? theme.white : theme.gray700}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "female" && styles.genderTextSelected,
                  ]}
                >
                  Femme
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.genderOption,
                  gender === "male" && styles.genderOptionSelected,
                ]}
                onPress={() => setGender("male")}
              >
                <Ionicons
                  name="male"
                  size={24}
                  color={gender === "male" ? theme.white : theme.gray700}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "male" && styles.genderTextSelected,
                  ]}
                >
                  Homme
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.genderOption,
                  gender === "other" && styles.genderOptionSelected,
                ]}
                onPress={() => setGender("other")}
              >
                <Ionicons
                  name="sparkles"
                  size={24}
                  color={gender === "other" ? theme.white : theme.gray700}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "other" && styles.genderTextSelected,
                  ]}
                >
                  Autre
                </Text>
              </Pressable>
            </View>

            {/* Champ personnalisé si "Autre" sélectionné */}
            {gender === "other" && (
              <View style={styles.customGenderContainer}>
                <Text style={styles.customGenderLabel}>
                  Comment souhaitez-vous être identifié·e ?
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Non-binaire, Agenre, Genderfluid..."
                  placeholderTextColor={theme.gray500}
                  value={genderCustom}
                  onChangeText={setGenderCustom}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Text style={styles.customGenderHint}>
                  Cette information nous permet de personnaliser votre expérience et de vous adresser correctement.
                </Text>
              </View>
            )}
          </View>

          {/* Date de naissance */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            <Pressable
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.gray500} />
              <Text
                style={[
                  styles.dateText,
                  !birthDate && styles.datePlaceholder,
                ]}
              >
                {birthDate ? formatDate(birthDate) : "Sélectionner une date"}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={birthDate || maxDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={maxDate}
                minimumDate={new Date(1920, 0, 1)}
                locale="fr-FR"
                themeVariant="light"
                textColor={theme.black}
                accentColor={theme.black}
                style={styles.datePicker}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  style={styles.datePickerDone}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Valider</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.white} />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // Progress
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.gray100,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.black,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: theme.gray500,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.gray700,
    lineHeight: 22,
  },

  // Form
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.black,
  },
  input: {
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.black,
  },

  // Gender
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: theme.gray100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderOptionSelected: {
    backgroundColor: theme.black,
    borderColor: theme.black,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.gray700,
  },
  genderTextSelected: {
    color: theme.white,
  },
  customGenderContainer: {
    marginTop: 16,
    gap: 8,
  },
  customGenderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.black,
  },
  customGenderHint: {
    fontSize: 12,
    color: theme.gray500,
    lineHeight: 18,
    marginTop: 4,
  },

  // Date
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 16,
    color: theme.black,
  },
  datePlaceholder: {
    color: theme.gray500,
  },
  datePickerContainer: {
    backgroundColor: theme.gray100,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  datePicker: {
    height: 180,
    backgroundColor: theme.gray100,
  },
  datePickerDone: {
    backgroundColor: theme.black,
    paddingVertical: 12,
    alignItems: "center",
  },
  datePickerDoneText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },

  // Footer
  footer: {
    paddingTop: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.black,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
  },
});