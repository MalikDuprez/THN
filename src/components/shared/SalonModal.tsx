// components/shared/SalonModal.tsx
import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";

const { width, height } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  error: "#C62828",
  errorLight: "#FFEBEE",
};

interface SalonService {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  description?: string;
  availableCoiffeurIds?: string[];
}

interface SalonCoiffeur {
  id: string;
  name: string;
  image: string;
  specialties: string[];
}

interface Salon {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  priceRange: string;
  isOpen: boolean;
  offersHomeService: boolean;
  offersSalonService: boolean;
  homeServiceFee?: number;
  services: string[];
  image: string;
}

// Type pour les données de succès
interface SuccessData {
  title: string;
  subtitle: string;
  recapImage?: string;
  recapTitle?: string;
  recapSubtitle?: string;
  recapItems?: { icon: string; text: string }[];
  priceLabel?: string;
  priceValue?: string;
  buttonText?: string;
}

interface SalonModalProps {
  visible: boolean;
  salon: Salon | null;
  onClose: () => void;
  onSuccess?: (data: SuccessData) => void;
}

// Mock services du salon avec spécialités coiffeurs
const SALON_SERVICES: SalonService[] = [
  { id: "1", name: "Coupe Femme", category: "Coupe", duration: "45 min", price: 45 },
  { id: "2", name: "Coupe Homme", category: "Coupe", duration: "30 min", price: 28 },
  { id: "3", name: "Brushing", category: "Coiffage", duration: "30 min", price: 25 },
  { id: "4", name: "Coloration", category: "Couleur", duration: "1h30", price: 65, availableCoiffeurIds: ["1", "3"] },
  { id: "5", name: "Balayage", category: "Couleur", duration: "2h", price: 95, availableCoiffeurIds: ["1"] },
  { id: "6", name: "Mèches", category: "Couleur", duration: "1h45", price: 75, availableCoiffeurIds: ["1", "3"] },
  { id: "7", name: "Soin Kératine", category: "Soin", duration: "1h", price: 85 },
  { id: "8", name: "Soin Hydratant", category: "Soin", duration: "30 min", price: 35 },
];

// Mock coiffeurs du salon
const SALON_COIFFEURS: SalonCoiffeur[] = [
  {
    id: "1",
    name: "Sophie Martin",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    specialties: ["Balayage", "Coloration", "Mèches"],
  },
  {
    id: "2",
    name: "Marie Dupont",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    specialties: ["Coupe", "Brushing"],
  },
  {
    id: "3",
    name: "Julie Bernard",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    specialties: ["Coloration", "Mèches", "Soins"],
  },
];

// Galerie photos du salon
const SALON_GALLERY = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800",
];

// Mock disponibilités
const AVAILABLE_DATES = [
  { day: "Aujourd'hui", date: "15 Jan", slots: 3 },
  { day: "Demain", date: "16 Jan", slots: 5 },
  { day: "Jeu", date: "17 Jan", slots: 2 },
  { day: "Ven", date: "18 Jan", slots: 4 },
  { day: "Sam", date: "19 Jan", slots: 1 },
  { day: "Dim", date: "20 Jan", slots: 0 },
  { day: "Lun", date: "21 Jan", slots: 6 },
];

const AVAILABLE_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

type LocationType = "salon" | "domicile";

