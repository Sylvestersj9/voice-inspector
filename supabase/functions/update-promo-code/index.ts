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

    const { promoCodeId, description, expiresAt } = await req.json();
    if (!promoCodeId) return new Response(JSON.stringify({ error: "promoCodeId required" }), { status: 400 });

    // Update in database
    const { error: updateError } = await supabase
      .from("promo_codes")
      .update({
        description: description || null,
        expires_at: expiresAt || null,
      })
      .eq("id", promoCodeId);

    if (updateError) throw updateError;

    // Get updated record
    const { data: updated } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("id", promoCodeId)
      .single();

    return new Response(JSON.stringify({ success: true, data: updated }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } catch (error) {
    console.error("Update promo code error:", error);
    return new Response(JSON.stringify({ error: "Failed to update promo code" }), {
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
