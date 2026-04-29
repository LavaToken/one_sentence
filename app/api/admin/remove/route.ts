import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { SENTENCES_TABLE } from "@/lib/queries";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

interface RemoveBody {
  secret?: string;
  order_index?: number;
  id?: string;
}

export async function POST(req: Request) {
  // 10 requests per IP per hour
  if (!rateLimit(getIp(req), "admin-remove", 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 },
    );
  }

  let body: RemoveBody;
  try {
    body = (await req.json()) as RemoveBody;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const expected = process.env.ADMIN_SECRET;
  const provided = typeof body.secret === "string" ? body.secret : "";

  // Always run the comparison (even when expected is empty) to avoid leaking
  // whether the env var is set at all via response timing.
  const authorized =
    !!expected &&
    provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!body.id && !body.order_index) {
    return NextResponse.json(
      { error: "Provide id or order_index." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const query = supabase
    .from(SENTENCES_TABLE)
    .update({ status: "removed" })
    .eq("status", "live");

  const final = body.id
    ? query.eq("id", body.id)
    : query.eq("order_index", Number(body.order_index));

  const { data, error } = await final.select("id, order_index").maybeSingle();

  if (error) {
    // Don't leak raw DB error messages
    console.error("[admin/remove] db error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "No matching live sentence found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, removed: data });
}
