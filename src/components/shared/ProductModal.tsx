// components/shared/ProductModal.tsx
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

interface Product {
  id: string;
  name: string;
  brand: string;
  seller: string;
  sellerId: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  offersDelivery: boolean;
  deliveryFee?: number;
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

interface ProductModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, deliveryOption: string) => void;
  onSuccess?: (data: SuccessData) => void;
}

type DeliveryOption = "relay" | "home";

// Mock détails produit
const PRODUCT_DETAILS = {
  description: "Ce soin professionnel nourrit intensément les cheveux abîmés et leur redonne brillance et souplesse. Formulé avec des ingrédients de haute qualité, il pénètre en profondeur pour réparer la fibre capillaire.",
  ingredients: "Aqua, Cetearyl Alcohol, Behentrimonium Chloride, Parfum, Argania Spinosa Kernel Oil, Hydrolyzed Keratin...",
  usage: "Appliquer sur cheveux lavés et essorés. Laisser poser 5 à 10 minutes. Rincer abondamment.",
  volume: "250 ml",
};

// Mock avis produit
const PRODUCT_REVIEWS = [
  {
    id: "1",
    user: "Marie L.",
    rating: 5,
    date: "Il y a 2 jours",
    comment: "Produit incroyable ! Mes cheveux sont transformés après seulement 2 utilisations.",
  },
  {
    id: "2", 
    user: "Sophie D.",
    rating: 4,
    date: "Il y a 1 semaine",
    comment: "Très bon produit, l'odeur est agréable. Un peu cher mais efficace.",
  },
  {
    id: "3",
    user: "Julie M.",
    rating: 5,
    date: "Il y a 2 semaines",
    comment: "Je recommande à 100% ! Livraison rapide en plus.",
  },
];

