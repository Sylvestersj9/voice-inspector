import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Check for admin secret key (defined in Supabase secrets)
    const adminSecret = Deno.env.get("ADMIN_SECRET_KEY");
    const authHeader = req.headers.get("X-Admin-Secret");

    if (!adminSecret || authHeader !== adminSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth user by email
    const { data: { users }, error: listError } = await db.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = users?.find(u => u.email === email);
    if (!authUser) {
      return new Response(JSON.stringify({ error: "User not found in auth" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user metadata to add admin role
    const { data: updated, error: updateError } = await db.auth.admin.updateUserById(
      authUser.id,
      {
        user_metadata: {
          ...authUser.user_metadata,
          role: "admin",
        },
      }
    );

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        ok: true,
        message: `Admin role granted to ${email}`,
        user: { id: updated.id, email: updated.email, role: "admin" }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error granting admin role:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
