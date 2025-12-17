// app/(app)/(pro)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createContext, useContext, useState } from "react";

// ============================================
// CONTEXT
// ============================================
interface ScrollContextType {
  isScrolling: boolean;
  setIsScrolling: (value: boolean) => void;
}

export const ScrollContext = createContext<ScrollContextType>({
  isScrolling: false,
  setIsScrolling: () => {},
});

export const useScrollContext = () => useContext(ScrollContext);

// ============================================
// THEME
// ============================================
const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textMuted: "#999999",
};

// ============================================
// TAB CONFIG
// ============================================
const TAB_CONFIG = [
  { name: "dashboard", label: "Dashboard", icon: "grid-outline", iconActive: "grid" },
  { name: "agenda", label: "Agenda", icon: "calendar-outline", iconActive: "calendar" },
  { name: "vitrine", label: "Vitrine", icon: "storefront-outline", iconActive: "storefront" },
  { name: "profile-pro", label: "Profil", icon: "person-outline", iconActive: "person" },
];

// ============================================
// TAB BAR
// ============================================
function ProTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { bottom: insets.bottom + 12 }]}>
      <BlurView intensity={80} tint="light" style={styles.blurView}>
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const tabConfig = TAB_CONFIG.find(t => t.name === route.name);
            if (!tabConfig) return null;

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
              <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
                <Ionicons
                  name={(isFocused ? tabConfig.iconActive : tabConfig.icon) as any}
                  size={24}
                  color={isFocused ? theme.text : theme.textMuted}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? theme.text : theme.textMuted }
                ]}>
                  {tabConfig.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

// ============================================
// LAYOUT
// ============================================
export default function ProTabsLayout() {
  const [isScrolling, setIsScrolling] = useState(false);

  return (
    <ScrollContext.Provider value={{ isScrolling, setIsScrolling }}>
      <Tabs
        tabBar={(props) => <ProTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="agenda" />
        <Tabs.Screen name="vitrine" />
        <Tabs.Screen name="profile-pro" />
      </Tabs>
    </ScrollContext.Provider>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  blurView: {
    flex: 1,
    borderRadius: 32,
    overflow: "hidden",
  },
  tabBarInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
});