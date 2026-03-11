import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email } = await req.json();

    // Get user ID from email
    const { data: user, error: userError } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Create or update subscription
    const { error: subError } = await db
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          status: "active",
          stripe_customer_id: "admin-granted-access",
          stripe_subscription_id: "admin-granted-access",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Full access granted" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
