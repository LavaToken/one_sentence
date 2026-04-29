export type SentenceStyle = "normal" | "bold" | "italic";
export type SentenceStatus = "pending" | "live" | "removed";

export interface Sentence {
  id: string;
  order_index: number;
  text: string;
  author: string | null;
  style: SentenceStyle;
  paid_amount: number;
  status: SentenceStatus;
  created_at: string;
}

export type Theme = "manuscript" | "typewriter";
export type TextSize = "normal" | "large";
export type Spacing = "normal" | "relaxed";
export type Toggle = "show" | "hide";
export type OnOff = "on" | "off";

export interface Settings {
  theme: Theme;
  textSize: TextSize;
  spacing: Spacing;
  numbers: Toggle;
  authors: Toggle;
  chapters: Toggle;
  focusMode: OnOff;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "manuscript",
  textSize: "normal",
  spacing: "normal",
  numbers: "show",
  authors: "show",
  chapters: "show",
  focusMode: "off",
};

export const PRICE_CENTS: Record<SentenceStyle, number> = {
  normal: 100,
  bold: 300,
  italic: 300,
};

export const CHAPTER_SIZE = 500;

export const CHAPTER_TITLES: string[] = [
  "The Map",
  "The Road",
  "The River",
  "The Mountain",
  "The Door",
  "The Library",
  "The Storm",
  "The Garden",
  "The Tower",
  "The Sea",
  "The City",
  "The Mirror",
  "The Forest",
  "The Star",
  "The Last Page",
];

export function chapterFor(orderIndex: number): {
  number: number;
  roman: string;
  title: string;
} {
  const number = Math.floor((orderIndex - 1) / CHAPTER_SIZE) + 1;
  const title = CHAPTER_TITLES[(number - 1) % CHAPTER_TITLES.length];
  return { number, roman: toRoman(number), title };
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
