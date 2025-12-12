import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs",
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const sig = req.headers["stripe-signature"];
    const rawBody = await buffer(req);

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("✅ Stripe event received:", event.type);

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
