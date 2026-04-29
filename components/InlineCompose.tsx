"use client";

import { useRef, useState } from "react";

const MAX_LEN = 280;

interface InlineComposeProps {
  nextSentenceNumber: number;
  value: string;
  onChange: (next: string) => void;
  onContinue: () => void;
}

export default function InlineCompose({
  nextSentenceNumber,
  value,
  onChange,
  onContinue,
}: InlineComposeProps) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_LEN - value.length;
  const overLimit = remaining < 0;
  const hasText = value.trim().length > 0;
  const active = focused || hasText;

  function handleContinue() {
    if (!hasText || overLimit) return;
    onContinue();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleContinue();
    }
  }

  return (
    <div
      className="sentence-row group flex gap-4 sm:gap-6"
      style={{ marginBottom: "0.75rem" }}
    >
      {/* Number gutter — same width as SentenceRow */}
      <button
        type="button"
        aria-label={`Write sentence ${nextSentenceNumber}`}
        onClick={() => textareaRef.current?.focus()}
        className="sentence-number block flex-none select-none pt-[0.2em] text-right tabular-nums no-underline cursor-text"
        style={{
          color: "var(--numbers)",
          fontFamily: "var(--font-numbers)",
          fontSize: "0.78rem",
          width: "3.25rem",
          opacity: active ? 1 : 0.5,
          transition: "opacity 200ms ease",
        }}
        tabIndex={-1}
      >
        {String(nextSentenceNumber).padStart(3, "0")}
      </button>

      <div className="min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Continue the story…"
          rows={active ? 3 : 1}
          maxLength={MAX_LEN + 40}
          style={{
            background: "transparent",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--body-size, 1.0625rem)",
            lineHeight: "var(--body-line, 1.75)",
            border: "none",
            outline: "none",
            resize: "none",
            width: "100%",
            padding: 0,
            transition: "rows 150ms ease",
            /* Placeholder styling handled by CSS below */
          }}
          className="inline-compose-textarea"
        />

        {/* Controls — only shown when active */}
        {active ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <span
              className="meta-label text-xs"
              style={{ color: overLimit ? "#c45a4a" : "var(--muted)" }}
            >
              {overLimit
                ? `${Math.abs(remaining)} over limit`
                : `${remaining} left · ⌘↵ to continue`}
            </span>
            <button
              type="button"
              className="cta"
              onClick={handleContinue}
              disabled={!hasText || overLimit}
              style={{ padding: "0.45rem 1rem", fontSize: "0.88rem" }}
            >
              Continue →
            </button>
          </div>
        ) : (
          <p
            className="meta-label mt-1 text-xs"
            style={{ color: "var(--muted)" }}
            aria-hidden
          >
            — your name here
          </p>
        )}
      </div>
    </div>
  );
}
