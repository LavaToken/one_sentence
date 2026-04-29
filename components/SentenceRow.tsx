import type { Sentence } from "@/types";

interface SentenceRowProps {
  sentence: Sentence;
  isLatest?: boolean;
  isFresh?: boolean;
  isDeepLink?: boolean;
}

export default function SentenceRow({
  sentence,
  isLatest = false,
  isFresh = false,
  isDeepLink = false,
}: SentenceRowProps) {
  const removed = sentence.status === "removed";
  const author = sentence.author?.trim() ? sentence.author : "anonymous";

  const styleClass =
    sentence.style === "bold"
      ? "font-semibold"
      : sentence.style === "italic"
        ? "italic"
        : "";

  return (
    <article
      id={`s-${sentence.order_index}`}
      className={[
        "sentence-row group flex gap-4 sm:gap-6",
        isLatest ? "is-latest" : "",
        isFresh ? "is-fresh" : "",
        isDeepLink ? "is-deep-link" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        marginBottom: "var(--row-gap)",
      }}
    >
      <a
        href={`/s/${sentence.order_index}`}
        className="sentence-number block flex-none select-none pt-[0.2em] text-right tabular-nums no-underline"
        style={{
          color: "var(--numbers)",
          fontFamily: "var(--font-numbers)",
          fontSize: "0.78rem",
          width: "3.25rem",
        }}
        aria-label={`Sentence ${sentence.order_index}`}
      >
        {String(sentence.order_index).padStart(3, "0")}
      </a>

      <div className="min-w-0 flex-1">
        <p
          className={`break-words ${styleClass}`}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--body-size, 1.0625rem)",
            lineHeight: "var(--body-line, 1.75)",
            color: removed ? "var(--muted)" : "var(--text)",
            fontStyle: removed ? "italic" : undefined,
          }}
        >
          {removed ? "[This sentence has been removed.]" : sentence.text}
          {isLatest ? <span className="cursor-blink-marker" aria-hidden /> : null}
        </p>
        <p
          className="sentence-author meta-label mt-1 text-xs"
          style={{ color: "var(--muted)" }}
        >
          — {author}
        </p>
      </div>
    </article>
  );
}
