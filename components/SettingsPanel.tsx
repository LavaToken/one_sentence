"use client";

import type { Settings } from "@/types";

type Row<K extends keyof Settings> = {
  key: K;
  label: string;
  options: ReadonlyArray<{ value: Settings[K]; label: string }>;
};

const ROWS: ReadonlyArray<Row<keyof Settings>> = [
  {
    key: "theme",
    label: "theme",
    options: [
      { value: "manuscript", label: "manuscript" },
      { value: "typewriter", label: "typewriter" },
    ],
  },
  {
    key: "textSize",
    label: "text size",
    options: [
      { value: "normal", label: "normal" },
      { value: "large", label: "large" },
    ],
  },
  {
    key: "spacing",
    label: "spacing",
    options: [
      { value: "normal", label: "normal" },
      { value: "relaxed", label: "relaxed" },
    ],
  },
  {
    key: "numbers",
    label: "numbers",
    options: [
      { value: "show", label: "show" },
      { value: "hide", label: "hide" },
    ],
  },
  {
    key: "authors",
    label: "authors",
    options: [
      { value: "show", label: "show" },
      { value: "hide", label: "hide" },
    ],
  },
  {
    key: "chapters",
    label: "chapters",
    options: [
      { value: "show", label: "show" },
      { value: "hide", label: "hide" },
    ],
  },
  {
    key: "focusMode",
    label: "focus mode",
    options: [
      { value: "on", label: "on" },
      { value: "off", label: "off" },
    ],
  },
] as const;

interface SettingsPanelProps {
  settings: Settings;
  onChange: (next: Settings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <div
      style={{
        background: "var(--panel-bg)",
        borderTop: "1px solid var(--divider)",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div className="mx-auto max-w-3xl px-5 py-4">
        <ul className="flex flex-col gap-2.5">
          {ROWS.map((row) => (
            <li key={row.key} className="flex items-center gap-3">
              <span
                className="meta-label w-24 flex-none text-xs"
                style={{ color: "var(--muted)" }}
              >
                {row.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {row.options.map((opt) => {
                  const active = settings[row.key] === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      className="pill"
                      aria-pressed={active}
                      onClick={() =>
                        onChange({
                          ...settings,
                          [row.key]: opt.value,
                        } as Settings)
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
