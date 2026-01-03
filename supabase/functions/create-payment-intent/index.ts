// supabase/functions/create-payment-intent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking_id, amount_cents } = await req.json();

    // Validation
    if (!booking_id || !amount_cents) {
      return new Response(
        JSON.stringify({ error: "booking_id et amount_cents sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount_cents < 50) {
      return new Response(
        JSON.stringify({ error: "Le montant minimum est de 0.50€" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer le PaymentIntent avec méthodes de paiement limitées (France)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: "eur",
      payment_method_types: [
        "card",       // Carte bancaire (inclut Apple Pay et Google Pay)
      ],
      metadata: {
        booking_id: booking_id,
      },
    });

    console.log(`✅ PaymentIntent created: ${paymentIntent.id} for booking ${booking_id}`);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Stripe error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur Stripe" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});