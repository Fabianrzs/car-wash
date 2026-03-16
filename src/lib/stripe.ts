import Stripe from "stripe";

/**
 * Get Stripe instance
 * Initializes and returns a Stripe client
 */
export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not defined");
  }

  return new Stripe(apiKey, {
    apiVersion: "2026-01-28.clover" as any,
  });
}