export default function SalonModal({ visible, salon, onClose, onSuccess }: SalonModalProps) {
  const insets = useSafeAreaInsets();
  
  // États de réservation
  const [selectedLocation, setSelectedLocation] = useState<LocationType>("salon");
  const [selectedService, setSelectedService] = useState<SalonService | null>(null);
  const [selectedCoiffeur, setSelectedCoiffeur] = useState<SalonCoiffeur | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // États de paiement
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Track scroll position pour le swipe
  const scrollY = useRef(0);
  const isAtTop = useRef(true);
  
  // Animation pour le slide principal
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  // Swipe gesture modal principal - seulement quand en haut du scroll
  const panY = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Seulement activer si on est en haut du scroll ET swipe vers le bas
        return isAtTop.current && gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  // Ouvrir/Fermer modal principal
  useEffect(() => {
    if (visible) {
      resetState();
      panY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const resetState = () => {
    setSelectedLocation("salon");
    setSelectedService(null);
    setSelectedCoiffeur(null);
    setSelectedDate(0);
    setSelectedTime(null);
    setActiveImageIndex(0);
    setIsProcessingPayment(false);
    scrollY.current = 0;
    isAtTop.current = true;
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Handle scroll pour tracker la position
  const handleScroll = (event: any) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    isAtTop.current = scrollY.current <= 5;
  };

  // Gérer le paiement
  const handlePayment = () => {
    if (!selectedService || !selectedTime || isProcessingPayment || !salon) return;
    
    setIsProcessingPayment(true);
    
    setTimeout(() => {
      setIsProcessingPayment(false);
      
      // Calculer le prix total
      const fee = selectedLocation === "domicile" ? (salon.homeServiceFee || 0) : 0;
      const price = selectedService.price + fee;
      
      // Préparer les données de succès
      const dateInfo = AVAILABLE_DATES[selectedDate];
      const recapItems: { icon: string; text: string }[] = [
        { icon: "calendar-outline", text: `${dateInfo.day}, ${dateInfo.date}` },
        { icon: "time-outline", text: selectedTime },
        { icon: selectedLocation === "salon" ? "storefront" : "home", text: selectedLocation === "salon" ? "En salon" : "À domicile" },
      ];
      
      const successData: SuccessData = {
        title: "Réservation confirmée !",
        subtitle: "Votre rendez-vous a été enregistré",
        recapImage: selectedCoiffeur?.image || SALON_COIFFEURS[0].image,
        recapTitle: selectedService.name,
        recapSubtitle: selectedCoiffeur ? `avec ${selectedCoiffeur.name}` : salon.name,
        recapItems,
        priceLabel: "Total payé",
        priceValue: `${price}€`,
        buttonText: "Voir mes réservations",
      };
      
      // Fermer la modale et appeler onSuccess
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
        if (onSuccess) {
          onSuccess(successData);
        }
      });
    }, 1500);
  };

  // Filtrer les coiffeurs disponibles pour un service
  const getAvailableCoiffeursForService = (service: SalonService) => {
    if (!service.availableCoiffeurIds || service.availableCoiffeurIds.length === 0) {
      return SALON_COIFFEURS;
    }
    return SALON_COIFFEURS.filter(c => service.availableCoiffeurIds!.includes(c.id));
  };

  // Vérifier si un coiffeur peut faire le service sélectionné
  const canCoiffeurDoService = (coiffeur: SalonCoiffeur) => {
    if (!selectedService) return true;
    if (!selectedService.availableCoiffeurIds || selectedService.availableCoiffeurIds.length === 0) {
      return true;
    }
    return selectedService.availableCoiffeurIds.includes(coiffeur.id);
  };

  if (!salon) return null;

  // Grouper les services par catégorie
  const servicesByCategory = SALON_SERVICES.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, SalonService[]>);

  // Calculer le prix total
  const homeServiceFee = selectedLocation === "domicile" ? (salon.homeServiceFee || 0) : 0;
  const totalPrice = selectedService ? selectedService.price + homeServiceFee : 0;
  const canBook = selectedService !== null && selectedTime !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              transform: [
                { translateY: slideAnim },
                { translateY: panY },
              ] 
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Indicator */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            bounces={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            {/* Galerie Photos */}
            <View style={styles.galleryContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                  setActiveImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {SALON_GALLERY.map((image, index) => (
                  <Image 
                    key={index}
                    source={{ uri: image }} 
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              
              {/* Indicateurs */}
              <View style={styles.galleryIndicators}>
                {SALON_GALLERY.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.galleryDot,
                      index === activeImageIndex && styles.galleryDotActive
                    ]}
                  />
                ))}
              </View>

              {/* Badge statut */}
              <View style={[
                styles.statusBadgeOverlay,
                !salon.isOpen && styles.statusBadgeClosed
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  !salon.isOpen && styles.statusBadgeTextClosed
                ]}>
                  {salon.isOpen ? "Ouvert" : "Fermé"}
                </Text>
              </View>
            </View>

            {/* Infos Salon */}
            <View style={styles.salonInfo}>
              <Text style={styles.salonName}>{salon.name}</Text>
              
              <View style={styles.salonMeta}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.ratingText}>{salon.rating}</Text>
                  <Text style={styles.reviewsText}>({salon.reviews} avis)</Text>
                </View>
                <Text style={styles.priceRange}>{salon.priceRange}</Text>
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={theme.textMuted} />
                <Text style={styles.addressText}>{salon.address}</Text>
                <Text style={styles.distanceText}>{salon.distance}</Text>
              </View>
            </View>

            {/* Choix du lieu - Onglets cliquables */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lieu du rendez-vous</Text>
              <View style={styles.locationOptions}>
                {/* En salon - toujours disponible */}
                <Pressable
                  style={[
                    styles.locationOption,
                    selectedLocation === "salon" && styles.locationOptionSelected
                  ]}
                  onPress={() => setSelectedLocation("salon")}
                >
                  <Ionicons 
                    name="storefront" 
                    size={20} 
                    color={selectedLocation === "salon" ? "#FFF" : theme.text} 
                  />
                  <Text style={[
                    styles.locationOptionText,
                    selectedLocation === "salon" && styles.locationOptionTextSelected
                  ]}>
                    En salon
                  </Text>
                </Pressable>

                {/* À domicile - si disponible */}
                {salon.offersHomeService ? (
                  <Pressable
                    style={[
                      styles.locationOption,
                      selectedLocation === "domicile" && styles.locationOptionSelected
                    ]}
                    onPress={() => setSelectedLocation("domicile")}
                  >
                    <Ionicons 
                      name="home" 
                      size={20} 
                      color={selectedLocation === "domicile" ? "#FFF" : theme.text} 
                    />
                    <Text style={[
                      styles.locationOptionText,
                      selectedLocation === "domicile" && styles.locationOptionTextSelected
                    ]}>
                      À domicile
                    </Text>
                    <Text style={[
                      styles.locationOptionFee,
                      selectedLocation === "domicile" && styles.locationOptionFeeSelected
                    ]}>
                      +{salon.homeServiceFee}€
                    </Text>
                  </Pressable>
                ) : (
                  <View style={[styles.locationOption, styles.locationOptionDisabled]}>
                    <Ionicons name="home-outline" size={20} color={theme.textMuted} />
                    <Text style={styles.locationOptionTextDisabled}>
                      Non disponible
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choisir un service</Text>
              {Object.entries(servicesByCategory).map(([category, services]) => (
                <View key={category} style={styles.serviceCategory}>
                  <Text style={styles.serviceCategoryTitle}>{category}</Text>
                  {services.map((service) => {
                    const availableCoiffeurs = getAvailableCoiffeursForService(service);
                    const isSelected = selectedService?.id === service.id;
                    
                    return (
                      <Pressable
                        key={service.id}
                        style={[
                          styles.serviceItem,
                          isSelected && styles.serviceItemSelected
                        ]}
                        onPress={() => {
                          setSelectedService(isSelected ? null : service);
                          if (selectedCoiffeur && !availableCoiffeurs.find(c => c.id === selectedCoiffeur.id)) {
                            setSelectedCoiffeur(null);
                          }
                        }}
                      >
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.serviceDuration}>{service.duration}</Text>
                          {availableCoiffeurs.length < SALON_COIFFEURS.length && (
                            <Text style={styles.serviceCoiffeurs}>
                              Avec {availableCoiffeurs.map(c => c.name.split(' ')[0]).join(', ')}
                            </Text>
                          )}
                        </View>
                        <View style={styles.servicePriceContainer}>
                          <Text style={styles.servicePrice}>{service.price}€</Text>
                          {isSelected && (
                            <View style={styles.serviceCheck}>
                              <Ionicons name="checkmark" size={14} color="#FFF" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Choix du coiffeur (optionnel) */}
            {selectedService && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Préférence de coiffeur</Text>
                <Text style={styles.sectionSubtitle}>Optionnel</Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.coiffeursScroll}
                >
                  {/* Option "Sans préférence" */}
                  <Pressable
                    style={[
                      styles.coiffeurChip,
                      selectedCoiffeur === null && styles.coiffeurChipSelected
                    ]}
                    onPress={() => setSelectedCoiffeur(null)}
                  >
                    <View style={styles.coiffeurChipIcon}>
                      <Ionicons 
                        name="people" 
                        size={20} 
                        color={selectedCoiffeur === null ? "#FFF" : theme.text} 
                      />
                    </View>
                    <Text style={[
                      styles.coiffeurChipText,
                      selectedCoiffeur === null && styles.coiffeurChipTextSelected
                    ]}>
                      Sans préférence
                    </Text>
                  </Pressable>

                  {/* Liste des coiffeurs */}
                  {SALON_COIFFEURS.map((coiffeur) => {
                    const canDo = canCoiffeurDoService(coiffeur);
                    const isSelected = selectedCoiffeur?.id === coiffeur.id;
                    
                    return (
                      <Pressable
                        key={coiffeur.id}
                        style={[
                          styles.coiffeurChip,
                          isSelected && styles.coiffeurChipSelected,
                          !canDo && styles.coiffeurChipDisabled
                        ]}
                        onPress={() => canDo && setSelectedCoiffeur(isSelected ? null : coiffeur)}
                        disabled={!canDo}
                      >
                        <Image 
                          source={{ uri: coiffeur.image }} 
                          style={[
                            styles.coiffeurChipImage,
                            !canDo && styles.coiffeurChipImageDisabled
                          ]} 
                        />
                        <Text style={[
                          styles.coiffeurChipText,
                          isSelected && styles.coiffeurChipTextSelected,
                          !canDo && styles.coiffeurChipTextDisabled
                        ]}>
                          {coiffeur.name.split(' ')[0]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Calendrier */}
            {selectedService && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {selectedCoiffeur 
                    ? `Disponibilités de ${selectedCoiffeur.name.split(' ')[0]}`
                    : "Choisir une date"
                  }
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datesScroll}
                >
                  {AVAILABLE_DATES.map((date, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.dateCard,
                        selectedDate === index && styles.dateCardSelected,
                        date.slots === 0 && styles.dateCardDisabled
                      ]}
                      onPress={() => date.slots > 0 && setSelectedDate(index)}
                      disabled={date.slots === 0}
                    >
                      <Text style={[
                        styles.dateDay,
                        selectedDate === index && styles.dateDaySelected,
                        date.slots === 0 && styles.dateDayDisabled
                      ]}>
                        {date.day}
                      </Text>
                      <Text style={[
                        styles.dateNumber,
                        selectedDate === index && styles.dateNumberSelected,
                        date.slots === 0 && styles.dateNumberDisabled
                      ]}>
                        {date.date}
                      </Text>
                      <Text style={[
                        styles.dateSlots,
                        selectedDate === index && styles.dateSlotsSelected,
                        date.slots === 0 && styles.dateSlotsDisabled
                      ]}>
                        {date.slots > 0 ? `${date.slots} dispo${date.slots > 1 ? 's' : ''}` : 'Complet'}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Créneaux horaires */}
            {selectedService && AVAILABLE_DATES[selectedDate]?.slots > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choisir un horaire</Text>
                <View style={styles.timesGrid}>
                  {AVAILABLE_TIMES.map((time) => (
                    <Pressable
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotSelected
                      ]}
                      onPress={() => setSelectedTime(selectedTime === time ? null : time)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === time && styles.timeSlotTextSelected
                      ]}>
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Récapitulatif */}
            {selectedService && selectedTime && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Récapitulatif</Text>
                <View style={styles.recap}>
                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Service</Text>
                    <Text style={styles.recapValue}>{selectedService.name}</Text>
                  </View>
                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Lieu</Text>
                    <Text style={styles.recapValue}>
                      {selectedLocation === "salon" ? salon.name : "À votre domicile"}
                    </Text>
                  </View>
                  {selectedCoiffeur && (
                    <View style={styles.recapRow}>
                      <Text style={styles.recapLabel}>Coiffeur</Text>
                      <Text style={styles.recapValue}>{selectedCoiffeur.name}</Text>
                    </View>
                  )}
                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Date</Text>
                    <Text style={styles.recapValue}>
                      {AVAILABLE_DATES[selectedDate].day}, {AVAILABLE_DATES[selectedDate].date}
                    </Text>
                  </View>
                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Heure</Text>
                    <Text style={styles.recapValue}>{selectedTime}</Text>
                  </View>
                  <View style={styles.recapDivider} />
                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>{selectedService.name}</Text>
                    <Text style={styles.recapValue}>{selectedService.price}€</Text>
                  </View>
                  {homeServiceFee > 0 && (
                    <View style={styles.recapRow}>
                      <Text style={styles.recapLabel}>Frais de déplacement</Text>
                      <Text style={styles.recapValue}>{homeServiceFee}€</Text>
                    </View>
                  )}
                  <View style={styles.recapRowTotal}>
                    <Text style={styles.recapTotalLabel}>Total</Text>
                    <Text style={styles.recapTotalValue}>{totalPrice}€</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer CTA - Sans bordure */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            {selectedService ? (
              <>
                <View style={styles.footerInfo}>
                  <Text style={styles.footerLabel}>Total</Text>
                  <Text style={styles.footerPrice}>{totalPrice}€</Text>
                </View>
                <Pressable 
                  style={[
                    styles.bookButton,
                    !canBook && styles.bookButtonDisabled,
                    isProcessingPayment && styles.bookButtonProcessing
                  ]}
                  onPress={handlePayment}
                  disabled={!canBook || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.bookButtonText}>
                        {canBook ? "Confirmer et payer" : "Choisir un horaire"}
                      </Text>
                      {canBook && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={styles.footerHint}>
                <Text style={styles.footerHintText}>
                  Sélectionnez un service pour réserver
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.95,
    height: height * 0.95,
    overflow: "hidden",
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  
  // Gallery
  galleryContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  galleryImage: {
    width: width - 32,
    height: 180,
  },
  galleryIndicators: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  galleryDotActive: {
    backgroundColor: "#FFF",
    width: 18,
  },
  statusBadgeOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: theme.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeClosed: {
    backgroundColor: theme.errorLight,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.success,
  },
  statusBadgeTextClosed: {
    color: theme.error,
  },
  
  // Salon Info
  salonInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  salonName: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 8,
  },
  salonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  reviewsText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  priceRange: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.textSecondary,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
  },
  distanceText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: -8,
    marginBottom: 12,
  },
  
  // Location Options
  locationOptions: {
    flexDirection: "row",
    gap: 12,
  },
  locationOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  locationOptionSelected: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  locationOptionDisabled: {
    opacity: 0.5,
  },
  locationOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  locationOptionTextSelected: {
    color: "#FFF",
  },
  locationOptionTextDisabled: {
    color: theme.textMuted,
  },
  locationOptionFee: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.textMuted,
  },
  locationOptionFeeSelected: {
    color: "rgba(255,255,255,0.7)",
  },
  
  // Services
  serviceCategory: {
    marginBottom: 20,
  },
  serviceCategoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  serviceItemSelected: {
    borderColor: theme.text,
    backgroundColor: theme.background,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    color: theme.textMuted,
  },
  serviceCoiffeurs: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  servicePriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.text,
  },
  serviceCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.text,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Coiffeurs
  coiffeursScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  coiffeurChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  coiffeurChipSelected: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  coiffeurChipDisabled: {
    opacity: 0.4,
  },
  coiffeurChipImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  coiffeurChipImageDisabled: {
    opacity: 0.5,
  },
  coiffeurChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  coiffeurChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  coiffeurChipTextSelected: {
    color: "#FFF",
  },
  coiffeurChipTextDisabled: {
    color: theme.textMuted,
  },
  
  // Dates
  datesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 10,
    minWidth: 80,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dateCardSelected: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  dateCardDisabled: {
    opacity: 0.4,
  },
  dateDay: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: "rgba(255,255,255,0.7)",
  },
  dateDayDisabled: {
    color: theme.textMuted,
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 4,
  },
  dateNumberSelected: {
    color: "#FFF",
  },
  dateNumberDisabled: {
    color: theme.textMuted,
  },
  dateSlots: {
    fontSize: 11,
    color: theme.success,
    fontWeight: "500",
  },
  dateSlotsSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  dateSlotsDisabled: {
    color: theme.error,
  },
  
  // Times
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: "transparent",
  },
  timeSlotSelected: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  timeSlotTextSelected: {
    color: "#FFF",
  },
  
  // Recap
  recap: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
  },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  recapLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  recapValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  recapDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  recapRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  recapTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  recapTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
  },
  
  // Footer - Sans bordure
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 2,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.text,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  bookButtonDisabled: {
    backgroundColor: theme.textMuted,
  },
  bookButtonProcessing: {
    backgroundColor: theme.textSecondary,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  footerHint: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  footerHintText: {
    fontSize: 14,
    color: theme.textMuted,
  },
});