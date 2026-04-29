"use client";

import { useState } from "react";
import SettingsPanel from "./SettingsPanel";
import type { Settings } from "@/types";

interface TopBarProps {
  count: number;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
}

export default function TopBar({ count, settings, onSettingsChange }: TopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <h1
          className="text-lg sm:text-xl"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text)",
            letterSpacing: "0.005em",
          }}
        >
          One Sentence at a Time
        </h1>

        <div className="flex items-center gap-4">
          <div className="meta-label flex items-center gap-2 text-sm">
            <span className="live-dot" aria-hidden />
            <span>
              {count.toLocaleString()} {count === 1 ? "sentence" : "sentences"}
            </span>
          </div>
          <button
            type="button"
            aria-label="Settings"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            <CogIcon />
          </button>
        </div>
      </div>

      {open ? (
        <SettingsPanel settings={settings} onChange={onSettingsChange} />
      ) : null}
    </header>
  );
}

function CogIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
