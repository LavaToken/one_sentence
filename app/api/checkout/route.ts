import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
import { moderateSentence } from "@/lib/moderation";
import { type SentenceStyle } from "@/types";
import { fetchMaxOrderIndex, SENTENCES_TABLE } from "@/lib/queries";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Price is ALWAYS server-derived. The client cannot influence the amount.
const STYLE_PRICES: Record<SentenceStyle, number> = {
  normal: 100,  // $1.00
  bold: 300,    // $3.00
  italic: 300,  // $3.00
};

const VALID_STYLES = new Set<SentenceStyle>(["normal", "bold", "italic"]);

interface CheckoutBody {
  text?: unknown;
  author?: unknown;
  style?: unknown;
}

export async function POST(req: Request) {
  // 5 requests per IP per 10 minutes
  if (!rateLimit(getIp(req), "checkout", 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // --- text ---
  if (typeof body.text !== "string") {
    return NextResponse.json({ error: "text must be a string." }, { status: 400 });
  }
  const text = body.text.trim();
  if (text.length === 0) {
    return NextResponse.json({ error: "Sentence cannot be empty." }, { status: 400 });
  }
  if (text.length > 280) {
    return NextResponse.json(
      { error: "Sentence exceeds 280 characters." },
      { status: 400 },
    );
  }

  // --- author ---
  let author: string | null = null;
  if (body.author != null) {
    if (typeof body.author !== "string") {
      return NextResponse.json(
        { error: "author must be a string or null." },
        { status: 400 },
      );
    }
    const trimmedAuthor = body.author.trim().slice(0, 50);
    author = trimmedAuthor.length > 0 ? trimmedAuthor : null;
  }

  // --- style ---
  const style: SentenceStyle = VALID_STYLES.has(body.style as SentenceStyle)
    ? (body.style as SentenceStyle)
    : "normal";

  // --- moderation ---
  const moderation = moderateSentence(text, author);
  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.reason }, { status: 400 });
  }

  // Price is fully server-derived — no client input accepted.
  const amountCents = STYLE_PRICES[style];

  const supabase = getServiceClient();

  // Allocate next order_index. Race-safe via UNIQUE constraint + retry.
  let orderIndex = (await fetchMaxOrderIndex()) + 1;
  let inserted: { id: string; order_index: number } | null = null;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase
      .from(SENTENCES_TABLE)
      .insert({
        order_index: orderIndex,
        text,
        author,
        style,
        paid_amount: amountCents,
        status: "pending",
      })
      .select("id, order_index")
      .single();

    if (!error && data) {
      inserted = data;
      break;
    }

    lastErr = error;
    // 23505 = unique_violation in Postgres — another request won the race
    if (error?.code === "23505") {
      orderIndex = (await fetchMaxOrderIndex()) + 1;
      continue;
    }
    break;
  }

  if (!inserted) {
    console.error("[/api/checkout] insert failed:", lastErr);
    return NextResponse.json(
      { error: "Could not reserve a slot. Please try again." },
      { status: 500 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Sentence #${inserted.order_index} — ${labelForStyle(style)}`,
              description:
                text.length > 200 ? `${text.slice(0, 197)}...` : text,
            },
          },
        },
      ],
      metadata: {
        sentence_id: inserted.id,
        order_index: String(inserted.order_index),
        style,
      },
      payment_intent_data: {
        metadata: {
          sentence_id: inserted.id,
          order_index: String(inserted.order_index),
          style,
        },
      },
      success_url: `${siteUrl}/s/${inserted.order_index}?fresh=1`,
      cancel_url: `${siteUrl}/?canceled=1`,
      allow_promotion_codes: false,
    });
  } catch (stripeErr) {
    // Roll back the pending row so the slot is freed.
    await supabase.from(SENTENCES_TABLE).delete().eq("id", inserted.id);
    console.error("[/api/checkout] Stripe session create failed:", stripeErr);
    return NextResponse.json(
      { error: "Could not create payment session. Please try again." },
      { status: 500 },
    );
  }

  if (!session.url) {
    await supabase.from(SENTENCES_TABLE).delete().eq("id", inserted.id);
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}

function labelForStyle(style: SentenceStyle): string {
  if (style === "bold") return "Bold";
  if (style === "italic") return "Italic";
  return "Normal";
}
