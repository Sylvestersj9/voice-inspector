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
    console.log("[Get Admin Users] Request received");

    // Verify auth
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.warn("[Get Admin Users] No token provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Get Admin Users] Missing Supabase env vars");
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("[Get Admin Users] Supabase client created");

    // Verify JWT and admin role
    console.log("[Get Admin Users] Verifying user token...");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("[Get Admin Users] Auth error:", userError);
      throw userError;
    }

    if (!user) {
      console.warn("[Get Admin Users] No user found with token");
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    console.log("[Get Admin Users] User verified:", user.id);

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) {
      console.warn("[Get Admin Users] User is not admin, role:", user.user_metadata?.role);
      return new Response(JSON.stringify({ error: "Not admin" }), { status: 403 });
    }

    console.log("[Get Admin Users] Admin verified, fetching users...");

    // Get all users with their details
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, home_name, role, created_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[Get Admin Users] Users query error:", usersError);
      throw usersError;
    }

    console.log("[Get Admin Users] Users query successful, found:", users?.length || 0, "users");

    if (!users || users.length === 0) {
      console.log("[Get Admin Users] No users found");
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Get subscriptions
    console.log("[Get Admin Users] Fetching subscriptions...");
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("user_id, status, current_period_end");

    if (subsError) {
      console.warn("[Get Admin Users] Subscriptions query warning (continuing):", subsError);
    } else {
      console.log("[Get Admin Users] Subscriptions query successful, found:", subscriptions?.length || 0);
    }

    // Build subscription map
    const subsMap: Record<string, { status: string; current_period_end: string | null }> = {};
    if (subscriptions) {
      subscriptions.forEach((sub: any) => {
        subsMap[sub.user_id] = { status: sub.status, current_period_end: sub.current_period_end };
      });
    }

    // Get sessions - just count them
    console.log("[Get Admin Users] Fetching sessions...");
    const { data: sessions, error: sessError } = await supabase
      .from("sessions")
      .select("user_id");

    if (sessError) {
      console.warn("[Get Admin Users] Sessions query warning (continuing):", sessError);
    } else {
      console.log("[Get Admin Users] Sessions query successful, found:", sessions?.length || 0);
    }

    // Build session map
    const sessionMap: Record<string, number> = {};
    if (sessions) {
      sessions.forEach((session: any) => {
        sessionMap[session.user_id] = (sessionMap[session.user_id] || 0) + 1;
      });
    }

    // Combine data
    console.log("[Get Admin Users] Combining user data...");
    const usersWithDetails = users.map((user: any) => ({
      ...user,
      subscription_status: subsMap[user.id]?.status || "none",
      current_period_end: subsMap[user.id]?.current_period_end || null,
      session_count: sessionMap[user.id] || 0,
    }));

    console.log("[Get Admin Users] Successfully combined data, returning", usersWithDetails.length, "users");

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

    return new Response(
      JSON.stringify({
        error: "Failed to fetch users",
        details: errorMsg,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
