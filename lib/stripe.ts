import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

let _stripe: Stripe | null = null;

/**
 * Lazily-instantiated Stripe client. Throws if STRIPE_SECRET_KEY is missing
 * the moment we actually try to use it (so build-time env-less environments
 * still compile).
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  _stripe = new Stripe(secret, {
    apiVersion: "2024-06-20",
    typescript: true,
  });
  return _stripe;
}
