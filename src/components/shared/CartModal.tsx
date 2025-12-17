// components/shared/CartModal.tsx
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
import { useRef, useEffect, useState } from "react";

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
};

interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  deliveryOption: string;
  deliveryFee: number;
}

interface CartModalProps {
  visible: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function CartModal({ 
  visible, 
  items, 
  onClose, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout 
}: CartModalProps) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const panY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(0);
  const isAtTop = useRef(true);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Permettre le swipe seulement si on est en haut du scroll
        return isAtTop.current && gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Fermer plus facilement - seuil réduit
        if (gestureState.dy > 60 || gestureState.vy > 0.3) {
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

  const handleScroll = (event: any) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    isAtTop.current = scrollY.current <= 5;
  };

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      setIsProcessing(false);
      scrollY.current = 0;
      isAtTop.current = true;
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

  const handleCheckout = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      // Fermer la modale d'abord, puis le parent gère le success
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
        onCheckout();
      });
    }, 1200);
  };

  // Calculs
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryTotal = items.reduce((sum, item) => sum + item.deliveryFee, 0);
  const total = subtotal + deliveryTotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
        </Animated.View>

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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mon panier</Text>
            <Text style={styles.headerCount}>{itemCount} article{itemCount > 1 ? 's' : ''}</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>Votre panier est vide</Text>
              <Text style={styles.emptySubtitle}>
                Ajoutez des produits pour commencer
              </Text>
              <Pressable style={styles.emptyButton} onPress={closeModal}>
                <Text style={styles.emptyButtonText}>Continuer mes achats</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {/* Items */}
                {items.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemBrand}>{item.brand}</Text>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <View style={styles.itemDelivery}>
                        <Ionicons 
                          name={item.deliveryOption === "home" ? "home" : "location"} 
                          size={12} 
                          color={theme.textMuted} 
                        />
                        <Text style={styles.itemDeliveryText}>
                          {item.deliveryOption === "home" ? "Domicile" : "Point relais"}
                        </Text>
                      </View>
                      
                      {/* Quantité */}
                      <View style={styles.quantityRow}>
                        <View style={styles.quantityControls}>
                          <Pressable 
                            style={styles.quantityBtn}
                            onPress={() => {
                              if (item.quantity > 1) {
                                onUpdateQuantity(item.id, item.quantity - 1);
                              } else {
                                onRemoveItem(item.id);
                              }
                            }}
                          >
                            <Ionicons 
                              name={item.quantity === 1 ? "trash-outline" : "remove"} 
                              size={16} 
                              color={item.quantity === 1 ? theme.error : theme.text} 
                            />
                          </Pressable>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <Pressable 
                            style={styles.quantityBtn}
                            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Ionicons name="add" size={16} color={theme.text} />
                          </Pressable>
                        </View>
                        <Text style={styles.itemPrice}>
                          {(item.price * item.quantity).toFixed(2)}€
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Récap */}
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sous-total</Text>
                    <Text style={styles.summaryValue}>{subtotal.toFixed(2)}€</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Livraison</Text>
                    <Text style={styles.summaryValue}>{deliveryTotal.toFixed(2)}€</Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Footer */}
              <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.footerTotal}>
                  <Text style={styles.footerLabel}>Total</Text>
                  <Text style={styles.footerPrice}>{total.toFixed(2)}€</Text>
                </View>
                <Pressable 
                  style={[styles.checkoutButton, isProcessing && styles.buttonDisabled]}
                  onPress={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="card" size={20} color="#FFF" />
                      <Text style={styles.checkoutButtonText}>Passer au paiement</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
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
    maxHeight: height * 0.92,
    height: height * 0.75,
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
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
  },
  headerCount: {
    fontSize: 14,
    color: theme.textMuted,
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.text,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Cart Item
  cartItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: theme.card,
  },
  itemInfo: {
    flex: 1,
  },
  itemBrand: {
    fontSize: 11,
    color: theme.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 4,
  },
  itemDelivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  itemDeliveryText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 2,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.background,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
    minWidth: 30,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.text,
  },
  
  // Summary
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
  },
  footerTotal: {
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
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.text,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});