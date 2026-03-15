import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialUser {
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
  session_count: number;
}

async function sendEmail(
  email: string,
  subject: string,
  html: string,
  resendKey: string
) {
  const contactFromEmail = Deno.env.get("CONTACT_FROM_EMAIL") || "noreply@mockofsted.co.uk";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: contactFromEmail,
      to: email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error(`Failed to send email to ${email}:`, await res.text());
    throw new Error(`Failed to send email: ${res.statusText}`);
  }
  return res.json();
}

function getDaysSinceSignup(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (_req: Request) => {
  // Handle CORS
  if (_req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey || !resendKey) {
      console.warn("Missing environment variables for drip emails");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch trial users who haven't subscribed
    const { data: trialUsers, error: usersError } = await supabase
      .from("subscriptions")
      .select(
        "user_id, users(email, name), created_at, sessions(count)"
      )
      .is("stripe_subscription_id", null)
      .eq("status", "trialing");

    if (usersError) {
      console.error("Error fetching trial users:", usersError);
      throw usersError;
    }

    if (!trialUsers || trialUsers.length === 0) {
      console.log("No trial users to send emails to");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let sent = 0;
    let failed = 0;

    for (const sub of trialUsers) {
      const userId = sub.user_id;
      const email = (sub.users as any)?.email;
      const name = (sub.users as any)?.name;
      const daysSince = getDaysSinceSignup(sub.created_at);

      if (!email) continue;

      // Determine which email to send based on daysSince
      const emailTypesToSend: Array<{ type: string; day: number }> = [];
      if (daysSince >= 1) emailTypesToSend.push({ type: "day1", day: 1 });
      if (daysSince >= 3) emailTypesToSend.push({ type: "day3", day: 3 });
      if (daysSince >= 5) emailTypesToSend.push({ type: "day5", day: 5 });
      if (daysSince >= 7) emailTypesToSend.push({ type: "day7", day: 7 });

      for (const emailType of emailTypesToSend) {
        // Check if already sent
        const { data: alreadySent } = await supabase
          .from("drip_emails_sent")
          .select("id")
          .eq("user_id", userId)
          .eq("email_type", emailType.type)
          .single();

        if (alreadySent) {
          console.log(`Email ${emailType.type} already sent to ${email}`);
          continue;
        }

        try {
          // Build email content based on type
          let subject = "";
          let html = "";

          if (emailType.type === "day1") {
            subject = "Your first MockOfsted score";
            html = `
              <h2>Hi ${name || "there"},</h2>
              <p>Welcome to MockOfsted! You've completed your first practice session.</p>
              <p>Practice more to improve your inspection readiness. Keep going!</p>
              <a href="https://mockofsted.co.uk/app">Continue practicing →</a>
            `;
          } else if (emailType.type === "day3") {
            subject = "Mid-trial: Don't lose your progress";
            html = `
              <h2>Hi ${name || "there"},</h2>
              <p>You're in the middle of your free trial! Keep up the momentum.</p>
              <p>Subscribe now and get 20% off your first month. Use code: TRIAL20</p>
              <a href="https://mockofsted.co.uk/pricing">Upgrade →</a>
            `;
          } else if (emailType.type === "day5") {
            subject = "Trial ends tomorrow";
            html = `
              <h2>Hi ${name || "there"},</h2>
              <p>Your free trial expires tomorrow! Don't lose your progress.</p>
              <p>Subscribe now for unlimited sessions and full inspection reports.</p>
              <a href="https://mockofsted.co.uk/pricing">Subscribe - £29/month →</a>
            `;
          } else if (emailType.type === "day7") {
            subject = "Your data's waiting — reactivate";
            html = `
              <h2>Hi ${name || "there"},</h2>
              <p>Your trial has ended. All your progress and sessions are saved.</p>
              <p>Reactivate your subscription to continue practicing.</p>
              <a href="https://mockofsted.co.uk/pricing">Reactivate →</a>
            `;
          }

          // Send email
          await sendEmail(email, subject, html, resendKey);

          // Track in database
          const { error: insertError } = await supabase
            .from("drip_emails_sent")
            .insert({
              user_id: userId,
              email_type: emailType.type,
            });

          if (insertError) {
            console.error(`Failed to track email ${emailType.type} for ${email}:`, insertError);
            failed++;
          } else {
            console.log(`Sent ${emailType.type} email to ${email}`);
            sent++;
          }
        } catch (e) {
          console.error(`Error sending ${emailType.type} email to ${email}:`, e);
          failed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("Drip email function error:", err);
    return new Response(
      JSON.stringify({ success: true, error: String(err) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
