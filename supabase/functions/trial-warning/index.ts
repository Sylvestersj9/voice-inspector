/**
 * trial-warning edge function
 *
 * Finds trial users who have used 5 of their 6 total trial sessions
 * (i.e. 1 remaining) and sends a warning email via Resend.
 *
 * Invoke via Supabase cron:
 *   Schedule: "0 9 * * *"  (daily at 09:00 UTC)
 *   HTTP POST to: https://<project>.supabase.co/functions/v1/trial-warning
 *   Headers: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TRIAL_TOTAL_LIMIT = 6;
const WARNING_AT_USED = 5; // send warning when this many sessions used

serve(async (req: Request) => {
  // Allow a simple service-role-authenticated POST (from cron or manual trigger)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL") ?? "MockOfsted <onboarding@resend.dev>";

  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });
  }

  const db = createClient(supabaseUrl, serviceKey);

  // Get all trial users (no stripe_subscription_id) with their session counts
  const { data: subs, error: subErr } = await db
    .from("subscriptions")
    .select("user_id, created_at")
    .is("stripe_subscription_id", null)
    .in("status", ["trialing"]);

  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no trial users" }), { status: 200 });
  }

  const userIds = subs.map((s: { user_id: string }) => s.user_id);

  // Count sessions per user since their trial started
  const { data: sessionCounts } = await db
    .from("sessions")
    .select("user_id")
    .in("user_id", userIds);

  // Group counts
  const countMap: Record<string, number> = {};
  for (const row of sessionCounts ?? []) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1;
  }

  // Find users exactly at WARNING_AT_USED sessions
  const warningUserIds = subs
    .filter((s: { user_id: string }) => (countMap[s.user_id] ?? 0) === WARNING_AT_USED)
    .map((s: { user_id: string }) => s.user_id);

  if (warningUserIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no users at warning threshold" }), { status: 200 });
  }

  // Fetch emails from auth.users via service role
  const { data: authUsers } = await db.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailMap[u.id] = u.email;
  }

  let sent = 0;
  const errors: string[] = [];

  for (const uid of warningUserIds) {
    const email = emailMap[uid];
    if (!email) continue;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "You have 1 practice session left — don't lose your momentum",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
            <img src="https://mockofsted.co.uk/logo.svg" alt="MockOfsted" width="40" style="margin-bottom:16px"/>
            <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">1 session remaining on your free trial</h2>
            <p style="margin:0 0 16px;color:#475569">
              You've used ${WARNING_AT_USED} of your ${TRIAL_TOTAL_LIMIT} trial sessions.
              Make your last one count — or subscribe now for unlimited practice.
            </p>
            <a href="https://mockofsted.co.uk/pricing"
               style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
              Subscribe — £29/month
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
              MockOfsted · Ofsted practice for children's homes & supported living ·
              <a href="https://mockofsted.co.uk/contact" style="color:#0d9488">contact us</a>
            </p>
          </div>
        `,
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      const body = await res.text();
      errors.push(`${email}: ${body}`);
    }
  }

  return new Response(
    JSON.stringify({ sent, errors: errors.length ? errors : undefined }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
