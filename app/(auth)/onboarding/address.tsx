// app/(auth)/onboarding/address.tsx
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
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

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
  success: "#4CAF50",
};

// Labels prédéfinis
const ADDRESS_LABELS = [
  { id: "home", label: "Domicile", icon: "home-outline" },
  { id: "work", label: "Bureau", icon: "briefcase-outline" },
  { id: "other", label: "Autre", icon: "location-outline" },
];

export default function AddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchProfile } = useAuthStore();
  
  const params = useLocalSearchParams<{
    firstName: string;
    lastName: string;
    gender: string;
    genderCustom: string;
    birthDate: string;
    phone: string;
    avatarUri: string;
  }>();

  // Form state
  const [selectedLabel, setSelectedLabel] = useState("home");
  const [addressLine, setAddressLine] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const isValid =
    addressLine.trim() &&
    city.trim() &&
    postalCode.trim() &&
    /^\d{5}$/.test(postalCode.trim());

  const handleFinish = async () => {
    if (!isValid) return;

    setIsLoading(true);

    try {
      // 1. Récupérer l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
        router.replace(ROUTES.AUTH.LOGIN);
        return;
      }

      // 2. Mettre à jour le profil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: params.firstName,
          last_name: params.lastName,
          full_name: `${params.firstName} ${params.lastName}`,
          gender: params.gender,
          gender_custom: params.gender === "other" ? params.genderCustom : null,
          birth_date: params.birthDate ? new Date(params.birthDate).toISOString().split("T")[0] : null,
          phone: params.phone,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
        setIsLoading(false);
        return;
      }

      // 3. Upload avatar si présent
      if (params.avatarUri) {
        try {
          const response = await fetch(params.avatarUri);
          const blob = await response.blob();
          const fileExt = params.avatarUri.split(".").pop() || "jpg";
          const fileName = `${user.id}/avatar.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, blob, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("avatars")
              .getPublicUrl(fileName);

            await supabase
              .from("profiles")
              .update({ avatar_url: urlData.publicUrl })
              .eq("id", user.id);
          }
        } catch (avatarError) {
          console.error("Avatar upload error:", avatarError);
          // On continue même si l'avatar échoue
        }
      }

      // 4. Créer l'adresse
      const labelText = ADDRESS_LABELS.find((l) => l.id === selectedLabel)?.label || "Domicile";
      
      const { error: addressError } = await supabase.from("addresses").insert({
        profile_id: user.id,
        label: labelText,
        address_line: addressLine.trim(),
        address_line_2: addressLine2.trim() || null,
        city: city.trim(),
        postal_code: postalCode.trim(),
        country: "France",
        instructions: instructions.trim() || null,
        is_default: true,
      });

      if (addressError) {
        console.error("Address insert error:", addressError);
        Alert.alert("Erreur", "Impossible d'enregistrer l'adresse.");
        setIsLoading(false);
        return;
      }

      // 5. Rafraîchir le profil dans le store
      await fetchProfile();

      // 6. Rediriger vers Home
      router.replace(ROUTES.CLIENT.HOME);

    } catch (error) {
      console.error("Onboarding error:", error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <Text style={styles.progressText}>Étape 3/3</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Votre adresse</Text>
          <Text style={styles.subtitle}>
            Pour les prestations à domicile, nous avons besoin de votre adresse
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Label selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type d'adresse</Text>
            <View style={styles.labelsContainer}>
              {ADDRESS_LABELS.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.labelOption,
                    selectedLabel === item.id && styles.labelOptionSelected,
                  ]}
                  onPress={() => setSelectedLabel(item.id)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={selectedLabel === item.id ? theme.white : theme.gray700}
                  />
                  <Text
                    style={[
                      styles.labelOptionText,
                      selectedLabel === item.id && styles.labelOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              placeholder="123 rue de la Paix"
              placeholderTextColor={theme.gray500}
              value={addressLine}
              onChangeText={setAddressLine}
              autoCapitalize="words"
            />
          </View>

          {/* Complément */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Complément <Text style={styles.optional}>(optionnel)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Bâtiment, étage, code..."
              placeholderTextColor={theme.gray500}
              value={addressLine2}
              onChangeText={setAddressLine2}
            />
          </View>

          {/* Ville + Code postal */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Ville</Text>
              <TextInput
                style={styles.input}
                placeholder="Paris"
                placeholderTextColor={theme.gray500}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Code postal</Text>
              <TextInput
                style={styles.input}
                placeholder="75001"
                placeholderTextColor={theme.gray500}
                value={postalCode}
                onChangeText={(text) => setPostalCode(text.replace(/\D/g, "").slice(0, 5))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Instructions <Text style={styles.optional}>(optionnel)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Sonner à l'interphone 'Dupont', 3ème étage gauche..."
              placeholderTextColor={theme.gray500}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]}
            onPress={handleFinish}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Terminer</Text>
                <Ionicons name="checkmark" size={20} color={theme.white} />
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={20} color={theme.gray700} />
            <Text style={styles.backButtonText}>Retour</Text>
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
    backgroundColor: theme.success,
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
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.black,
  },
  optional: {
    fontWeight: "400",
    color: theme.gray500,
  },
  input: {
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.black,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },

  // Labels
  labelsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  labelOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.gray100,
    borderRadius: 12,
  },
  labelOptionSelected: {
    backgroundColor: theme.black,
  },
  labelOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.gray700,
  },
  labelOptionTextSelected: {
    color: theme.white,
  },

  // Footer
  footer: {
    paddingTop: 24,
    gap: 12,
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.gray700,
  },
});