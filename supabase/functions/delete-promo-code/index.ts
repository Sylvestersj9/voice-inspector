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

    console.log("[Delete] Promo code found:", promoCode.code);

    // Delete from Stripe if it has a coupon ID
    if (promoCode.stripe_coupon_id) {
      try {
        console.log("[Delete] Deleting Stripe coupon:", promoCode.stripe_coupon_id);
        await stripe.coupons.del(promoCode.stripe_coupon_id);
        console.log("[Delete] Stripe coupon deleted successfully");
      } catch (stripeError) {
        console.warn("[Delete] Failed to delete Stripe coupon:", stripeError);
        // Continue anyway - delete database record
      }
    }

    // Delete from database
    console.log("[Delete] Deleting from database, ID:", promoCodeId);
    const { data: deleteResult, error: deleteError } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promoCodeId)
      .select();

    console.log("[Delete] Delete result:", { deleteResult, deleteError });

    if (deleteError) {
      console.error("[Delete] Delete error:", deleteError);
      throw deleteError;
    }

    if (!deleteResult || deleteResult.length === 0) {
      console.warn("[Delete] No rows deleted - ID may not exist");
    }

    return new Response(JSON.stringify({ success: true, message: "Promo code deleted", deleted: deleteResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Delete] Error:", errorMsg);
    return new Response(JSON.stringify({
      error: "Failed to delete promo code",
      details: errorMsg
    }), {
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
