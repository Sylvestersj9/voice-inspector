import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") ?? "MockOfsted <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Payload sent by the pg_net trigger: { user_id, name }
    const body = await req.json().catch(() => ({}));
    const userId: string = body.user_id ?? body.record?.id;
    const nameFromTrigger: string = body.name ?? body.record?.name ?? "";

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id required" }), { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });
    }

    // Fetch email from auth.users (requires service role)
    const { data: authUser, error: authErr } = await db.auth.admin.getUserById(userId);
    if (authErr || !authUser?.user?.email) {
      console.error("Could not fetch auth user:", authErr?.message);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
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
        subject: "Welcome to MockOfsted — let's ace your next inspection",
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#0d9488;padding:28px 32px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 10px;margin-right:10px">
                  <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px">M</span>
                </td>
                <td style="padding-left:10px">
                  <span style="color:#ffffff;font-size:18px;font-weight:700">MockOfsted</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3">
              Welcome, ${firstName} 👋
            </h1>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
              You're all set. Your free trial includes <strong>2 practice sessions per day for 3 days</strong>
              — that's 6 sessions to get a feel for how MockOfsted works before committing.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:24px 0">
              <tr>
                <td style="background:#0d9488;border-radius:10px">
                  <a href="https://mockofsted.co.uk/app"
                     style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.1px">
                    Start your first practice session →
                  </a>
                </td>
              </tr>
            </table>

            <!-- How it works -->
            <p style="margin:24px 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">
              How it works
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:10px 0;border-top:1px solid #f1f5f9;vertical-align:top;width:28px">
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#f0fdf9;border-radius:50%;font-size:11px;font-weight:700;color:#0d9488">1</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-top:1px solid #f1f5f9">
                  <span style="font-size:14px;color:#334155"><strong>Answer as an inspector asks</strong> — voice or text, all 9 SCCIF Quality Standards</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:1px solid #f1f5f9;vertical-align:top;width:28px">
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#f0fdf9;border-radius:50%;font-size:11px;font-weight:700;color:#0d9488">2</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-top:1px solid #f1f5f9">
                  <span style="font-size:14px;color:#334155"><strong>Receive instant scored feedback</strong> — band 1–4, named gaps, follow-up questions</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:1px solid #f1f5f9;vertical-align:top;width:28px">
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#f0fdf9;border-radius:50%;font-size:11px;font-weight:700;color:#0d9488">3</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-top:1px solid #f1f5f9">
                  <span style="font-size:14px;color:#334155"><strong>Download your full inspection report</strong> — share with your RI or use as evidence</span>
                </td>
              </tr>
            </table>

            <!-- Tip -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 0;background:#f0fdf9;border:1px solid #99f6e4;border-radius:10px">
              <tr>
                <td style="padding:14px 16px">
                  <p style="margin:0;font-size:13px;color:#0d9488">
                    <strong>💡 Tip:</strong> Start with <strong>Safeguarding (QS7)</strong> — it's the limiting judgement domain and the one most likely to define your overall grade.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
              MockOfsted · Ofsted practice for children's homes &amp; supported living<br/>
              Questions? Reply to this email or visit
              <a href="https://mockofsted.co.uk/contact" style="color:#0d9488;text-decoration:none">mockofsted.co.uk/contact</a><br/>
              <a href="https://mockofsted.co.uk/privacy" style="color:#94a3b8">Privacy policy</a> ·
              <a href="https://mockofsted.co.uk/terms" style="color:#94a3b8">Terms</a>
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
      return new Response(JSON.stringify({ error: "Email send failed", detail: errText }), { status: 500 });
    }

    const result = await res.json();
    console.log(`Welcome email sent to ${email} — Resend ID: ${result.id}`);
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("welcome-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500 });
  }
});
