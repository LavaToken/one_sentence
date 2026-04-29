import StoryFeed from "@/components/StoryFeed";
import { fetchVisibleSentences } from "@/lib/queries";

// ISR: regenerate every 60s. Realtime subscription handles client-side updates
// in between revalidations so the feed always feels fresh.
export const revalidate = 60;

export default async function Page() {
  const sentences = await fetchVisibleSentences();
  return <StoryFeed initialSentences={sentences} />;
}
