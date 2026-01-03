// src/providers/StripeProvider.tsx
import { StripeProvider as StripeProviderNative } from "@stripe/stripe-react-native";
import { ReactNode } from "react";

// ⚠️ REMPLACE PAR TA CLÉ PUBLISHABLE
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SlRrNJgVRJQORHMr4RxpYiwy1IiiZ7wdX4KDJbYTAY4V8ghZvDIOY3szml9twLNTNTvkGlBrgLL2Cm0FHVjQxA300VnDaYHup";

interface Props {
  children: ReactNode;
}

export default function StripeProvider({ children }: Props) {
  return (
    <StripeProviderNative
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.clipperconnect.app"
      urlScheme="clipperconnect"
    >
      {children}
    </StripeProviderNative>
  );
}