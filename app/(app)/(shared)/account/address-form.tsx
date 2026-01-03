// app/(app)/(shared)/account/address-form.tsx
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  getAddressById,
  createAddress,
  updateAddress,
  type AddressInput,
} from "@/api/addresses";

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
  error: "#EF4444",
  errorLight: "#FEF2F2",
  border: "#E2E8F0",
};

// ============================================
// LABELS PRÉDÉFINIS
// ============================================
const LABEL_OPTIONS = [
  { value: "Domicile", icon: "home-outline" },
  { value: "Travail", icon: "briefcase-outline" },
  { value: "Autre", icon: "location-outline" },
];

// ============================================
// COMPOSANT INPUT
// ============================================
const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      style={[styles.textInput, multiline && styles.textInputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function AddressFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Form state
  const [label, setLabel] = useState("Domicile");
  const [addressLine, setAddressLine] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadAddress();
    }
  }, [id]);

  const loadAddress = async () => {
    try {
      const address = await getAddressById(id!);
      if (address) {
        setLabel(address.label || "Domicile");
        setAddressLine(address.address_line);
        setAddressLine2(address.address_line_2 || "");
        setCity(address.city);
        setPostalCode(address.postal_code);
        setInstructions(address.instructions || "");
        setLatitude(address.latitude);
        setLongitude(address.longitude);
        setIsDefault(address.is_default);
      }
    } catch (error) {
      console.error("Error loading address:", error);
      Alert.alert("Erreur", "Impossible de charger l'adresse");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);

    try {
      // Demander les permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "L'accès à la localisation est nécessaire pour utiliser cette fonctionnalité."
        );
        return;
      }

      // Obtenir la position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocoding pour obtenir l'adresse
      const [geocoded] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocoded) {
        setAddressLine(
          [geocoded.streetNumber, geocoded.street].filter(Boolean).join(" ") ||
            geocoded.name ||
            ""
        );
        setCity(geocoded.city || geocoded.subregion || "");
        setPostalCode(geocoded.postalCode || "");
      }

      Alert.alert("Succès", "Votre position a été récupérée !");
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Erreur", "Impossible de récupérer votre position.");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!addressLine.trim()) {
      Alert.alert("Erreur", "L'adresse est requise");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Erreur", "La ville est requise");
      return;
    }
    if (!postalCode.trim()) {
      Alert.alert("Erreur", "Le code postal est requis");
      return;
    }

    setSaving(true);

    try {
      const input: AddressInput = {
        label,
        address_line: addressLine.trim(),
        address_line_2: addressLine2.trim() || undefined,
        city: city.trim(),
        postal_code: postalCode.trim(),
        country: "France",
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        instructions: instructions.trim() || undefined,
        is_default: isDefault,
      };

      let result;
      if (isEditing) {
        result = await updateAddress(id!, input);
      } else {
        result = await createAddress(input);
      }

      if (result) {
        router.back();
      } else {
        Alert.alert("Erreur", "Impossible de sauvegarder l'adresse");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? "Modifier l'adresse" : "Nouvelle adresse"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bouton géolocalisation */}
          <Pressable
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Ionicons name="locate" size={20} color={theme.accent} />
            )}
            <Text style={styles.locationButtonText}>
              {locating ? "Localisation..." : "Utiliser ma position actuelle"}
            </Text>
          </Pressable>

          {/* Label */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type d'adresse</Text>
            <View style={styles.labelOptions}>
              {LABEL_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.labelOption,
                    label === option.value && styles.labelOptionSelected,
                  ]}
                  onPress={() => setLabel(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={label === option.value ? theme.white : theme.text}
                  />
                  <Text
                    style={[
                      styles.labelOptionText,
                      label === option.value && styles.labelOptionTextSelected,
                    ]}
                  >
                    {option.value}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse</Text>
            
            <FormInput
              label="Adresse"
              value={addressLine}
              onChangeText={setAddressLine}
              placeholder="12 rue de la Paix"
              required
              autoCapitalize="words"
            />

            <FormInput
              label="Complément"
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Bât. A, Apt. 12, Digicode 1234..."
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <FormInput
                  label="Code postal"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="75001"
                  required
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <FormInput
                  label="Ville"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Paris"
                  required
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions (optionnel)</Text>
            <FormInput
              label="Instructions pour le coiffeur"
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Code portail, étage, interphone..."
              multiline
            />
          </View>

          {/* Position GPS */}
          {latitude && longitude && (
            <View style={styles.gpsInfo}>
              <Ionicons name="checkmark-circle" size={18} color={theme.success} />
              <Text style={styles.gpsInfoText}>
                Position GPS enregistrée
              </Text>
            </View>
          )}

          {/* Par défaut */}
          <Pressable
            style={styles.defaultToggle}
            onPress={() => setIsDefault(!isDefault)}
          >
            <Ionicons
              name={isDefault ? "checkbox" : "square-outline"}
              size={24}
              color={isDefault ? theme.accent : theme.textMuted}
            />
            <Text style={styles.defaultToggleText}>
              Définir comme adresse par défaut
            </Text>
          </Pressable>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? "Enregistrer" : "Ajouter l'adresse"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },

  // Scroll
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Location Button
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: theme.accentLight,
    borderRadius: 12,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.accent,
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },

  // Label Options
  labelOptions: {
    flexDirection: "row",
    gap: 12,
  },
  labelOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.card,
  },
  labelOptionSelected: {
    backgroundColor: theme.black,
  },
  labelOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  labelOptionTextSelected: {
    color: theme.white,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.textSecondary,
    marginBottom: 8,
  },
  required: {
    color: theme.error,
  },
  textInput: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Row
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  // GPS Info
  gpsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.successLight,
    borderRadius: 10,
  },
  gpsInfoText: {
    fontSize: 14,
    color: theme.success,
    fontWeight: "500",
  },

  // Default Toggle
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    paddingVertical: 12,
  },
  defaultToggleText: {
    fontSize: 15,
    color: theme.text,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.white,
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: theme.black,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    backgroundColor: theme.textMuted,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
  },
});