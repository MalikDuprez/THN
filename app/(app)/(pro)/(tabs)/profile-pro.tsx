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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { ROUTES } from "@/constants/routes";
import { 
  getMyCoiffeurProfile, 
  updateCoiffeurProfile,
  getServicesByCoiffeur,
} from "@/api/coiffeurs";
import { updateProfile } from "@/api/profiles";
import type { CoiffeurWithDetails, Service } from "@/types/database";
import { formatPriceShort } from "@/types/database";
import { useAuthStore } from "@/stores/authStore";

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
  displayName: string;
  bio: string;
  phone: string;
  email: string;
  avatarUrl: string;
}

interface ZoneData {
  address: string;
  city: string;
  offersHomeService: boolean;
  homeServiceRadius: number;
  homeServiceFee: number;
}

// ============================================
// COMPOSANTS
// ============================================
const ProfileHeader = ({ 
  coiffeur, 
  onEditPress, 
  onSettingsPress 
}: { 
  coiffeur: CoiffeurWithDetails;
  onEditPress: () => void;
  onSettingsPress: () => void;
}) => {
  const displayName = coiffeur.display_name || coiffeur.profile?.full_name || "Coiffeur";
  const avatarUrl = coiffeur.avatar_url || coiffeur.profile?.avatar_url;
  
  return (
    <View style={styles.profileHeader}>
      <Pressable style={styles.settingsButton} onPress={onSettingsPress}>
        <Ionicons name="settings-outline" size={24} color={theme.white} />
      </Pressable>
      <View style={styles.profileImageContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
            <Ionicons name="person" size={40} color={theme.textMuted} />
          </View>
        )}
        <View style={[
          styles.onlineIndicator, 
          { backgroundColor: coiffeur.is_available ? theme.success : theme.textMuted }
        ]} />
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={18} color="#FBBF24" />
        <Text style={styles.ratingText}>{Number(coiffeur.rating || 0).toFixed(1)}</Text>
        <Text style={styles.reviewsText}>({coiffeur.reviews_count || 0} avis)</Text>
      </View>
      <Pressable style={styles.editProfileButton} onPress={onEditPress}>
        <Ionicons name="create-outline" size={18} color={theme.white} />
        <Text style={styles.editProfileButtonText}>Modifier le profil</Text>
      </Pressable>
    </View>
  );
};

const SectionHeader = ({ title, actionText, onAction }: { 
  title: string; 
  actionText?: string; 
  onAction?: () => void 
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionText && (
      <Pressable onPress={onAction}>
        <Text style={styles.sectionAction}>{actionText}</Text>
      </Pressable>
    )}
  </View>
);

