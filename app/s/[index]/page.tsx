import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoryFeed from "@/components/StoryFeed";
import { fetchSentenceByOrder, fetchVisibleSentences } from "@/lib/queries";

// Same ISR window as the main page so deep-linked sentences stay current.
export const revalidate = 60;

interface PageProps {
  params: { index: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const orderIndex = Number.parseInt(params.index, 10);
  if (!Number.isFinite(orderIndex) || orderIndex < 1) {
    return { title: "Sentence — One Sentence at a Time" };
  }
  const sentence = await fetchSentenceByOrder(orderIndex);
  const baseTitle = `Sentence #${orderIndex.toLocaleString()} of the infinite story`;
  const description =
    sentence?.status === "live"
      ? sentence.text
      : sentence?.status === "removed"
        ? "[This sentence has been removed.]"
        : "A collaborative, ever-growing story. One sentence at a time.";

  return {
    title: baseTitle,
    description,
    openGraph: {
      title: baseTitle,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: baseTitle,
      description,
    },
  };
}

export default async function SentencePage({ params }: PageProps) {
  const orderIndex = Number.parseInt(params.index, 10);
  if (!Number.isFinite(orderIndex) || orderIndex < 1) {
    notFound();
  }

  const [sentence, allSentences] = await Promise.all([
    fetchSentenceByOrder(orderIndex),
    fetchVisibleSentences(),
  ]);

  // If the sentence isn't visible yet, still render the feed but don't 404.
  // Webhooks may take a beat after Stripe redirects users back.
  return (
    <>
      <StoryFeed
        initialSentences={allSentences}
        highlightOrderIndex={orderIndex}
      />
      {sentence?.status === "live" ? (
        <ShareNudge orderIndex={orderIndex} />
      ) : null}
    </>
  );
}

function ShareNudge({ orderIndex }: { orderIndex: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <p
        className="meta-label pointer-events-auto rounded-full px-4 py-2 text-xs"
        style={{
          background: "var(--panel-bg)",
          color: "var(--muted)",
          border: "1px solid var(--divider)",
        }}
      >
        I wrote sentence #{orderIndex.toLocaleString()}. Add the next one.
      </p>
    </div>
  );
}
