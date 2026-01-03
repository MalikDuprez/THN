// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import StripeProvider from "@/providers/StripeProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StripeProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </StripeProvider>
    </SafeAreaProvider>
  );
}