import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) return new Response(JSON.stringify({ error: "Not admin" }), { status: 403 });

    // Get all users with their details
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, home_name, role, created_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[Get Admin Users] Users query error:", usersError);
      throw usersError;
    }
    if (!users) {
      console.log("[Get Admin Users] No users found");
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    console.log("[Get Admin Users] Found users:", users.length);

    // Get subscriptions for all users
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("user_id, status, current_period_end");

    if (subsError) {
      console.error("[Get Admin Users] Subscriptions query error:", subsError);
      throw subsError;
    }
    console.log("[Get Admin Users] Found subscriptions:", (subscriptions || []).length);

    // Create subscription map for quick lookup
    const subsMap: Record<string, { status: string; current_period_end: string | null }> = {};
    (subscriptions || []).forEach((sub) => {
      subsMap[sub.user_id] = { status: sub.status, current_period_end: sub.current_period_end };
    });

    // Get session counts for all users by querying sessions table
    const { data: sessions, error: sessError } = await supabase
      .from("sessions")
      .select("user_id");

    if (sessError) {
      console.warn("[Get Admin Users] Sessions query error:", sessError);
    }
    console.log("[Get Admin Users] Found sessions:", (sessions || []).length);

    const sessionMap: Record<string, number> = {};
    (sessions || []).forEach((session) => {
      sessionMap[session.user_id] = (sessionMap[session.user_id] || 0) + 1;
    });

    // Combine all data
    console.log("[Get Admin Users] Combining data for", users.length, "users");
    const usersWithDetails = users.map((user) => ({
      ...user,
      subscription_status: subsMap[user.id]?.status || "none",
      current_period_end: subsMap[user.id]?.current_period_end || null,
      session_count: sessionMap[user.id] || 0,
    }));
    console.log("[Get Admin Users] Successfully combined data");

    return new Response(JSON.stringify({ data: usersWithDetails }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Get Admin Users] Error:", errorMsg);
    console.error("[Get Admin Users] Full error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users", details: errorMsg }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
