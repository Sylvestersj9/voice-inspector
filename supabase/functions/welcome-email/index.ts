import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") ?? "MockOfsted <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    // Payload sent by the pg_net trigger: { user_id, name }
    const body = await req.json().catch(() => ({}));
    const userId: string = body.user_id ?? body.record?.id;
    const nameFromTrigger: string = body.name ?? body.record?.name ?? "";

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    // Fetch email from auth.users (requires service role)
    const { data: authUser, error: authErr } = await db.auth.admin.getUserById(userId);
    if (authErr || !authUser?.user?.email) {
      console.error("Could not fetch auth user:", authErr?.message);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
    }

    const email = authUser.user.email;
    const name = nameFromTrigger || email.split("@")[0];
    const firstName = name.split(" ")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome to MockOfsted",
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
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">

        <!-- Header with Logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#059669 100%);padding:32px;text-align:center">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:16px">
              <path d="M16 2C16 2 6 8 6 14C6 19 16 26 16 26C16 26 26 19 26 14C26 8 16 2 16 2Z" fill="#ffffff"/>
              <g stroke="#0d9488" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 16L13.5 19L20 11"/>
              </g>
            </svg>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff">MockOfsted</h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.9)">Ofsted inspection practice</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a">
              Welcome, ${firstName}! 👋
            </h2>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
              Your account is ready. You have access to a <strong>free 3-day trial</strong> with <strong>2 practice sessions per day</strong> — up to 6 sessions total.
            </p>

            <!-- CTA Button -->
            <div style="margin:28px 0;text-align:center">
              <a href="https://mockofsted.co.uk/app" style="display:inline-block;background:#0d9488;color:#ffffff;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none">
                Start your practice session →
              </a>
            </div>

            <!-- Feature List -->
            <p style="margin:28px 0 16px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">
              How it works
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:12px 0;border-top:1px solid #e2e8f0;width:32px">
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#e0f2f1;border-radius:50%;font-size:12px;font-weight:700;color:#0d9488;flex-shrink:0">1</span>
                </td>
                <td style="padding:12px 0 12px 12px;border-top:1px solid #e2e8f0">
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.5"><strong>Answer inspection questions</strong> — all 9 Quality Standards, voice or text</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-top:1px solid #e2e8f0;width:32px">
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#e0f2f1;border-radius:50%;font-size:12px;font-weight:700;color:#0d9488;flex-shrink:0">2</span>
                </td>
                <td style="padding:12px 0 12px 12px;border-top:1px solid #e2e8f0">
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.5"><strong>Get instant feedback</strong> — scores, gaps, and follow-up questions</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-top:1px solid #e2e8f0;width:32px">
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#e0f2f1;border-radius:50%;font-size:12px;font-weight:700;color:#0d9488;flex-shrink:0">3</span>
                </td>
                <td style="padding:12px 0 12px 12px;border-top:1px solid #e2e8f0">
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.5"><strong>Download your report</strong> — share with your improvement partner or inspectors</p>
                </td>
              </tr>
            </table>

            <!-- Helpful Tip -->
            <div style="margin:24px 0;background:#f0fdf9;border-left:4px solid #0d9488;border-radius:8px;padding:16px">
              <p style="margin:0;font-size:13px;color:#0d9488">
                <strong>💡 Pro tip:</strong> Start with <strong>Safeguarding (QS7)</strong> — it's the most critical domain for your grade.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #e2e8f0;background:#f9fafb">
            <p style="margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.6">
              Questions or feedback? <a href="https://mockofsted.co.uk/contact">Contact us</a> or reply to this email.
            </p>
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
              <a href="https://mockofsted.co.uk/privacy" style="color:#0d9488">Privacy policy</a> ·
              <a href="https://mockofsted.co.uk/terms" style="color:#0d9488">Terms</a> ·
              <a href="https://mockofsted.co.uk" style="color:#0d9488">mockofsted.co.uk</a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1">
              MockOfsted · Helping childcare leaders ace their inspections<br/>
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
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Email send failed", detail: errText }), { status: 500, headers: corsHeaders });
    }

    const result = await res.json();
    console.log(`Welcome email sent to ${email} — Resend ID: ${result.id}`);
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("welcome-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
