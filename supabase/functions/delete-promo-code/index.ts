import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.9.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

    const { data: userData } = await supabase.from("users").select("id").eq("id", user.id).single();
    if (!userData) return new Response(JSON.stringify({ error: "User not found" }), { status: 401 });

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) return new Response(JSON.stringify({ error: "Not admin" }), { status: 403 });

    const { promoCodeId } = await req.json();
    if (!promoCodeId) return new Response(JSON.stringify({ error: "promoCodeId required" }), { status: 400 });

    // Get promo code details
    const { data: promoCode, error: codeError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("id", promoCodeId)
      .single();

    if (codeError || !promoCode) {
      return new Response(JSON.stringify({ error: "Promo code not found" }), { status: 404 });
    }

    // Delete from Stripe if it has a coupon ID
    if (promoCode.stripe_coupon_id) {
      try {
        await stripe.coupons.del(promoCode.stripe_coupon_id);
      } catch (stripeError) {
        console.warn("Failed to delete Stripe coupon:", stripeError);
        // Continue anyway - delete database record
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promoCodeId);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true, message: "Promo code deleted" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } catch (error) {
    console.error("Delete promo code error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete promo code" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }
});
