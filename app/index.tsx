// app/index.tsx
import { Redirect } from "expo-router";
import { ROUTES } from "@/constants/routes";

export default function Index() {
  // Bypass auth pour le développement
  return <Redirect href={ROUTES.CLIENT.HOME} />;
}