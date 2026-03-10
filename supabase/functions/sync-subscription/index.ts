import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json(401, { error: "Missing authorization" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) return json(500, { error: "Stripe not configured" });

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json(401, { error: "Invalid token" });

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });

  // Get the user's stripe_customer_id from DB
  const { data: sub } = await serviceClient
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    // No customer yet — nothing to sync
    return json(200, { synced: false, reason: "no_customer" });
  }

  // Already active, nothing to do
  if (sub.stripe_subscription_id && (sub.status === "active" || sub.status === "trialing")) {
    return json(200, { synced: false, reason: "already_active", status: sub.status });
  }

  // Look up subscriptions in Stripe for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: sub.stripe_customer_id,
    limit: 5,
    status: "all",
  });

  if (subscriptions.data.length === 0) {
    return json(200, { synced: false, reason: "no_stripe_subscriptions" });
  }

  // Pick the most recent subscription
  const latest = subscriptions.data[0];
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    cancelled: "cancelled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "cancelled",
    paused: "past_due",
  };
  const newStatus = statusMap[latest.status] ?? "active";

  await serviceClient
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: latest.id,
        status: newStatus,
        trial_used: newStatus !== "trialing",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  return json(200, { synced: true, status: newStatus, subscriptionId: latest.id });
});
