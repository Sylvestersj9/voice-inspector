import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/audit/logAudit";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : null;

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

export async function handleStripeWebhook(req: Request): Promise<Response> {
  if (!stripe || !webhookSecret) {
    return new Response("Stripe not configured", { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const orgId = session.metadata?.organisation_id;
        const plan = session.metadata?.plan;
        if (!orgId || !plan) break;

        await upsertBilling(orgId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: "active",
          current_period_end: null,
        });
        logAudit({
          actorId: "stripe",
          action: "subscription_created",
          entityType: "organisation",
          entityId: orgId,
          metadata: { plan },
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organisation_id;
        if (!orgId) break;
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";
        await upsertBilling(orgId, {
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          plan: sub.metadata?.plan || "starter",
          status,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        });
        logAudit({
          actorId: "stripe",
          action: event.type === "customer.subscription.deleted" ? "subscription_canceled" : "subscription_updated",
          entityType: "organisation",
          entityId: orgId,
          metadata: { plan: sub.metadata?.plan, status },
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.warn("Stripe webhook handling error:", err);
    return new Response("fail", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

async function upsertBilling(orgId: string, payload: { stripe_customer_id: string; stripe_subscription_id: string; plan: string; status: string; current_period_end: string | null; }) {
  const { error } = await supabase
    .from("organisation_billing")
    .upsert(
      {
        organisation_id: orgId,
        stripe_customer_id: payload.stripe_customer_id,
        stripe_subscription_id: payload.stripe_subscription_id,
        plan: payload.plan,
        status: payload.status,
        current_period_end: payload.current_period_end,
      },
      { onConflict: "organisation_id" },
    );
  if (error) throw error;
}
