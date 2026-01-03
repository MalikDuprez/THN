// app/(app)/(pro)/(tabs)/profile-pro.tsx
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
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { ROUTES } from "@/constants/routes";
import { getUserAvatar } from "@/constants/images";
import { getMyCoiffeurProfile, getCoiffeurServices } from "@/api/coiffeurs";
import { useAuthStore } from "@/stores/authStore";
import type { CoiffeurWithDetails, Service } from "@/types/database";

const { height, width } = Dimensions.get("window");

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
// TYPES
// ============================================
interface ProfileData {
  id: string;
  name: string;
  photo: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  phone: string;
  email: string;
  isOnline: boolean;
  address: string;
  radius: number;
  canTravel: boolean;
}

interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration: number;
}

// ============================================
// COMPOSANTS
// ============================================
const ProfileHeader = ({ profile, onEditPress, onSettingsPress }: { 
  profile: ProfileData; 
  onEditPress: () => void;
  onSettingsPress: () => void;
}) => (
  <View style={styles.profileHeader}>
    <Pressable style={styles.settingsButton} onPress={onSettingsPress}>
      <Ionicons name="settings-outline" size={24} color={theme.white} />
    </Pressable>
    <View style={styles.profileImageContainer}>
      <Image source={{ uri: profile.photo }} style={styles.profileImage} />
      <View style={[styles.onlineIndicator, { backgroundColor: profile.isOnline ? theme.success : theme.textMuted }]} />
    </View>
    <Text style={styles.profileName}>{profile.name}</Text>
    <View style={styles.ratingContainer}>
      <Ionicons name="star" size={18} color="#FBBF24" />
      <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
      <Text style={styles.reviewsText}>({profile.reviewsCount} avis)</Text>
    </View>
    <Pressable style={styles.editProfileButton} onPress={onEditPress}>
      <Ionicons name="create-outline" size={18} color={theme.white} />
      <Text style={styles.editProfileButtonText}>Modifier le profil</Text>
    </Pressable>
  </View>
);

const SectionHeader = ({ title, actionText, onAction }: { title: string; actionText?: string; onAction?: () => void }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionText && (
      <Pressable onPress={onAction}>
        <Text style={styles.sectionAction}>{actionText}</Text>
      </Pressable>
    )}
  </View>
);

const ServiceItem = ({ service, onPress }: { service: ServiceData; onPress: () => void }) => (
  <Pressable style={styles.serviceItem} onPress={onPress}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <Text style={styles.serviceDuration}>{service.duration} min</Text>
    </View>
    <View style={styles.serviceRight}>
      <Text style={styles.servicePrice}>{service.price}€</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </View>
  </Pressable>
);

const SettingItem = ({ icon, label, value, onPress, isSwitch, switchValue, onSwitchChange }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}) => (
  <Pressable style={styles.settingItem} onPress={onPress} disabled={isSwitch}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={20} color={theme.accent} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    {isSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: theme.border, true: theme.accentLight }}
        thumbColor={switchValue ? theme.accent : theme.textMuted}
      />
    ) : (
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </View>
    )}
  </Pressable>
);

