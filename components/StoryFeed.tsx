"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Sentence } from "@/types";
import { CHAPTER_SIZE, DEFAULT_SETTINGS, type Settings } from "@/types";
import { applyThemeToDocument, loadSettings, saveSettings } from "@/lib/theme";
import { publicSupabaseConfigured, supabase } from "@/lib/supabase";
import TopBar from "./TopBar";
import SentenceRow from "./SentenceRow";
import ChapterDivider from "./ChapterDivider";
import InlineCompose from "./InlineCompose";
import WriteInlinePanel from "./WriteInlinePanel";

interface StoryFeedProps {
  initialSentences: Sentence[];
  highlightOrderIndex?: number | null;
}

export default function StoryFeed({
  initialSentences,
  highlightOrderIndex = null,
}: StoryFeedProps) {
  const [sentences, setSentences] = useState<Sentence[]>(initialSentences);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const seenIds = useRef<Set<string>>(new Set(initialSentences.map((s) => s.id)));

  // Load settings from localStorage after mount + apply to <html>
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applyThemeToDocument(loaded);
    setHydrated(true);
  }, []);

  // Persist + apply on every change
  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
    applyThemeToDocument(settings);
  }, [settings, hydrated]);

  // Realtime subscription: insert/update on `sentences` table
  useEffect(() => {
    if (!publicSupabaseConfigured) return;
    const channel = supabase
      .channel("sentences-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sentences" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Sentence | undefined;
          if (!row) return;

          if (payload.eventType === "DELETE") {
            setSentences((prev) => prev.filter((s) => s.id !== row.id));
            return;
          }

          // Only show live or removed (so people see the strikethrough message)
          if (row.status === "live" || row.status === "removed") {
            setSentences((prev) => mergeSentence(prev, row));
            if (!seenIds.current.has(row.id) && row.status === "live") {
              seenIds.current.add(row.id);
              setFreshIds((prev) => {
                const next = new Set(prev);
                next.add(row.id);
                return next;
              });
              // Clear fresh marker after animation finishes
              window.setTimeout(() => {
                setFreshIds((prev) => {
                  const next = new Set(prev);
                  next.delete(row.id);
                  return next;
                });
              }, 2600);
            }
          } else {
            // status='pending' or other — drop from view
            setSentences((prev) => prev.filter((s) => s.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const liveSentences = useMemo(
    () => sentences.filter((s) => s.status === "live" || s.status === "removed"),
    [sentences],
  );

  const liveCount = useMemo(
    () => sentences.filter((s) => s.status === "live").length,
    [sentences],
  );

  const lastLiveOrder = useMemo(() => {
    let max = 0;
    for (const s of sentences) {
      if (s.status === "live" && s.order_index > max) max = s.order_index;
    }
    return max;
  }, [sentences]);

  const nextSentenceNumber = lastLiveOrder + 1;

  const lastThree = useMemo(
    () =>
      sentences
        .filter((s) => s.status === "live")
        .sort((a, b) => a.order_index - b.order_index)
        .slice(-3),
    [sentences],
  );

  const latestId = useMemo(() => {
    const live = sentences.filter((s) => s.status === "live");
    if (!live.length) return null;
    return live.reduce((acc, s) => (s.order_index > acc.order_index ? s : acc)).id;
  }, [sentences]);

  return (
    <>
      <TopBar
        count={liveCount}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-10 sm:pt-14">
        <section className="story-block">
          {liveSentences.map((sentence, idx) => {
            const prev = liveSentences[idx - 1];
            const showChapterBreak =
              sentence.status === "live" &&
              sentence.order_index > 1 &&
              (sentence.order_index - 1) % CHAPTER_SIZE === 0 &&
              (!prev || prev.order_index < sentence.order_index);

            return (
              <div key={sentence.id}>
                {showChapterBreak ? (
                  <ChapterDivider orderIndex={sentence.order_index} />
                ) : null}
                <SentenceRow
                  sentence={sentence}
                  isLatest={sentence.id === latestId}
                  isFresh={freshIds.has(sentence.id)}
                  isDeepLink={
                    highlightOrderIndex != null &&
                    sentence.order_index === highlightOrderIndex
                  }
                />
              </div>
            );
          })}

          <InlineCompose
            nextSentenceNumber={nextSentenceNumber}
            value={composeText}
            onChange={(next) => setComposeText(next)}
            onContinue={() => setPromptOpen(true)}
          />

          <div
            className={[
              "transition-all duration-200 ease-out",
              promptOpen
                ? "opacity-100 translate-y-0 max-h-[900px]"
                : "opacity-0 translate-y-1 max-h-0",
            ].join(" ")}
            style={{ pointerEvents: promptOpen ? "auto" : "none" }}
            aria-hidden={!promptOpen}
          >
            <WriteInlinePanel
              nextSentenceNumber={nextSentenceNumber}
              context={lastThree}
              sentenceText={composeText}
              onClose={() => setPromptOpen(false)}
            />
          </div>
        </section>
      </main>

      <Footer count={liveCount} />
    </>
  );
}

function mergeSentence(prev: Sentence[], row: Sentence): Sentence[] {
  const idx = prev.findIndex((s) => s.id === row.id);
  let next: Sentence[];
  if (idx === -1) {
    next = [...prev, row];
  } else {
    next = [...prev];
    next[idx] = row;
  }
  next.sort((a, b) => a.order_index - b.order_index);
  return next;
}

function Footer({ count }: { count: number }) {
  const { roman } = useCurrentChapter(count);
  return (
    <footer
      className="mx-auto max-w-3xl px-5 py-10"
      style={{ borderTop: "1px solid var(--divider)", color: "var(--muted)" }}
    >
      <div className="meta-label flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>
          Built by{" "}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            the author
          </a>{" "}
          · <a href="/terms">Terms</a> ·{" "}
          <a href="mailto:hello@example.com">Contact</a>
        </p>
        <p>
          Chapter {roman} · {count.toLocaleString()} sentences
        </p>
      </div>
    </footer>
  );
}

function useCurrentChapter(count: number) {
  return useMemo(() => {
    if (count <= 0) return { roman: "I" } as const;
    const number = Math.floor((count - 1) / CHAPTER_SIZE) + 1;
    return { roman: toRoman(number) } as const;
  }, [count]);
}

function toRoman(num: number): string {
  const map: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}
