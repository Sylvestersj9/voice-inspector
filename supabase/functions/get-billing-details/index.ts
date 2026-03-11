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

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json(401, { error: "Missing authorization header" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");

    // Validate user JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json(401, { error: "Invalid token" });

    // Get subscription details from DB
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sub, error: subError } = await serviceClient
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) throw subError;

    // If no stripe subscription, return early (trial user)
    if (!sub?.stripe_subscription_id) {
      return json(200, { hasPaidSub: false });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });

    // Fetch subscription details with payment method
    const [stripeSubscription, invoices] = await Promise.all([
      stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
        expand: ["default_payment_method"],
      }),
      stripe.invoices.list({
        customer: sub.stripe_customer_id,
        limit: 3,
      }),
    ]);

    // Extract payment method details
    const pm = stripeSubscription.default_payment_method as Record<string, unknown>;
    const paymentMethod = pm && typeof pm === 'object' && 'card' in pm ? {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    } : null;

    // Extract plan details
    const plan = stripeSubscription.items.data[0]?.plan;
    const planName = plan?.nickname || "Pro";
    const amount = plan?.amount || 0;
    const interval = plan?.interval || "month";

    // Format invoices
    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toLocaleDateString("en-GB"),
      amount: (inv.amount_paid / 100).toFixed(2),
      status: inv.status,
      pdfUrl: inv.invoice_pdf || inv.hosted_invoice_url,
    }));

    return json(200, {
      hasPaidSub: true,
      planName,
      amount: amount / 100, // Convert pence to pounds
      interval,
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      paymentMethod,
      invoices: formattedInvoices,
    });
  } catch (e) {
    console.error("get-billing-details error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
