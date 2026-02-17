import Stripe from "stripe";
import { getAppDomain, getProtocol } from "@/lib/domain";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    apiVersion: "2026-01-28.clover",
  });
}

export function getStripe() {
  return getStripeClient();
}

export async function createCheckoutSession({
  tenantId,
  tenantName,
  stripePriceId,
  customerEmail,
  stripeCustomerId,
}: {
  tenantId: string;
  tenantName: string;
  stripePriceId: string;
  customerEmail: string;
  stripeCustomerId?: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : customerEmail,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      tenantId,
      tenantName,
    },
    success_url: `${getProtocol()}://${getAppDomain()}/login?payment=success`,
    cancel_url: `${getProtocol()}://${getAppDomain()}/register?cancelled=true`,
  });

  return session;
}

export async function createBillingPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}
