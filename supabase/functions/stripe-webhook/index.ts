import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-12-18",
});

async function upsertSubscription(payload: {
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean | null;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id: payload.userId,
    stripe_customer_id: payload.customerId,
    stripe_subscription_id: payload.subscriptionId,
    status: payload.status,
    price_id: payload.priceId,
    current_period_end: payload.currentPeriodEnd
      ? new Date(payload.currentPeriodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: payload.cancelAtPeriodEnd ?? false,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Supabase upsert error:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = (session.metadata as Record<string, string> | null)?.user_id ||
          (subscription.metadata as Record<string, string> | null)?.user_id;
        if (!userId) break;

        await upsertSubscription({
          userId,
          customerId: subscription.customer as string,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id || "",
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = (subscription.metadata as Record<string, string> | null)?.user_id;
        if (!userId) break;

        await upsertSubscription({
          userId,
          customerId: subscription.customer as string,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id || "",
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        break;
      }
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});
