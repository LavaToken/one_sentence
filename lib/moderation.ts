// Lightweight, intentionally conservative blocklist. The goal is to stop the
// most obvious abuse before money changes hands; the owner has a final
// removal lever via /api/admin/remove. Expand as needed.

const RAW_BLOCKED: string[] = [
  // slurs / hate (sample - extend as you see real abuse)
  "n1gger",
  "n!gger",
  "f4ggot",
  "tr4nny",
  // explicit / sexual content
  "porn",
  "xxx ",
  // self-harm / violence triggers - keep minimal, prefer manual review
  "kys",
  "kill yourself",
];

const URL_RE = /(https?:\/\/|www\.)\S+/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;

export interface ModerationResult {
  ok: boolean;
  reason?: string;
}

export function moderateSentence(text: string, author: string | null): ModerationResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "Sentence is empty." };
  if (trimmed.length > 280) {
    return { ok: false, reason: "Sentence exceeds 280 characters." };
  }

  const haystack = `${trimmed} ${author ?? ""}`.toLowerCase();

  for (const word of RAW_BLOCKED) {
    if (haystack.includes(word.toLowerCase())) {
      return { ok: false, reason: "Sentence contains disallowed content." };
    }
  }

  if (URL_RE.test(trimmed)) {
    return { ok: false, reason: "Links are not allowed in sentences." };
  }
  if (EMAIL_RE.test(trimmed)) {
    return { ok: false, reason: "Email addresses are not allowed." };
  }

  // Reject all-caps spam (>= 12 chars, fully uppercase letters)
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 12 && letters === letters.toUpperCase()) {
    return { ok: false, reason: "Please don't write entirely in capital letters." };
  }

  return { ok: true };
}
