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
      console.warn("[Welcome Email] RESEND_API_KEY not set — skipping email (non-blocking)");
      return new Response(JSON.stringify({ ok: true, skipped: "RESEND_API_KEY missing" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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
        subject: "Welcome to MockOfsted — Your Ofsted Inspection Practice Tool",
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
    .step-number { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #0d9488; color: white; border-radius: 50%; font-weight: 700; font-size: 13px; margin-right: 12px; flex-shrink: 0; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">

        <!-- Header with Logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#059669 100%);padding:40px 32px;text-align:center">
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:16px">
              <path d="M16 2C16 2 6 8 6 14C6 19 16 26 16 26C16 26 26 19 26 14C26 8 16 2 16 2Z" fill="#ffffff"/>
              <g stroke="#0d9488" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 16L13.5 19L20 11"/>
              </g>
            </svg>
            <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff">MockOfsted</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.95)">Practice Ofsted Inspections with Confidence</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 32px">
            <!-- Greeting -->
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">
              Welcome, ${firstName}! 👋
            </h2>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
              Your account is ready to go! You're now part of a community of childcare leaders preparing for Ofsted inspections with confidence.
            </p>

            <!-- About MockOfsted -->
            <div style="margin:28px 0;background:#f0fdf9;border:1px solid #99f6e4;border-radius:12px;padding:20px">
              <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0d9488">What is MockOfsted?</h3>
              <p style="margin:0 0 10px;font-size:14px;color:#0f172a;line-height:1.6">
                MockOfsted is an AI-powered practice platform designed to help childcare leaders prepare for Ofsted inspections. Using the official SCCIF (Safeguarding, Children and Childcare in Focus) framework, you can:
              </p>
              <ul style="margin:12px 0 0;padding-left:20px;font-size:14px;color:#0f172a;line-height:1.8">
                <li>Practice answering real Ofsted-style inspection questions</li>
                <li>Get instant AI-powered feedback on your responses</li>
                <li>Identify knowledge gaps across all 9 Quality Standards</li>
                <li>Receive actionable improvement suggestions</li>
                <li>Build confidence before your actual inspection</li>
              </ul>
            </div>

            <!-- Your Trial -->
            <p style="margin:28px 0 16px;font-size:14px;font-weight:600;color:#0f172a">
              🎁 <strong>Your Free Trial Includes:</strong>
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6">
              <strong>3 days</strong> of unlimited access with <strong>2 practice sessions per day</strong> (up to 6 total). After your trial, choose a subscription to continue your preparation journey.
            </p>

            <!-- CTA Button -->
            <div style="margin:28px 0;text-align:center">
              <a href="https://mockofsted.co.uk/app" style="display:inline-block;background:#0d9488;color:#ffffff;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(13,148,136,0.3)">
                Start Your First Practice Session →
              </a>
            </div>

            <!-- How It Works -->
            <p style="margin:32px 0 20px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">
              How It Works (3 Simple Steps)
            </p>

            <!-- Step 1 -->
            <div style="margin:0 0 16px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#fafbfc">
              <div style="display:flex;align-items:flex-start">
                <span style="color:#0d9488;font-weight:700;font-size:18px;margin-right:12px;flex-shrink:0">1</span>
                <div>
                  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a"><strong>Answer Real Inspection Questions</strong></p>
                  <p style="margin:0;font-size:13px;color:#475569">Choose from all 9 Quality Standards. Record your voice or type your answer — just like in a real inspection.</p>
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div style="margin:0 0 16px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#fafbfc">
              <div style="display:flex;align-items:flex-start">
                <span style="color:#0d9488;font-weight:700;font-size:18px;margin-right:12px;flex-shrink:0">2</span>
                <div>
                  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a"><strong>Get Instant Scored Feedback</strong></p>
                  <p style="margin:0;font-size:13px;color:#475569">Receive AI-powered feedback with a band score (1–4), identified gaps, and follow-up questions to guide your improvement.</p>
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div style="margin:0 0 24px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#fafbfc">
              <div style="display:flex;align-items:flex-start">
                <span style="color:#0d9488;font-weight:700;font-size:18px;margin-right:12px;flex-shrink:0">3</span>
                <div>
                  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a"><strong>Download Your Inspection Report</strong></p>
                  <p style="margin:0;font-size:13px;color:#475569">Generate a full report with your scores, analysis, and action plan. Share with your improvement partner or inspectors.</p>
                </div>
              </div>
            </div>

            <!-- Pro Tip -->
            <div style="margin:24px 0;background:#fff3cd;border-left:4px solid #ffc107;border-radius:8px;padding:16px">
              <p style="margin:0;font-size:13px;color:#856404">
                <strong>💡 Pro Tip:</strong> Start with <strong>Safeguarding (QS7)</strong> — it's the most critical domain and often the limiting judgement factor in inspections. Mastering this will significantly boost your overall grade.
              </p>
            </div>

            <!-- Support -->
            <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6">
              Have questions? Our team is here to help. <a href="https://mockofsted.co.uk/contact" style="color:#0d9488;font-weight:600">Contact us</a> anytime or <a href="https://mockofsted.co.uk/faq" style="color:#0d9488;font-weight:600">check our FAQ</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 32px;border-top:1px solid #e2e8f0;background:#f9fafb">
            <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.6">
              Best wishes on your inspection journey,<br/>
              <strong>The MockOfsted Team</strong>
            </p>
            <div style="margin:16px 0;border-top:1px solid #e2e8f0;padding-top:16px">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8">
                <a href="https://mockofsted.co.uk/privacy" style="color:#0d9488">Privacy Policy</a> ·
                <a href="https://mockofsted.co.uk/terms" style="color:#0d9488">Terms of Use</a> ·
                <a href="https://mockofsted.co.uk" style="color:#0d9488">Visit MockOfsted</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">
                MockOfsted Ltd · Helping childcare leaders ace their Ofsted inspections<br/>
                info@mockofsted.co.uk
              </p>
            </div>
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
      console.warn(`[Welcome Email] Resend API error: ${errText} — skipping email (non-blocking)`);
      return new Response(JSON.stringify({ ok: true, skipped: "Resend API error", detail: errText }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await res.json();
    console.log(`[Welcome Email] Email sent to ${email} — Resend ID: ${result.id}`);
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.warn(`[Welcome Email] Error: ${e instanceof Error ? e.message : "Unknown error"} — skipping email (non-blocking)`);
    return new Response(JSON.stringify({ ok: true, skipped: "Exception occurred" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
