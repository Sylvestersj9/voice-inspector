import Stripe from "stripe";
import { PLANS, type PlanName } from "./plans";
import { supabase } from "@/lib/supabase";

const stripeSecret = import.meta.env.VITE_STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : null;

type CreateCheckoutInput = {
  organisationId: string;
  plan: PlanName;
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckoutSession(input: CreateCheckoutInput) {
  if (!stripe) throw new Error("Stripe secret not configured");

  // Lookup existing billing
  const { data: billing } = await supabase
    .from("organisation_billing")
    .select("stripe_customer_id")
    .eq("organisation_id", input.organisationId)
    .maybeSingle();

  let customerId = billing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { organisation_id: input.organisationId },
    });
    customerId = customer.id;
  }

  // Price lookup is assumed handled outside (plan → price_id mapping)
  const priceId = import.meta.env[`VITE_STRIPE_PRICE_${input.plan.toUpperCase()}`];
  if (!priceId) throw new Error("Price not configured for plan");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId as string, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { organisation_id: input.organisationId, plan: input.plan },
    subscription_data: {
      metadata: { organisation_id: input.organisationId, plan: input.plan },
    },
  });

  return session.url;
}
