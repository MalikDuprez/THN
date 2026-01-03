// src/api/pushNotifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";

// ============================================
// CONFIGURATION
// ============================================

// Configurer le comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================
// TYPES
// ============================================

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_type: "ios" | "android" | "web";
  device_name: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// FONCTIONS
// ============================================

/**
 * Enregistrer le token push de l'appareil
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Vérifier que c'est un appareil physique
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Vérifier les permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Demander les permissions si pas encore accordées
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permissions not granted");
    return null;
  }

  // Obtenir le token Expo Push
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    const token = tokenData.data;
    console.log("📱 Push token obtained:", token.substring(0, 30) + "...");

    // Sauvegarder le token en BDD
    await savePushToken(token);

    // Configuration spécifique Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Sauvegarder le token en base de données
 */
async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const deviceType = Platform.OS as "ios" | "android" | "web";
  const deviceName = Device.modelName || Device.deviceName || null;

  // Upsert le token (insert ou update si existe déjà)
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        profile_id: user.id,
        token: token,
        device_type: deviceType,
        device_name: deviceName,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: "token",
      }
    );

  if (error) {
    console.error("Error saving push token:", error);
  } else {
    console.log("✅ Push token saved to database");
  }
}

/**
 * Désactiver le token (à la déconnexion)
 */
export async function disablePushToken(): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    const { error } = await supabase
      .from("push_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("token", token);

    if (error) {
      console.error("Error disabling push token:", error);
    } else {
      console.log("✅ Push token disabled");
    }
  } catch (error) {
    console.error("Error disabling push token:", error);
  }
}

/**
 * Supprimer tous les tokens de l'utilisateur
 */
export async function removeAllPushTokens(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("profile_id", user.id);

  if (error) {
    console.error("Error removing push tokens:", error);
  }
}

/**
 * Listener pour les notifications reçues (app ouverte)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listener pour les notifications tapées (ouvrir l'app)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Réinitialiser le badge de l'app
 */
export async function resetBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Définir le badge de l'app
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}