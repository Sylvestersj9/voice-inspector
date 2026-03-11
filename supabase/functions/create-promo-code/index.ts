import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    // Validate auth — admin only
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json(401, { error: "Missing authorization header" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");

    // Verify user is authenticated AND admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json(401, { error: "Invalid token" });

    // Check admin role
    const isAdmin = user?.user_metadata?.role === "admin";
    if (!isAdmin) return json(403, { error: "Admin access required" });

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { code, description, discountPercent = 10, maxRedemptions, expiresAt } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return json(400, { error: "code is required and must be a non-empty string" });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });

    // Create Stripe coupon (max 5 redemptions per code)
    const coupon = await stripe.coupons.create({
      percent_off: discountPercent,
      duration: "once",
      max_redemptions: 5,
      name: code,
    });

    // Create Stripe promotion code
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(),
    });

    // Insert into database
    const { data, error } = await serviceClient
      .from("promo_codes")
      .insert({
        code: code.toUpperCase(),
        description: description || null,
        stripe_coupon_id: coupon.id,
        discount_percent: discountPercent,
        max_redemptions: 5,
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;

    return json(201, {
      success: true,
      promoCode: data,
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promotionCode.id,
    });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to create promo code",
    });
  }
});
