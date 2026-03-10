import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

serve(async (req: Request) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!stripeSecretKey || !webhookSecret) {
    return json(500, { error: "Stripe keys not configured" });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return json(400, { error: "Missing stripe-signature header" });

  const body = await req.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return json(400, { error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Support both payment links (client_reference_id) and legacy dynamic sessions (metadata.user_id)
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          let status: string = "active";
          let trialUsed = true;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const statusMap: Record<string, string> = {
              active: "active",
              trialing: "trialing",
              past_due: "past_due",
              canceled: "cancelled",
              cancelled: "cancelled",
              unpaid: "past_due",
              incomplete: "past_due",
              incomplete_expired: "cancelled",
              paused: "past_due",
            };
            status = statusMap[subscription.status] ?? "active";
            trialUsed = status !== "trialing";
          }

          await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status,
                trial_used: trialUsed,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const customerId = subscription.customer as string;

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "cancelled",
          cancelled: "cancelled",
          unpaid: "past_due",
          incomplete: "past_due",
          incomplete_expired: "cancelled",
          paused: "past_due",
        };
        const status = statusMap[subscription.status] ?? "cancelled";

        if (userId) {
          await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                status,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
        } else {
          // Look up by customer ID
          await supabase
            .from("subscriptions")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .or(`stripe_customer_id.eq.${customerId},stripe_subscription_id.eq.${subscription.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json(200, { received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