const ServiceItem = ({ service, onPress }: { 
  service: Service; 
  onPress: () => void 
}) => (
  <Pressable style={styles.serviceItem} onPress={onPress}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <Text style={styles.serviceDuration}>{service.duration_minutes} min</Text>
    </View>
    <View style={styles.serviceRight}>
      <Text style={styles.servicePrice}>{formatPriceShort(service.price_cents)}</Text>
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
const EditProfileModal = ({ 
  visible, 
  onClose, 
  coiffeur,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  coiffeur: CoiffeurWithDetails;
  onSave: (data: ProfileData) => Promise<void>;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      // Charger les données actuelles
      setName(coiffeur.display_name || coiffeur.profile?.full_name || "");
      setBio(coiffeur.bio || "");
      setPhone(coiffeur.profile?.phone || "");
      setEmail(coiffeur.profile?.email || "");
      
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, coiffeur]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        displayName: name,
        bio,
        phone,
        email,
        avatarUrl: coiffeur.avatar_url || "",
      });
      handleClose();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = coiffeur.avatar_url || coiffeur.profile?.avatar_url;

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
            {/* Photo */}
            <View style={styles.editPhotoSection}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.editPhoto} />
              ) : (
                <View style={[styles.editPhoto, styles.editPhotoPlaceholder]}>
                  <Ionicons name="person" size={32} color={theme.textMuted} />
                </View>
              )}
              <Pressable style={styles.changePhotoButton}>
                <Ionicons name="camera" size={16} color={theme.white} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nom d'affichage</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={bio}
              onChangeText={setBio}
              placeholder="Décrivez-vous en quelques mots..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="06 XX XX XX XX"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemple.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Pressable 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
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
const ServicesModal = ({ 
  visible, 
  onClose, 
  services 
}: {
  visible: boolean;
  onClose: () => void;
  services: Service[];
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
              <Text style={styles.modalTitle}>Mes services ({services.length})</Text>
            </View>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {services.length === 0 ? (
              <View style={styles.emptyServices}>
                <Ionicons name="cut-outline" size={48} color={theme.textMuted} />
                <Text style={styles.emptyServicesText}>Aucun service configuré</Text>
              </View>
            ) : (
              services.map((service) => (
                <View key={service.id} style={styles.editServiceItem}>
                  <View style={styles.editServiceInfo}>
                    <Text style={styles.editServiceName}>{service.name}</Text>
                    <View style={styles.editServiceDetails}>
                      <Text style={styles.editServiceDuration}>{service.duration_minutes} min</Text>
                      <Text style={styles.editServicePrice}>{formatPriceShort(service.price_cents)}</Text>
                    </View>
                    <View style={styles.serviceLocations}>
                      {service.available_at_salon && (
                        <View style={styles.locationBadge}>
                          <Ionicons name="storefront" size={10} color={theme.accent} />
                          <Text style={styles.locationBadgeText}>Salon</Text>
                        </View>
                      )}
                      {service.available_at_home && (
                        <View style={styles.locationBadge}>
                          <Ionicons name="home" size={10} color={theme.success} />
                          <Text style={styles.locationBadgeText}>Domicile</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Pressable style={styles.editServiceButton}>
                    <Ionicons name="create-outline" size={18} color={theme.accent} />
                  </Pressable>
                </View>
              ))
            )}

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
// MODALE ZONE D'INTERVENTION
// ============================================
const ZoneModal = ({ 
  visible, 
  onClose, 
  coiffeur,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  coiffeur: CoiffeurWithDetails;
  onSave: (data: ZoneData) => Promise<void>;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [offersHomeService, setOffersHomeService] = useState(false);
  const [radius, setRadius] = useState("10");
  const [fee, setFee] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

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
      setAddress(coiffeur.address || "");
      setCity(coiffeur.city || "");
      setOffersHomeService(coiffeur.offers_home_service || false);
      setRadius((coiffeur.home_service_radius_km || 10).toString());
      setFee(((coiffeur.home_service_fee_cents || 0) / 100).toString());
      
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, coiffeur]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        address,
        city,
        offersHomeService,
        homeServiceRadius: parseInt(radius) || 10,
        homeServiceFee: parseFloat(fee) * 100 || 0,
      });
      handleClose();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
    } finally {
      setIsSaving(false);
    }
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
              placeholder="15 Rue de la Coiffure"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="Paris"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Je me déplace chez les clients</Text>
                <Text style={styles.switchDescription}>Activez pour proposer des services à domicile</Text>
              </View>
              <Switch
                value={offersHomeService}
                onValueChange={setOffersHomeService}
                trackColor={{ false: theme.border, true: theme.accentLight }}
                thumbColor={offersHomeService ? theme.accent : theme.textMuted}
              />
            </View>

            {offersHomeService && (
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

                <Text style={styles.inputLabel}>Frais de déplacement (€)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fee}
                  onChangeText={setFee}
                  placeholder="15"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            <Pressable 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
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
  
  const [coiffeur, setCoiffeur] = useState<CoiffeurWithDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [servicesVisible, setServicesVisible] = useState(false);
  const [zoneVisible, setZoneVisible] = useState(false);

  // Charger les données
  const loadData = useCallback(async () => {
    const profile = await getMyCoiffeurProfile();
    if (profile) {
      setCoiffeur(profile);
      // Charger les services séparément pour avoir la liste complète
      const servicesData = await getServicesByCoiffeur(profile.id);
      setServices(servicesData);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Sauvegarder le profil
  const handleSaveProfile = async (data: ProfileData) => {
    if (!coiffeur) return;
    
    // Mettre à jour le profil coiffeur
    await updateCoiffeurProfile({
      display_name: data.displayName,
      bio: data.bio,
    });
    
    // Mettre à jour le profil utilisateur (phone, email)
    if (coiffeur.profile_id) {
      await updateProfile(coiffeur.profile_id, {
        phone: data.phone,
      });
    }
    
    // Recharger les données
    await loadData();
  };

  // Sauvegarder la zone
  const handleSaveZone = async (data: ZoneData) => {
    await updateCoiffeurProfile({
      address: data.address,
      city: data.city,
      offers_home_service: data.offersHomeService,
      home_service_radius_km: data.homeServiceRadius,
      home_service_fee_cents: data.homeServiceFee,
    });
    
    await loadData();
  };

  // Déconnexion
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnecter", 
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          }
        },
      ]
    );
  };

  // État de chargement
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.white} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  // Pas de profil coiffeur
  if (!coiffeur) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.white} />
        <Text style={styles.errorTitle}>Profil non trouvé</Text>
        <Text style={styles.errorText}>Vous n'avez pas de profil coiffeur actif</Text>
        <Pressable style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = coiffeur.display_name || coiffeur.profile?.full_name || "Coiffeur";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ProfileHeader 
          coiffeur={coiffeur}
          onEditPress={() => setEditProfileVisible(true)} 
          onSettingsPress={() => router.push(ROUTES.PRO.SETTINGS)}
        />
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
            />
          }
        >
          {/* Services */}
          <SectionHeader 
            title="Services & Tarifs" 
            actionText="Gérer" 
            onAction={() => setServicesVisible(true)} 
          />
          <View style={styles.servicesPreview}>
            {services.length === 0 ? (
              <View style={styles.noServicesCard}>
                <Ionicons name="add-circle-outline" size={24} color={theme.accent} />
                <Text style={styles.noServicesText}>Ajoutez vos services</Text>
              </View>
            ) : (
              <>
                {services.slice(0, 3).map((service) => (
                  <ServiceItem 
                    key={service.id} 
                    service={service} 
                    onPress={() => setServicesVisible(true)} 
                  />
                ))}
                {services.length > 3 && (
                  <Pressable style={styles.viewAllButton} onPress={() => setServicesVisible(true)}>
                    <Text style={styles.viewAllText}>Voir les {services.length} services</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.accent} />
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* Zone */}
          <SectionHeader 
            title="Zone d'intervention" 
            actionText="Modifier" 
            onAction={() => setZoneVisible(true)} 
          />
          <View style={styles.zoneCard}>
            <View style={styles.zoneRow}>
              <Ionicons name="location-outline" size={20} color={theme.accent} />
              <Text style={styles.zoneText}>
                {coiffeur.address || coiffeur.city || "Adresse non renseignée"}
              </Text>
            </View>
            {coiffeur.offers_home_service && (
              <View style={styles.zoneRow}>
                <Ionicons name="car-outline" size={20} color={theme.success} />
                <Text style={styles.zoneText}>
                  Déplacement jusqu'à {coiffeur.home_service_radius_km || 10} km
                  {coiffeur.home_service_fee_cents ? ` (+${formatPriceShort(coiffeur.home_service_fee_cents)})` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Statistiques */}
          <SectionHeader title="Statistiques" />
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coiffeur.reviews_count || 0}</Text>
              <Text style={styles.statLabel}>Avis clients</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Number(coiffeur.rating || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coiffeur.is_verified ? "✓" : "-"}</Text>
              <Text style={styles.statLabel}>Vérifié</Text>
            </View>
          </View>

          {/* Liens rapides */}
          <SectionHeader title="Mon compte" />
          <View style={styles.settingsCard}>
            <SettingItem 
              icon="shield-checkmark-outline" 
              label="Vérification d'identité" 
              value={coiffeur.is_verified ? "Vérifié" : "Non vérifié"} 
              onPress={() => {}} 
            />
            <SettingItem 
              icon="help-circle-outline" 
              label="Aide & Support" 
              onPress={() => {}} 
            />
          </View>

          {/* Déconnexion */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
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
        coiffeur={coiffeur}
        onSave={handleSaveProfile}
      />
      <ServicesModal 
        visible={servicesVisible} 
        onClose={() => setServicesVisible(false)} 
        services={services} 
      />
      <ZoneModal 
        visible={zoneVisible} 
        onClose={() => setZoneVisible(false)} 
        coiffeur={coiffeur}
        onSave={handleSaveZone}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },
  centered: { justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { color: theme.white, marginTop: 16, fontSize: 15 },
  errorTitle: { color: theme.white, fontSize: 20, fontWeight: "bold", marginTop: 16 },
  errorText: { color: "rgba(255,255,255,0.6)", fontSize: 15, marginTop: 8, textAlign: "center" },
  retryButton: { marginTop: 24, backgroundColor: theme.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: theme.black, fontWeight: "600", fontSize: 15 },

  // Header
  header: { backgroundColor: theme.black, paddingHorizontal: 20, paddingBottom: 24 },
  profileHeader: { alignItems: "center" },
  settingsButton: { position: "absolute", top: 0, right: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  profileImageContainer: { position: "relative", marginBottom: 12 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.white },
  profileImagePlaceholder: { backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
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
  noServicesCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  noServicesText: { fontSize: 14, color: theme.accent, fontWeight: "500" },

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
  editPhotoPlaceholder: { backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  changePhotoButton: { position: "absolute", bottom: 0, right: "35%", width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: theme.white },
  inputLabel: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: { backgroundColor: theme.card, borderRadius: 14, padding: 16, fontSize: 15, color: theme.text, marginBottom: 20 },
  textArea: { backgroundColor: theme.card, borderRadius: 14, padding: 16, fontSize: 15, color: theme.text, minHeight: 100, marginBottom: 20 },
  saveButton: { backgroundColor: theme.black, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: theme.white },

  // Edit Services
  emptyServices: { alignItems: "center", padding: 32 },
  emptyServicesText: { marginTop: 12, fontSize: 15, color: theme.textMuted },
  editServiceItem: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  editServiceInfo: { flex: 1 },
  editServiceName: { fontSize: 15, fontWeight: "600", color: theme.text },
  editServiceDetails: { flexDirection: "row", gap: 12, marginTop: 4 },
  editServiceDuration: { fontSize: 13, color: theme.textMuted },
  editServicePrice: { fontSize: 13, fontWeight: "600", color: theme.accent },
  serviceLocations: { flexDirection: "row", gap: 8, marginTop: 8 },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.white, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  locationBadgeText: { fontSize: 11, color: theme.textSecondary },
  editServiceButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.accentLight, alignItems: "center", justifyContent: "center" },
  addServiceButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderWidth: 2, borderColor: theme.border, borderStyle: "dashed", borderRadius: 14, marginTop: 10, marginBottom: 20 },
  addServiceButtonText: { fontSize: 15, fontWeight: "600", color: theme.accent },

  // Zone Modal
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 20 },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: "600", color: theme.text },
  switchDescription: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
});