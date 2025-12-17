// components/InspirationCard.tsx
import { View, Text, Image, Pressable, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, useEffect } from "react";

const { width } = Dimensions.get("window");

interface InspirationCardProps {
  item: {
    id: string;
    title: string;
    image: string;
    category: string;
    duration: string;
    price: number;
    height?: number;
  };
  onPress: () => void;
}

export default function InspirationCard({ item, onPress }: InspirationCardProps) {
  const [showPrice, setShowPrice] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const heights = [200, 240, 280, 220, 260];
  const cardHeight = item.height || heights[parseInt(item.id) % heights.length];

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, []);

  const showOverlay = () => {
    // Annuler tout timeout précédent
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    
    setShowPrice(true);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const scheduleHide = () => {
    // Attendre 800ms avant de commencer le fade out
    hideTimeout.current = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowPrice(false);
      });
    }, 800);
  };

  const handlePressIn = () => {
    showOverlay();
  };

  const handlePressOut = () => {
    scheduleHide();
  };

  const handlePress = () => {
    // Annuler le fade out si on tap
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    onPress();
  };

  return (
    <Pressable 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={{ 
        width: "100%", 
        marginBottom: 12,
        borderRadius: 16, 
        overflow: "hidden",
      }}
    >
      <View style={{ position: "relative" }}>
        <Image 
          source={{ uri: item.image }} 
          style={{ 
            width: "100%", 
            height: cardHeight,
            borderRadius: 16,
          }} 
          resizeMode="cover" 
        />
        
        {/* Overlay avec prix - animation fluide avec délai */}
        {showPrice && (
          <Animated.View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            opacity: overlayOpacity,
          }}>
            <View style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}>
              <Text style={{ color: "#000", fontWeight: "700", fontSize: 15 }}>
                À partir de {item.price}€
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Titre en bas - toujours visible */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 10,
          paddingBottom: 10,
          paddingTop: 25,
        }}>
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            overflow: "hidden",
          }}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} />
          </View>
          <Text style={{ 
            color: "white", 
            fontWeight: "600", 
            fontSize: 13,
            zIndex: 1,
          }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ 
            color: "rgba(255,255,255,0.65)", 
            fontSize: 10,
            marginTop: 2,
            zIndex: 1,
          }}>
            {item.category} • {item.duration}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}