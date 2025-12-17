// components/shared/SuccessModal.tsx
// Modal de succès uniforme pour toute l'application (même design que Inspiration)
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  Animated,
  Pressable,
  PanResponder,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F5F5F5",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  success: "#2E7D32",
};

// Types pour les différents récaps
interface RecapItem {
  icon: string;
  text: string;
}

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  
  // Contenu principal
  title?: string;
  subtitle?: string;
  
  // Récap optionnel (pour réservations/achats)
  recapImage?: string;
  recapTitle?: string;
  recapSubtitle?: string;
  recapItems?: RecapItem[];
  
  // Prix optionnel
  priceLabel?: string;
  priceValue?: string;
  
  // Bouton
  buttonText?: string;
  onButtonPress?: () => void;
}

export default function SuccessModal({ 
  visible, 
  onClose,
  title = "Commande confirmée !",
  subtitle = "Votre commande a été enregistrée",
  recapImage,
  recapTitle,
  recapSubtitle,
  recapItems,
  priceLabel,
  priceValue,
  buttonText = "Parfait !",
  onButtonPress,
}: SuccessModalProps) {
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.3) {
          closeModal();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      backdropAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
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

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    }
    closeModal();
  };

  const hasRecap = recapImage || recapTitle || recapItems;
  const hasPrice = priceLabel && priceValue;

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

        {/* Card */}
        <Animated.View 
          style={[
            styles.card,
            { 
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + 24,
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Indicator */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <Ionicons name="checkmark" size={40} color="#FFF" />
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Récap Card (optionnel) */}
            {hasRecap && (
              <View style={styles.recapCard}>
                {recapImage && (
                  <Image source={{ uri: recapImage }} style={styles.recapImage} />
                )}
                <View style={[styles.recapInfo, !recapImage && { marginLeft: 0 }]}>
                  {recapTitle && (
                    <Text style={styles.recapTitle}>{recapTitle}</Text>
                  )}
                  {recapSubtitle && (
                    <Text style={styles.recapSubtitle}>{recapSubtitle}</Text>
                  )}
                  {recapItems && recapItems.length > 0 && (
                    <View style={styles.recapMeta}>
                      {recapItems.map((item, index) => (
                        <View key={index} style={styles.recapMetaItem}>
                          <Ionicons 
                            name={item.icon as any} 
                            size={14} 
                            color={theme.textMuted} 
                          />
                          <Text style={styles.recapMetaText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Prix (optionnel) */}
            {hasPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{priceLabel}</Text>
                <Text style={styles.priceValue}>{priceValue}</Text>
              </View>
            )}

            {/* Button */}
            <Pressable style={styles.button} onPress={handleButtonPress}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </Pressable>

            <Text style={styles.swipeHint}>Glissez vers le bas pour fermer</Text>
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
  card: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.45,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.success,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  
  // Récap
  recapCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  recapImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  recapInfo: {
    flex: 1,
    marginLeft: 14,
  },
  recapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  recapSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  recapMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 16,
  },
  recapMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recapMetaText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  
  // Prix
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
  },
  
  // Button
  button: {
    backgroundColor: theme.text,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  swipeHint: {
    fontSize: 12,
    color: theme.textMuted,
  },
});