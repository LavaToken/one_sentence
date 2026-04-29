"use client";

import { useEffect, useRef, useState } from "react";
import type { Sentence, SentenceStyle } from "@/types";
import { PRICE_CENTS } from "@/types";

interface WriteModalProps {
  nextSentenceNumber: number;
  context: Sentence[];
  initialText?: string;
  onClose: () => void;
}

const MAX_LEN = 280;

export default function WriteModal({
  nextSentenceNumber,
  context,
  initialText = "",
  onClose,
}: WriteModalProps) {
  const [text, setText] = useState(initialText);
  const [author, setAuthor] = useState("");
  const [style, setStyle] = useState<SentenceStyle>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Autofocus
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const remaining = MAX_LEN - text.length;
  const overLimit = remaining < 0;
  const empty = text.trim().length === 0;
  const priceCents = PRICE_CENTS[style];
  const priceLabel = `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`;

  async function handleSubmit() {
    if (submitting || empty || overLimit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
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
      role="dialog"
      aria-modal="true"
      aria-label="Write the next sentence"
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card w-full max-w-xl overflow-hidden rounded-t-xl sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
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
              Sentence #{nextSentenceNumber.toLocaleString()} — $1
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
          className="px-5 py-4"
          style={{ borderTop: "1px solid var(--divider)" }}
        >
          {context.length > 0 ? (
            <div className="flex flex-col gap-2">
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
          ) : (
            <p
              className="text-sm italic"
              style={{ color: "var(--muted)" }}
            >
              You&rsquo;re writing the very first sentence.
            </p>
          )}
        </div>

        <div
          className="flex flex-col gap-3 px-5 py-4"
          style={{ borderTop: "1px solid var(--divider)" }}
        >
          <textarea
            ref={textareaRef}
            className="sentence-input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your sentence…"
            maxLength={MAX_LEN + 40}
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className="meta-label"
              style={{ color: overLimit ? "#c45a4a" : "var(--muted)" }}
            >
              {overLimit
                ? `${Math.abs(remaining)} over`
                : `${remaining} left`}
            </span>
            <span
              className="meta-label"
              style={{ color: "var(--muted)" }}
            >
              max {MAX_LEN}
            </span>
          </div>

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
        </div>

        <div
          className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "1px solid var(--divider)" }}
        >
          <p
            className="text-xs"
            style={{ color: "var(--muted)" }}
          >
            Your sentence is permanent. No refunds once published.
          </p>
          <button
            type="button"
            className="cta"
            onClick={handleSubmit}
            disabled={submitting || empty || overLimit}
          >
            {submitting
              ? "Opening checkout…"
              : `Continue to payment · ${priceLabel} →`}
          </button>
        </div>

        {error ? (
          <div
            className="px-5 pb-4 text-xs"
            style={{ color: "#c45a4a" }}
          >
            {error}
          </div>
        ) : null}
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
