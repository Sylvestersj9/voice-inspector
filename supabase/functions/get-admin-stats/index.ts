import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Validate user JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json(401, { error: "Invalid token" });

    // Check admin role
    if (user.user_metadata?.role !== "admin") {
      return json(403, { error: "Admin access required" });
    }

    // Use service role for aggregation queries
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const [
      { count: totalUsers },
      { data: subscriptions },
      { count: totalSessions },
      { count: sessionsToday },
      { count: totalResponses },
    ] = await Promise.all([
      serviceClient.from("users").select("*", { count: "exact", head: true }),
      serviceClient
        .from("subscriptions")
        .select("status, stripe_subscription_id"),
      serviceClient.from("sessions").select("*", { count: "exact", head: true }),
      serviceClient
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .gte("started_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      serviceClient.from("responses").select("*", { count: "exact", head: true }),
    ]);

    // Calculate paid and trial counts
    const paidSubscribers = (subscriptions || []).filter(
      s => s.status === "active" || (s.status === "trialing" && s.stripe_subscription_id)
    ).length;
    const trialUsers = (subscriptions || []).filter(
      s => s.status === "trialing" && !s.stripe_subscription_id
    ).length;

    return json(200, {
      totalUsers: totalUsers || 0,
      paidSubscribers,
      trialUsers,
      totalSessions: totalSessions || 0,
      sessionsToday: sessionsToday || 0,
      totalResponses: totalResponses || 0,
    });
  } catch (e) {
    console.error("get-admin-stats error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
