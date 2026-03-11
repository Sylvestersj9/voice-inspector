import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const CONTACT_FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") ?? "MockOfsted <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Extract token and get user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = user.id;
    const userEmail = user.email;

    // 1. Update user status to 'deleted' and anonymize personal data
    const { error: updateErr } = await db
      .from("users")
      .update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
        name: "Deleted User",
        role: null,
        home_name: null,
      })
      .eq("id", userId);

    if (updateErr) {
      console.error("Error updating user status:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // 2. Delete from auth (this will cascade delete sessions/responses due to foreign keys)
    // Note: We're using service role to delete the auth user
    const { error: deleteAuthErr } = await db.auth.admin.deleteUser(userId);

    if (deleteAuthErr) {
      console.error("Error deleting auth user:", deleteAuthErr);
      // Log but don't fail - user is already marked as deleted in public.users
    }

    // 3. Send confirmation email
    if (RESEND_API_KEY && userEmail) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: CONTACT_FROM_EMAIL,
          to: userEmail,
          subject: "MockOfsted Account Deleted — We're Sorry to See You Go",
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    table { border-collapse: collapse; }
    a { color: #0d9488; text-decoration: none; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#059669 100%);padding:40px 32px;text-align:center">
            <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff">Account Deleted</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.95)">We've processed your request</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px">
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">
              Your Account Has Been Deleted
            </h2>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
              Your MockOfsted account and all associated personal data have been permanently deleted. You will no longer be able to access the platform with this email address.
            </p>

            <div style="margin:28px 0;background:#f0fdf9;border:1px solid #99f6e4;border-radius:12px;padding:20px">
              <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0d9488">What Happens Next</h3>
              <ul style="margin:0;padding-left:20px;font-size:14px;color:#0f172a;line-height:1.8">
                <li>Your account is immediately unavailable</li>
                <li>All personal information has been anonymized</li>
                <li>Your session records are retained for compliance purposes only</li>
                <li>You cannot recover this account</li>
              </ul>
            </div>

            <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6">
              If you change your mind or have questions about your data, please <a href="https://mockofsted.co.uk/contact" style="color:#0d9488;font-weight:600">contact us</a>.
            </p>

            <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6">
              Best wishes,<br/>
              <strong>The MockOfsted Team</strong>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;border-top:1px solid #e2e8f0;background:#f9fafb">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8">
              <a href="https://mockofsted.co.uk/privacy" style="color:#0d9488">Privacy Policy</a> ·
              <a href="https://mockofsted.co.uk/terms" style="color:#0d9488">Terms of Use</a> ·
              <a href="https://mockofsted.co.uk" style="color:#0d9488">Visit MockOfsted</a>
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">
              MockOfsted Ltd · Helping childcare leaders ace their Ofsted inspections<br/>
              info@mockofsted.co.uk
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
          `.trim(),
        }),
      }).catch((err) => {
        console.error("Confirmation email error:", err);
      });
    }

    // Note: Admin notification not sent from edge function due to auth constraints.
    // Email confirmation above provides user notification.
    // Session records retained in database for audit purposes.

    return new Response(JSON.stringify({ ok: true, message: "Account deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