export default function ProductModal({ visible, product, onClose, onAddToCart, onSuccess }: ProductModalProps) {
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>("relay");
  const [activeTab, setActiveTab] = useState<"description" | "avis">("description");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Track scroll position pour le swipe
  const scrollY = useRef(0);
  const isAtTop = useRef(true);
  
  // Animation pour le slide
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  // Swipe gesture - seulement quand en haut du scroll
  const panY = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
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

  // Reset state quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSelectedDelivery("relay");
      setActiveTab("description");
      setAddedToCart(false);
      setShowCheckout(false);
      setIsAddingToCart(false);
      setIsProcessingPayment(false);
      scrollY.current = 0;
      isAtTop.current = true;
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

  const handleAddToCart = () => {
    if (!product || isAddingToCart || addedToCart) return;
    
    setIsAddingToCart(true);
    
    setTimeout(() => {
      onAddToCart(product, quantity, selectedDelivery);
      setIsAddingToCart(false);
      setAddedToCart(true);
      
      // Reset après 2 secondes pour permettre d'ajouter à nouveau
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    }, 600);
  };

  const handleBuyNow = () => {
    if (!product) return;
    setShowCheckout(true);
  };

  const handleProcessPayment = () => {
    if (!product || isProcessingPayment) return;
    
    setIsProcessingPayment(true);
    
    setTimeout(() => {
      onAddToCart(product, quantity, selectedDelivery);
      setIsProcessingPayment(false);
      setShowCheckout(false);
      
      // Calculer le prix total
      const fee = selectedDelivery === "home" && product.offersDelivery 
        ? product.deliveryFee || 4.90 
        : selectedDelivery === "relay" ? 2.90 : 0;
      const total = (product.price * quantity) + fee;
      
      // Préparer les données de succès
      const successData: SuccessData = {
        title: "Commande confirmée !",
        subtitle: "Votre commande a été enregistrée",
        recapImage: product.image,
        recapTitle: product.name,
        recapSubtitle: `${product.brand} • Qté: ${quantity}`,
        recapItems: [
          { 
            icon: selectedDelivery === "home" ? "home-outline" : "location-outline", 
            text: selectedDelivery === "home" ? "Livraison à domicile" : "Point relais" 
          },
        ],
        priceLabel: "Total payé",
        priceValue: `${total.toFixed(2)}€`,
        buttonText: "Parfait !",
      };
      
      // Fermer et appeler onSuccess
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
    }, 1200);
  };

  const incrementQuantity = () => {
    if (quantity < 10) setQuantity(q => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  if (!product) return null;

  const deliveryFee = selectedDelivery === "home" && product.offersDelivery 
    ? product.deliveryFee || 4.90 
    : selectedDelivery === "relay" ? 2.90 : 0;
  
  const totalPrice = (product.price * quantity) + deliveryFee;

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
        <Animated.View 
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
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
            {/* Image Produit */}
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: product.image }} 
                style={styles.productImage}
                resizeMode="cover"
              />
              
              {/* Badge promo */}
              {product.originalPrice && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoText}>
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Infos Produit */}
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              
              <View style={styles.productMeta}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.ratingText}>{product.rating}</Text>
                  <Text style={styles.reviewsText}>({product.reviews} avis)</Text>
                </View>
                <Text style={styles.volumeText}>{PRODUCT_DETAILS.volume}</Text>
              </View>

              {/* Prix */}
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{product.price}€</Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>{product.originalPrice}€</Text>
                )}
              </View>

              {/* Vendeur */}
              <Pressable style={styles.sellerRow}>
                <Ionicons name="storefront-outline" size={16} color={theme.textMuted} />
                <Text style={styles.sellerText}>Vendu par </Text>
                <Text style={styles.sellerName}>{product.seller}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Quantité */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantité</Text>
              <View style={styles.quantityContainer}>
                <Pressable 
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={20} color={quantity <= 1 ? theme.textMuted : theme.text} />
                </Pressable>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Pressable 
                  style={[styles.quantityButton, quantity >= 10 && styles.quantityButtonDisabled]}
                  onPress={incrementQuantity}
                  disabled={quantity >= 10}
                >
                  <Ionicons name="add" size={20} color={quantity >= 10 ? theme.textMuted : theme.text} />
                </Pressable>
              </View>
            </View>

            {/* Options de livraison */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Livraison</Text>
              
              {/* Point Relais */}
              <Pressable
                style={[
                  styles.deliveryOption,
                  selectedDelivery === "relay" && styles.deliveryOptionSelected
                ]}
                onPress={() => setSelectedDelivery("relay")}
              >
                <View style={styles.deliveryOptionLeft}>
                  <View style={[
                    styles.deliveryRadio,
                    selectedDelivery === "relay" && styles.deliveryRadioSelected
                  ]}>
                    {selectedDelivery === "relay" && (
                      <View style={styles.deliveryRadioDot} />
                    )}
                  </View>
                  <View style={styles.deliveryIconContainer}>
                    <Ionicons name="location" size={18} color={theme.text} />
                  </View>
                  <View>
                    <Text style={styles.deliveryTitle}>Point relais</Text>
                    <Text style={styles.deliverySubtitle}>Livré en 3-5 jours</Text>
                  </View>
                </View>
                <Text style={styles.deliveryPrice}>+2.90€</Text>
              </Pressable>

              {/* Livraison domicile */}
              {product.offersDelivery ? (
                <Pressable
                  style={[
                    styles.deliveryOption,
                    selectedDelivery === "home" && styles.deliveryOptionSelected
                  ]}
                  onPress={() => setSelectedDelivery("home")}
                >
                  <View style={styles.deliveryOptionLeft}>
                    <View style={[
                      styles.deliveryRadio,
                      selectedDelivery === "home" && styles.deliveryRadioSelected
                    ]}>
                      {selectedDelivery === "home" && (
                        <View style={styles.deliveryRadioDot} />
                      )}
                    </View>
                    <View style={styles.deliveryIconContainer}>
                      <Ionicons name="home" size={18} color={theme.text} />
                    </View>
                    <View>
                      <Text style={styles.deliveryTitle}>À domicile</Text>
                      <Text style={styles.deliverySubtitle}>Livré en 2-3 jours</Text>
                    </View>
                  </View>
                  <Text style={styles.deliveryPrice}>+{product.deliveryFee?.toFixed(2) || "4.90"}€</Text>
                </Pressable>
              ) : (
                <View style={styles.deliveryUnavailable}>
                  <Ionicons name="home-outline" size={18} color={theme.textMuted} />
                  <Text style={styles.deliveryUnavailableText}>
                    Livraison domicile non disponible pour ce produit
                  </Text>
                </View>
              )}
            </View>

            {/* Tabs Description / Avis */}
            <View style={styles.tabsContainer}>
              <Pressable
                onPress={() => setActiveTab("description")}
                style={[styles.tab, activeTab === "description" && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === "description" && styles.tabTextActive]}>
                  Description
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("avis")}
                style={[styles.tab, activeTab === "avis" && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === "avis" && styles.tabTextActive]}>
                  Avis ({product.reviews})
                </Text>
              </Pressable>
            </View>

            {/* Contenu tabs */}
            <View style={styles.tabContent}>
              {activeTab === "description" && (
                <View>
                  <Text style={styles.descriptionText}>{PRODUCT_DETAILS.description}</Text>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Utilisation</Text>
                    <Text style={styles.detailText}>{PRODUCT_DETAILS.usage}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Ingrédients</Text>
                    <Text style={styles.detailText}>{PRODUCT_DETAILS.ingredients}</Text>
                  </View>
                </View>
              )}

              {activeTab === "avis" && (
                <View style={styles.reviewsList}>
                  {PRODUCT_REVIEWS.map((review) => (
                    <View key={review.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewUser}>{review.user}</Text>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= review.rating ? "star" : "star-outline"}
                              size={12}
                              color="#FFB800"
                            />
                          ))}
                        </View>
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer avec 2 boutons */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.footerPricing}>
              <Text style={styles.footerLabel}>Total</Text>
              <Text style={styles.footerPrice}>{totalPrice.toFixed(2)}€</Text>
            </View>
            <View style={styles.footerButtons}>
              <Pressable 
                style={[
                  styles.addButton, 
                  isAddingToCart && styles.buttonDisabled,
                  addedToCart && styles.addButtonSuccess
                ]}
                onPress={handleAddToCart}
                disabled={isAddingToCart || addedToCart}
              >
                {isAddingToCart ? (
                  <ActivityIndicator color={theme.text} size="small" />
                ) : addedToCart ? (
                  <>
                    <Ionicons name="checkmark" size={18} color={theme.success} />
                    <Text style={styles.addButtonTextSuccess}>Ajouté</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={18} color={theme.text} />
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </>
                )}
              </Pressable>
              <Pressable 
                style={styles.buyButton}
                onPress={handleBuyNow}
              >
                <Text style={styles.buyButtonText}>Acheter</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Checkout Modal */}
        {showCheckout && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable 
              style={styles.checkoutBackdrop} 
              onPress={() => setShowCheckout(false)} 
            />
            <View style={[styles.checkoutModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.checkoutDragIndicator} />
              
              <Text style={styles.checkoutTitle}>Finaliser l'achat</Text>
              
              {/* Récap produit */}
              <View style={styles.checkoutProduct}>
                <Image source={{ uri: product.image }} style={styles.checkoutProductImage} />
                <View style={styles.checkoutProductInfo}>
                  <Text style={styles.checkoutProductBrand}>{product.brand}</Text>
                  <Text style={styles.checkoutProductName}>{product.name}</Text>
                  <Text style={styles.checkoutProductQty}>Quantité: {quantity}</Text>
                </View>
                <Text style={styles.checkoutProductPrice}>{product.price}€</Text>
              </View>

              {/* Livraison */}
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>Livraison</Text>
                <View style={styles.checkoutDelivery}>
                  <Ionicons 
                    name={selectedDelivery === "home" ? "home" : "location"} 
                    size={18} 
                    color={theme.textSecondary} 
                  />
                  <Text style={styles.checkoutDeliveryText}>
                    {selectedDelivery === "home" ? "À domicile" : "Point relais"}
                  </Text>
                  <Text style={styles.checkoutDeliveryPrice}>+{deliveryFee.toFixed(2)}€</Text>
                </View>
              </View>

              {/* Total */}
              <View style={styles.checkoutTotal}>
                <Text style={styles.checkoutTotalLabel}>Total à payer</Text>
                <Text style={styles.checkoutTotalPrice}>{totalPrice.toFixed(2)}€</Text>
              </View>

              {/* Bouton payer */}
              <Pressable 
                style={[styles.checkoutPayButton, isProcessingPayment && styles.buttonDisabled]}
                onPress={handleProcessPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="card" size={20} color="#FFF" />
                    <Text style={styles.checkoutPayButtonText}>Payer {totalPrice.toFixed(2)}€</Text>
                  </>
                )}
              </Pressable>

              <Pressable 
                style={styles.checkoutCancelButton}
                onPress={() => setShowCheckout(false)}
              >
                <Text style={styles.checkoutCancelButtonText}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        )}
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
  
  // Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  successContent: {
    alignItems: "center",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  
  // Image
  imageContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: theme.card,
  },
  productImage: {
    width: "100%",
    height: 320,
  },
  promoBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: theme.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFF",
  },
  
  // Product Info
  productInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  productBrand: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 12,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  volumeText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.text,
  },
  originalPrice: {
    fontSize: 18,
    color: theme.textMuted,
    textDecorationLine: "line-through",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 12,
  },
  sellerText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  sellerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  
  // Quantity
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.background,
  },
  quantityButtonDisabled: {
    backgroundColor: "transparent",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    minWidth: 40,
    textAlign: "center",
  },
  
  // Delivery Options
  deliveryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  deliveryOptionSelected: {
    borderColor: theme.text,
    backgroundColor: theme.background,
  },
  deliveryOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deliveryRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryRadioSelected: {
    borderColor: theme.text,
  },
  deliveryRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.text,
  },
  deliveryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  deliverySubtitle: {
    fontSize: 13,
    color: theme.textMuted,
  },
  deliveryPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  deliveryUnavailable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.card,
    padding: 14,
    borderRadius: 12,
    opacity: 0.6,
  },
  deliveryUnavailableText: {
    flex: 1,
    fontSize: 13,
    color: theme.textMuted,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.card,
  },
  tabActive: {
    backgroundColor: theme.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.textMuted,
  },
  tabTextActive: {
    color: "#FFF",
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  
  // Description
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
  },
  
  // Reviews
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: theme.card,
    padding: 14,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginLeft: "auto",
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
  },
  
  // Footer - Sans bordure, 2 boutons
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
  },
  footerPricing: {
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
  footerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.text,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.text,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonSuccess: {
    backgroundColor: theme.successLight,
    borderColor: theme.success,
  },
  addButtonTextSuccess: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.success,
  },
  
  // Checkout Modal
  checkoutBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  checkoutModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  checkoutDragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  checkoutTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 20,
  },
  checkoutProduct: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
  },
  checkoutProductImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  checkoutProductInfo: {
    flex: 1,
  },
  checkoutProductBrand: {
    fontSize: 11,
    color: theme.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  checkoutProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 2,
  },
  checkoutProductQty: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  checkoutProductPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.text,
  },
  checkoutSection: {
    marginBottom: 20,
  },
  checkoutSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textMuted,
    marginBottom: 8,
  },
  checkoutDelivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.card,
    padding: 14,
    borderRadius: 12,
  },
  checkoutDeliveryText: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  checkoutDeliveryPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  checkoutTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 16,
  },
  checkoutTotalLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  checkoutTotalPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.text,
  },
  checkoutPayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.text,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  checkoutPayButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  checkoutCancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  checkoutCancelButtonText: {
    fontSize: 15,
    color: theme.textMuted,
  },
});