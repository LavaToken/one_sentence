import { supabase } from "@/lib/supabase";
import { getServiceClient } from "@/lib/supabase-admin";
import type { Sentence } from "@/types";

export const SENTENCES_TABLE = "sentences";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Fetch every visible (live or removed) sentence ordered by order_index. Used
 * by the SSR/ISR render of the main page. Removed sentences stay in the feed
 * with a placeholder so the order_index stays continuous.
 */
export async function fetchVisibleSentences(): Promise<Sentence[]> {
  if (!isConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[fetchVisibleSentences] Supabase not configured; returning [].");
    }
    return [];
  }
  try {
    const { data, error } = await supabase
      .from(SENTENCES_TABLE)
      .select("*")
      .in("status", ["live", "removed"])
      .order("order_index", { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[fetchVisibleSentences]", error);
      return [];
    }
    return (data ?? []) as Sentence[];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[fetchVisibleSentences] unexpected:", err);
    return [];
  }
}

/**
 * Fetch a single sentence by order_index (live or removed). Returns null if
 * not found, on error, or when Supabase isn't configured.
 */
export async function fetchSentenceByOrder(
  orderIndex: number,
): Promise<Sentence | null> {
  if (!isConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from(SENTENCES_TABLE)
      .select("*")
      .eq("order_index", orderIndex)
      .in("status", ["live", "removed"])
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[fetchSentenceByOrder]", error);
      return null;
    }
    return (data as Sentence | null) ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[fetchSentenceByOrder] unexpected:", err);
    return null;
  }
}

/**
 * Server-side: highest existing order_index across ALL rows. Used to allocate
 * the next slot when a paid checkout starts.
 */
export async function fetchMaxOrderIndex(): Promise<number> {
  const client = getServiceClient();
  const { data, error } = await client
    .from(SENTENCES_TABLE)
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read max order_index: ${error.message}`);
  }
  return data?.order_index ?? 0;
}
