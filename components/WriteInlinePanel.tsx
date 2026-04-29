"use client";

import { useMemo, useState } from "react";
import type { Sentence, SentenceStyle } from "@/types";
import { PRICE_CENTS } from "@/types";

interface WriteInlinePanelProps {
  nextSentenceNumber: number;
  context: Sentence[];
  sentenceText: string;
  onClose: () => void;
}

const MAX_LEN = 280;

export default function WriteInlinePanel({
  nextSentenceNumber,
  context,
  sentenceText,
  onClose,
}: WriteInlinePanelProps) {
  const [textTouched, setTextTouched] = useState(false);
  const [author, setAuthor] = useState("");
  const [style, setStyle] = useState<SentenceStyle>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = sentenceText.trim();
  const remaining = MAX_LEN - trimmed.length;
  const overLimit = remaining < 0;
  const empty = trimmed.length === 0;

  const priceCents = PRICE_CENTS[style];
  const priceLabel = useMemo(() => {
    return `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`;
  }, [priceCents]);

  async function handleSubmit() {
    setTextTouched(true);
    if (submitting || empty || overLimit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          author: author.trim() || null,
          style,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Could not start checkout.");
      }

      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="overflow-hidden border border-solid"
      style={{
        borderColor: "var(--divider)",
        background: "var(--bg)",
        borderRadius: "var(--radius)",
        marginBottom: "var(--row-gap)",
      }}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div>
          <p
            className="meta-label text-xs"
            style={{ color: "var(--muted)" }}
          >
            almost there
          </p>
          <h2
            className="mt-1 text-lg sm:text-xl"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text)",
            }}
          >
            Sentence #{nextSentenceNumber.toLocaleString()} — {priceLabel}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-2xl leading-none transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          ×
        </button>
      </div>

      <div
        style={{ borderTop: "1px solid var(--divider)" }}
        className="px-4 py-3"
      >
        {context.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="meta-label text-xs" style={{ color: "var(--muted)" }}>
              the story so far
            </p>
            {context.map((s) => (
              <p
                key={s.id}
                className="text-sm"
                style={{
                  color: "var(--muted)",
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.6,
                }}
              >
                <span
                  className="mr-2 tabular-nums"
                  style={{
                    fontFamily: "var(--font-numbers)",
                    color: "var(--numbers)",
                    fontSize: "0.72rem",
                  }}
                >
                  {String(s.order_index).padStart(3, "0")}
                </span>
                {s.text}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{ borderTop: "1px solid var(--divider)" }}
        className="px-4 py-3"
      >
        <div className="flex flex-col gap-3">
          <input
            className="author-input"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value.slice(0, 50))}
            placeholder="Your name or handle (optional)"
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span
              className="meta-label mr-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              style
            </span>
            <StylePill
              active={style === "normal"}
              onClick={() => setStyle("normal")}
              label="Normal"
              price="$1"
            />
            <StylePill
              active={style === "bold"}
              onClick={() => setStyle("bold")}
              label="Bold"
              price="$3"
              bold
            />
            <StylePill
              active={style === "italic"}
              onClick={() => setStyle("italic")}
              label="Italic"
              price="$3"
              italic
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span
              className="meta-label"
              style={{ color: overLimit ? "#c45a4a" : "var(--muted)" }}
            >
              {textTouched && (empty || overLimit)
                ? empty
                  ? "Type your sentence above."
                  : `${Math.abs(remaining)} over limit`
                : empty
                  ? "280 characters max"
                  : `${remaining} left`}
            </span>
            <span className="meta-label" style={{ color: "var(--muted)" }}>
              max {MAX_LEN}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Your sentence is permanent. No refunds once published.
            </p>
            <button
              type="button"
              className="cta"
              onClick={handleSubmit}
              disabled={submitting || empty || overLimit}
            >
              {submitting ? "Opening checkout…" : "Continue to payment →"}
            </button>
          </div>

          {error ? (
            <div className="text-xs" style={{ color: "#c45a4a" }}>
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StylePill({
  active,
  onClick,
  label,
  price,
  bold,
  italic,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  price: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      className="pill"
      aria-pressed={active}
      onClick={onClick}
      style={{
        fontWeight: bold ? 600 : undefined,
        fontStyle: italic ? "italic" : undefined,
      }}
    >
      {label} ({price})
    </button>
  );
}

