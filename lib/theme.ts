import { DEFAULT_SETTINGS, type Settings } from "@/types";

const STORAGE_KEY = "osaat:settings:v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode errors
  }
}

export function applyThemeToDocument(settings: Settings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.textSize = settings.textSize;
  root.dataset.spacing = settings.spacing;
  root.dataset.numbers = settings.numbers;
  root.dataset.authors = settings.authors;
  root.dataset.chapters = settings.chapters;
  root.dataset.focus = settings.focusMode;
}
