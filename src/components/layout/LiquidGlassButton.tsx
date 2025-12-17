// components/LiquidGlassButton.tsx
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface LiquidGlassButtonProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

export default function LiquidGlassButton({ 
  label, 
  isActive = false, 
  onPress,
}: LiquidGlassButtonProps) {

  const getGradientColors = (): string[] => {
    if (isActive) {
      return ["rgba(99,102,241,0.85)", "rgba(139,92,246,0.85)"];
    }
    return ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"];
  };

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <View style={styles.buttonWrapper}>
        <BlurView 
          intensity={Platform.OS === "ios" ? 15 : 30} 
          tint="dark" 
          style={styles.blur}
        />
        
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        
        {isActive && (
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            style={styles.topReflect}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
        
        <View style={[
          styles.border, 
          { borderColor: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)" }
        ]} />
        
        <Text style={[
          styles.label, 
          { 
            color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)",
            fontWeight: isActive ? "600" : "500",
          }
        ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexShrink: 0,
  },
  buttonWrapper: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topReflect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});