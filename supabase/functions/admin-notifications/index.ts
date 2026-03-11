import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const ADMIN_EMAIL = Deno.env.get("CONTACT_TO_EMAIL") || "info@mockofsted.co.uk";
const FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") || "MockOfsted <info@mockofsted.co.uk>";

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const type = payload?.type || "unknown";
    const userName = payload?.userName || "Unknown";
    const userEmail = payload?.userEmail || "N/A";
    const userId = payload?.userId || "N/A";
    const sessionId = payload?.sessionId || null;
    const sessionDomain = payload?.sessionDomain || null;
    const sessionScore = payload?.sessionScore || null;
    const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

    if (!RESEND_API_KEY) {
      return json({ error: "RESEND_API_KEY not configured" }, 500, corsHeaders);
    }

    let subject = "";
    let htmlBody = "";

    switch (type) {
      case "signup":
        subject = `🎉 New signup: ${userName}`;
        htmlBody = `
          <h2>New User Signup</h2>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p style="margin-top:20px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666;">
            User has started their free trial (2 sessions/day for 3 days).
          </p>
        `;
        break;

      case "login":
        subject = `👤 User login: ${userName}`;
        htmlBody = `
          <h2>User Login</h2>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
        `;
        break;

      case "session_started":
        subject = `▶️ Session started: ${userName}`;
        htmlBody = `
          <h2>Session Started</h2>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>Session ID:</strong> ${sessionId}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
        `;
        break;

      case "session_completed":
        subject = `✅ Session completed: ${userName}`;
        htmlBody = `
          <h2>Session Completed</h2>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>Session ID:</strong> ${sessionId}</p>
          <p><strong>Domain:</strong> ${sessionDomain || "N/A"}</p>
          <p><strong>Overall Score:</strong> ${sessionScore ? `${sessionScore}/4` : "N/A"}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
        `;
        break;

      case "feedback":
        subject = `💬 New feedback from ${userName}`;
        htmlBody = `
          <h2>New Feedback Submission</h2>
          <p><strong>From:</strong> ${userName} (${userEmail})</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background:#f5f5f5;padding:12px;border-left:3px solid #0d9488;margin:10px 0">
            ${payload?.message || "No message"}
          </blockquote>
          <p><strong>Time:</strong> ${timestamp}</p>
        `;
        break;

      case "subscription_created":
        subject = `💳 New subscription: ${userName}`;
        htmlBody = `
          <h2>New Subscription</h2>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p style="color:#0d9488;font-weight:bold;">User upgraded to paid plan!</p>
        `;
        break;

      case "account_deleted":
        subject = `🗑️ Account deleted: ${userEmail}`;
        htmlBody = `
          <h2>Account Deleted</h2>
          <p><strong>User Email:</strong> ${userEmail}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p style="color:#666;">User account has been permanently deleted. Personal data anonymized. Records retained for compliance.</p>
        `;
        break;

      default:
        subject = `📬 Admin notification: ${type}`;
        htmlBody = `
          <h2>${type}</h2>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>Details:</strong></p>
          <pre>${JSON.stringify(payload, null, 2)}</pre>
        `;
    }

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    h2 { color: #0d9488; margin-top: 0; }
    a { color: #0d9488; }
  </style>
</head>
<body style="margin:0;padding:20px;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;background:white;padding:20px;border-radius:8px;border:1px solid #e2e8f0">
    ${htmlBody}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
    <p style="font-size:12px;color:#888">This is an automated notification from MockOfsted.</p>
  </div>
</body>
</html>
        `,
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      console.error("Resend error:", errText);
      return json({ error: "Email send failed", detail: errText }, 502, corsHeaders);
    }

    return json({ ok: true }, 200, corsHeaders);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("admin-notifications error:", msg);
    return json({ error: msg }, 500, corsHeaders);
  }
});
