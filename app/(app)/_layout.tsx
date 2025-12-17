// app/(app)/_layout.tsx
import { Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { Redirect } from "expo-router";
import { ROUTES } from "@/constants/routes";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href={ROUTES.AUTH.WELCOME} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="(shared)/coiffeur/[id]" 
        options={{ presentation: "card" }} 
      />
      <Stack.Screen 
        name="(shared)/inspiration/[id]" 
        options={{ presentation: "card" }} 
      />
      <Stack.Screen 
        name="(shared)/notifications" 
        options={{ presentation: "card" }} 
      />
      <Stack.Screen 
        name="(shared)/settings" 
        options={{ presentation: "card" }} 
      />
      <Stack.Screen name="(client)/booking" />
      <Stack.Screen name="(pro)" />
    </Stack>
  );
}