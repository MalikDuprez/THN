// app/(auth)/onboarding/contact.tsx
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
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

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

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    firstName: string;
    lastName: string;
    gender: string;
    genderCustom: string;
    birthDate: string;
  }>();

  // Form state
  const [phone, setPhone] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Validation - téléphone français (10 chiffres)
  const phoneClean = phone.replace(/\s/g, "");
  const isValidPhone = /^(0[1-9])\d{8}$/.test(phoneClean);

  const handleNext = async () => {
    if (!isValidPhone) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone valide");
      return;
    }

    setIsChecking(true);

    try {
      // Vérifier que le numéro n'est pas déjà utilisé
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phoneClean)
        .maybeSingle();

      if (existingPhone) {
        Alert.alert(
          "Numéro déjà utilisé",
          "Ce numéro de téléphone est déjà associé à un autre compte. Veuillez en utiliser un autre."
        );
        return;
      }

      router.push({
        pathname: "/(auth)/onboarding/address",
        params: {
          ...params,
          phone: phoneClean,
          avatarUri: avatarUri || "",
        },
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de vérifier le numéro. Réessayez.");
    } finally {
      setIsChecking(false);
    }
  };

  const handlePickImage = async () => {
    // Demander la permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à vos photos pour choisir une image de profil."
      );
      return;
    }

    // Ouvrir le picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    // Demander la permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à votre caméra pour prendre une photo."
      );
      return;
    }

    // Ouvrir la caméra
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert("Photo de profil", "Comment voulez-vous ajouter une photo ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Prendre une photo", onPress: handleTakePhoto },
      { text: "Choisir une photo", onPress: handlePickImage },
    ]);
  };

  // Formater le numéro de téléphone (XX XX XX XX XX)
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})$/);
    if (match) {
      return [match[1], match[2], match[3], match[4], match[5]]
        .filter(Boolean)
        .join(" ");
    }
    return cleaned;
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
            <View style={[styles.progressFill, { width: "66%" }]} />
          </View>
          <Text style={styles.progressText}>Étape 2/3</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vos coordonnées</Text>
          <Text style={styles.subtitle}>
            Pour vous contacter lors de vos rendez-vous
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarContainer} onPress={handleAvatarPress}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={theme.gray500} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color={theme.white} />
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>
            Ajoutez une photo (optionnel)
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={styles.phoneContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇫🇷 +33</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="06 12 34 56 78"
                placeholderTextColor={theme.gray500}
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={14} // XX XX XX XX XX
              />
            </View>
            <Text style={styles.hint}>
              Nous vous enverrons des rappels de rendez-vous par SMS
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, (!isValidPhone || isChecking) && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isValidPhone || isChecking}
          >
            {isChecking ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.white} />
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isChecking}
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

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.black,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: theme.white,
  },
  avatarHint: {
    fontSize: 14,
    color: theme.gray500,
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
  hint: {
    fontSize: 13,
    color: theme.gray500,
    marginTop: 4,
  },

  // Phone
  phoneContainer: {
    flexDirection: "row",
    gap: 12,
  },
  countryCode: {
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 16,
    color: theme.black,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.black,
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