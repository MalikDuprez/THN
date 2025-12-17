// components/LiquidGlassTabBar.tsx
import { View, Pressable, Text, StyleSheet, Animated, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";

interface TabItem {
  name: string;
  label: string;
  icon: string;
  iconFocused: string;
}

interface LiquidGlassTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  isScrolling?: boolean;
}

const TABS: TabItem[] = [
  { name: "index", label: "Accueil", icon: "home-outline", iconFocused: "home" },
  { name: "salon", label: "Boutique", icon: "storefront-outline", iconFocused: "storefront" },
  { name: "activity", label: "Activité", icon: "pulse-outline", iconFocused: "pulse" },
  { name: "profile", label: "Profil", icon: "person-outline", iconFocused: "person" },
];

export default function LiquidGlassTabBar({ state, descriptors, navigation, isScrolling = false }: LiquidGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  
  const labelAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isScrolling ? 0 : 1,
      duration: isScrolling ? 150 : 250,
      useNativeDriver: false,
    }).start();
  }, [isScrolling]);

  const labelOpacity = labelAnim;
  const labelHeight = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 16;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.floatingBar}>
        {/* Blur layer */}
        <BlurView
          intensity={Platform.OS === "ios" ? 80 : 95}
          tint="systemChromeMaterialLight"
          style={StyleSheet.absoluteFill}
        />
        
        {/* Fog overlay */}
        <View style={styles.fogOverlay} />
        
        {/* Bordure subtile */}
        <View style={styles.border} />

        {/* Tab buttons */}
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const tab = TABS.find(t => t.name === route.name) || TABS[0];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Ionicons
                  name={(isFocused ? tab.iconFocused : tab.icon) as any}
                  size={24}
                  color={isFocused ? "#000000" : "#8E8E93"}
                />
                
                <Animated.Text 
                  style={[
                    styles.tabLabel,
                    { 
                      opacity: labelOpacity,
                      height: labelHeight,
                      color: isFocused ? "#000000" : "#8E8E93",
                      fontWeight: isFocused ? "600" : "400",
                    }
                  ]} 
                  numberOfLines={1}
                >
                  {tab.label}
                </Animated.Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  floatingBar: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 32,
    overflow: "hidden",
    // Ombre douce
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.2,
  },
});