// src/api/payments.ts
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export interface CreatePaymentIntentInput {
  booking_id: string;
  amount_cents: number;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface ConfirmPaymentResult {
  success: boolean;
  error?: string;
}

// ============================================
// FONCTIONS
// ============================================

/**
 * Créer un PaymentIntent via Edge Function
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  try {
    const { data, error } = await supabase.functions.invoke("create-payment-intent", {
      body: input,
    });

    if (error) {
      console.error("Error creating payment intent:", error);
      return { success: false, error: error.message };
    }

    if (!data?.clientSecret) {
      return { success: false, error: "Pas de client secret retourné" };
    }

    return {
      success: true,
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (e: any) {
    console.error("Payment intent error:", e);
    return { success: false, error: e.message || "Erreur de paiement" };
  }
}

/**
 * Confirmer le paiement côté serveur (appelé après succès Stripe)
 */
export async function confirmPaymentSuccess(
  bookingId: string,
  paymentIntentId: string
): Promise<ConfirmPaymentResult> {
  try {
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
        status: "confirmed",
      })
      .eq("id", bookingId);

    if (error) {
      console.error("Error confirming payment:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Confirm payment error:", e);
    return { success: false, error: e.message };
  }
}

/**
 * Marquer le paiement comme échoué
 */
export async function markPaymentFailed(
  bookingId: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from("bookings")
      .update({
        payment_status: "failed",
        status: "cancelled",
        cancellation_reason: errorMessage || "Paiement échoué",
      })
      .eq("id", bookingId);
  } catch (e) {
    console.error("Error marking payment failed:", e);
  }
}

/**
 * Annuler un booking en attente de paiement (utilisateur a annulé)
 */
export async function cancelPendingBooking(bookingId: string): Promise<void> {
  console.log("🔄 Attempting to cancel booking:", bookingId);
  
  try {
    // D'abord, supprimer les booking_items
    const { error: itemsError } = await supabase
      .from("booking_items")
      .delete()
      .eq("booking_id", bookingId);
    
    if (itemsError) {
      console.error("❌ Error deleting booking items:", itemsError);
    } else {
      console.log("✅ Booking items deleted");
    }

    // Ensuite, supprimer le booking lui-même
    const { error, data } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .eq("status", "pending")
      .select();
      
    if (error) {
      console.error("❌ Error deleting pending booking:", error);
      
      // Fallback: essayer un update si delete échoue
      console.log("🔄 Trying update instead of delete...");
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          cancellation_reason: "Paiement annulé par l'utilisateur",
        })
        .eq("id", bookingId);
        
      if (updateError) {
        console.error("❌ Update also failed:", updateError);
      } else {
        console.log("✅ Booking updated to cancelled");
      }
    } else {
      console.log("✅ Pending booking deleted:", data);
    }
  } catch (e) {
    console.error("❌ Exception cancelling pending booking:", e);
  }
}