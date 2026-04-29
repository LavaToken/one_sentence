import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getServiceClient } from "@/lib/supabase-admin";
import { SENTENCES_TABLE } from "@/lib/queries";

// Must use node runtime so we can read the raw body for signature verification.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Reject immediately if signature header or secret is absent — nothing to do.
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Forbidden." }, { status: 400 });
  }

  // Raw body MUST be read before any other parsing.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sentenceId = session.metadata?.sentence_id;
        // Only activate when payment is confirmed.
        if (sentenceId && session.payment_status === "paid") {
          await markLive(supabase, sentenceId, event.id);
        }
        break;
      }
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const sentenceId = intent.metadata?.sentence_id;
        if (sentenceId) {
          await markLive(supabase, sentenceId, event.id);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const obj = event.data.object as
          | Stripe.Checkout.Session
          | Stripe.PaymentIntent;
        const sentenceId = obj.metadata?.sentence_id;
        if (sentenceId) {
          await discard(supabase, sentenceId, event.id);
        }
        break;
      }
      default:
        // Silently ignore unhandled event types.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    // Return 500 so Stripe retries — our handlers are idempotent.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  // Always return 200 promptly so Stripe doesn't retry unnecessarily.
  return NextResponse.json({ received: true });
}

/**
 * Flip status to 'live'. Idempotent: the `.eq("status", "pending")` filter
 * means a second delivery of the same event matches nothing and is a safe no-op.
 */
async function markLive(
  supabase: ReturnType<typeof getServiceClient>,
  sentenceId: string,
  eventId: string,
) {
  const { error } = await supabase
    .from(SENTENCES_TABLE)
    .update({ status: "live" })
    .eq("id", sentenceId)
    .eq("status", "pending"); // idempotency guard
  if (error) {
    console.error(`[stripe webhook] markLive failed (event ${eventId}):`, error);
  }
}

/**
 * Delete the pending row. Idempotent: if already deleted, the filter matches
 * nothing.
 */
async function discard(
  supabase: ReturnType<typeof getServiceClient>,
  sentenceId: string,
  eventId: string,
) {
  const { error } = await supabase
    .from(SENTENCES_TABLE)
    .delete()
    .eq("id", sentenceId)
    .eq("status", "pending"); // idempotency guard
  if (error) {
    console.error(`[stripe webhook] discard failed (event ${eventId}):`, error);
  }
}