// ============================================
// MODALE MODIFIER PROFIL
// ============================================
const EditProfileModal = ({ visible, onClose, profile, onSave }: {
  visible: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [phone, setPhone] = useState(profile.phone);

  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setBio(profile.bio);
      setPhone(profile.phone);
      
      translateY.setValue(height);
      backdropAnim.setValue(0);
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

  const handleSave = () => {
    // TODO: Sauvegarder dans Supabase
    Alert.alert("Succès", "Profil mis à jour !");
    onSave();
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.modal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
            </View>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.editPhotoSection}>
              <Image source={{ uri: profile.photo }} style={styles.editPhoto} />
              <Pressable style={styles.changePhotoButton}>
                <Ionicons name="camera" size={18} color={theme.white} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nom d'affichage</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom professionnel"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={bio}
              onChangeText={setBio}
              placeholder="Décrivez votre expérience..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Votre numéro"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// MODALE SERVICES
// ============================================
const ServicesModal = ({ visible, onClose, services }: {
  visible: boolean;
  onClose: () => void;
  services: ServiceData[];
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(height);
      backdropAnim.setValue(0);
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

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.modal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes services</Text>
            </View>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {services.map((service) => (
              <View key={service.id} style={styles.editServiceItem}>
                <View style={styles.editServiceInfo}>
                  <Text style={styles.editServiceName}>{service.name}</Text>
                  <View style={styles.editServiceDetails}>
                    <Text style={styles.editServiceDuration}>{service.duration} min</Text>
                    <Text style={styles.editServicePrice}>{service.price}€</Text>
                  </View>
                </View>
                <Pressable style={styles.editServiceButton}>
                  <Ionicons name="create-outline" size={18} color={theme.accent} />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addServiceButton}>
              <Ionicons name="add" size={20} color={theme.accent} />
              <Text style={styles.addServiceButtonText}>Ajouter un service</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// MODALE ZONE
// ============================================
const ZoneModal = ({ visible, onClose, profile }: {
  visible: boolean;
  onClose: () => void;
  profile: ProfileData;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [address, setAddress] = useState(profile.address);
  const [canTravel, setCanTravel] = useState(profile.canTravel);
  const [radius, setRadius] = useState(String(profile.radius));

  useEffect(() => {
    if (visible) {
      setAddress(profile.address);
      setCanTravel(profile.canTravel);
      setRadius(String(profile.radius));
      
      translateY.setValue(height);
      backdropAnim.setValue(0);
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

  const handleSave = () => {
    // TODO: Sauvegarder dans Supabase
    Alert.alert("Succès", "Zone mise à jour !");
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.modal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zone d'intervention</Text>
            </View>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Adresse du salon</Text>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Votre adresse"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Je me déplace chez les clients</Text>
                <Text style={styles.switchDescription}>Activez pour proposer des services à domicile</Text>
              </View>
              <Switch
                value={canTravel}
                onValueChange={setCanTravel}
                trackColor={{ false: theme.border, true: theme.accentLight }}
                thumbColor={canTravel ? theme.accent : theme.textMuted}
              />
            </View>

            {canTravel && (
              <>
                <Text style={styles.inputLabel}>Rayon de déplacement (km)</Text>
                <TextInput
                  style={styles.textInput}
                  value={radius}
                  onChangeText={setRadius}
                  placeholder="10"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                />
              </>
            )}

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function ProfileProScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthStore();
  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [servicesVisible, setServicesVisible] = useState(false);
  const [zoneVisible, setZoneVisible] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [coiffeurProfile, setCoiffeurProfile] = useState<CoiffeurWithDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Charger les données du coiffeur
  const loadData = useCallback(async () => {
    try {
      const [profile, servicesData] = await Promise.all([
        getMyCoiffeurProfile(),
        getCoiffeurServices(),
      ]);
      setCoiffeurProfile(profile);
      setServices(servicesData || []);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSettings = () => {
    router.push(ROUTES.SHARED.SETTINGS.INDEX);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Se déconnecter",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace(ROUTES.AUTH.WELCOME);
          },
        },
      ]
    );
  };

  // Transformer les données pour l'affichage
  const profileData: ProfileData = {
    id: coiffeurProfile?.id || "",
    name: coiffeurProfile?.display_name || 
          coiffeurProfile?.profile?.full_name || 
          `${coiffeurProfile?.profile?.first_name || ""} ${coiffeurProfile?.profile?.last_name || ""}`.trim() ||
          "Coiffeur",
    photo: getUserAvatar(
      coiffeurProfile?.avatar_url || coiffeurProfile?.profile?.avatar_url,
      coiffeurProfile?.display_name || "Coiffeur"
    ),
    bio: coiffeurProfile?.bio || "",
    rating: coiffeurProfile?.rating || 0,
    reviewsCount: coiffeurProfile?.reviews_count || 0,
    phone: coiffeurProfile?.profile?.phone || "",
    email: coiffeurProfile?.profile?.email || "",
    isOnline: coiffeurProfile?.is_available ?? true,
    address: coiffeurProfile?.address || "",
    radius: coiffeurProfile?.travel_radius || 10,
    canTravel: coiffeurProfile?.can_travel ?? true,
  };

  const servicesData: ServiceData[] = services.map(s => ({
    id: s.id,
    name: s.name,
    price: Math.round((s.price_cents || 0) / 100),
    duration: s.duration_minutes || 30,
  }));

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.white} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ProfileHeader 
          profile={profileData} 
          onEditPress={() => setEditProfileVisible(true)} 
          onSettingsPress={handleSettings}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          {/* Services */}
          <SectionHeader title="Mes services" actionText="Gérer" onAction={() => setServicesVisible(true)} />
          <View style={styles.servicesPreview}>
            {servicesData.slice(0, 3).map((service, index) => (
              <ServiceItem key={service.id} service={service} onPress={() => setServicesVisible(true)} />
            ))}
            {servicesData.length > 3 && (
              <Pressable style={styles.viewAllButton} onPress={() => setServicesVisible(true)}>
                <Text style={styles.viewAllText}>Voir tous les services ({servicesData.length})</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.accent} />
              </Pressable>
            )}
            {servicesData.length === 0 && (
              <Pressable style={styles.viewAllButton} onPress={() => setServicesVisible(true)}>
                <Text style={styles.viewAllText}>Ajouter des services</Text>
                <Ionicons name="add" size={16} color={theme.accent} />
              </Pressable>
            )}
          </View>

          {/* Zone */}
          <SectionHeader title="Zone d'intervention" actionText="Modifier" onAction={() => setZoneVisible(true)} />
          <View style={styles.zoneCard}>
            <View style={styles.zoneRow}>
              <Ionicons name="location-outline" size={20} color={theme.accent} />
              <Text style={styles.zoneText}>{profileData.address || "Adresse non renseignée"}</Text>
            </View>
            {profileData.canTravel && (
              <View style={styles.zoneRow}>
                <Ionicons name="car-outline" size={20} color={theme.success} />
                <Text style={styles.zoneText}>Déplacement jusqu'à {profileData.radius} km</Text>
              </View>
            )}
          </View>

          {/* Statistiques rapides */}
          <SectionHeader title="Statistiques" />
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.reviewsCount}</Text>
              <Text style={styles.statLabel}>Avis clients</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{servicesData.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
          </View>

          {/* Liens rapides */}
          <SectionHeader title="Mon compte" />
          <View style={styles.settingsCard}>
            <SettingItem icon="shield-checkmark-outline" label="Vérification d'identité" value="Vérifié" onPress={() => {}} />
            <SettingItem icon="swap-horizontal" label="Passer en mode Client" onPress={() => router.replace(ROUTES.CLIENT.HOME)} />
            <SettingItem icon="help-circle-outline" label="Aide & Support" onPress={() => {}} />
          </View>

          {/* Déconnexion */}
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>

          <Text style={styles.versionText}>TapeHair Pro v1.0.0</Text>
        </ScrollView>
      </View>

      {/* Modales */}
      <EditProfileModal 
        visible={editProfileVisible} 
        onClose={() => setEditProfileVisible(false)} 
        profile={profileData}
        onSave={loadData}
      />
      <ServicesModal 
        visible={servicesVisible} 
        onClose={() => setServicesVisible(false)} 
        services={servicesData} 
      />
      <ZoneModal 
        visible={zoneVisible} 
        onClose={() => setZoneVisible(false)} 
        profile={profileData} 
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: theme.white, marginTop: 16, fontSize: 16 },

  // Header
  header: { backgroundColor: theme.black, paddingHorizontal: 20, paddingBottom: 24 },
  profileHeader: { alignItems: "center" },
  settingsButton: { position: "absolute", top: 0, right: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  profileImageContainer: { position: "relative", marginBottom: 12 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.white },
  onlineIndicator: { position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: theme.black },
  profileName: { fontSize: 24, fontWeight: "bold", color: theme.white, marginBottom: 8 },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  ratingText: { fontSize: 16, fontWeight: "600", color: theme.white },
  reviewsText: { fontSize: 14, color: "rgba(255,255,255,0.6)" },
  editProfileButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  editProfileButtonText: { fontSize: 14, fontWeight: "600", color: theme.white },

  // Content
  content: { flex: 1, backgroundColor: theme.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scrollView: { flex: 1, paddingTop: 24 },

  // Section Header
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: theme.text },
  sectionAction: { fontSize: 14, fontWeight: "600", color: theme.accent },

  // Services Preview
  servicesPreview: { marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, overflow: "hidden" },
  serviceItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "600", color: theme.text },
  serviceDuration: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  serviceRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  servicePrice: { fontSize: 15, fontWeight: "bold", color: theme.text },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 14 },
  viewAllText: { fontSize: 14, fontWeight: "600", color: theme.accent },

  // Zone Card
  zoneCard: { marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 12, marginBottom: 16 },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  zoneText: { fontSize: 14, color: theme.text, flex: 1 },

  // Stats Card
  statsCard: { flexDirection: "row", marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: theme.text },
  statLabel: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 8 },

  // Settings Card
  settingsCard: { marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  settingItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.accentLight, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 15, color: theme.text },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: { fontSize: 13, color: theme.success, fontWeight: "500" },

  // Logout
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 8, paddingVertical: 16, backgroundColor: theme.errorLight, borderRadius: 14 },
  logoutText: { fontSize: 15, fontWeight: "600", color: theme.error },
  versionText: { textAlign: "center", fontSize: 12, color: theme.textMuted, marginTop: 20, marginBottom: 20 },

  // Modal
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.9 },
  dragIndicatorContainer: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  modalHeader: { paddingHorizontal: 20, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: theme.text },
  modalScroll: { paddingHorizontal: 20 },

  // Edit Profile
  editPhotoSection: { alignItems: "center", marginBottom: 24 },
  editPhoto: { width: 100, height: 100, borderRadius: 50 },
  changePhotoButton: { position: "absolute", bottom: 0, right: "35%", width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: theme.white },
  inputLabel: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: { backgroundColor: theme.card, borderRadius: 14, padding: 16, fontSize: 15, color: theme.text, marginBottom: 20 },
  textArea: { backgroundColor: theme.card, borderRadius: 14, padding: 16, fontSize: 15, color: theme.text, minHeight: 100, marginBottom: 20 },
  saveButton: { backgroundColor: theme.black, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: theme.white },

  // Edit Services
  editServiceItem: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  editServiceInfo: { flex: 1 },
  editServiceName: { fontSize: 15, fontWeight: "600", color: theme.text },
  editServiceDetails: { flexDirection: "row", gap: 12, marginTop: 4 },
  editServiceDuration: { fontSize: 13, color: theme.textMuted },
  editServicePrice: { fontSize: 13, fontWeight: "600", color: theme.accent },
  editServiceButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.accentLight, alignItems: "center", justifyContent: "center" },
  addServiceButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderWidth: 2, borderColor: theme.border, borderStyle: "dashed", borderRadius: 14, marginTop: 10, marginBottom: 20 },
  addServiceButtonText: { fontSize: 15, fontWeight: "600", color: theme.accent },

  // Zone Modal
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 20 },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: "600", color: theme.text },
  switchDescription: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
});