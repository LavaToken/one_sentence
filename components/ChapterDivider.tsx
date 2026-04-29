import { chapterFor } from "@/types";

interface ChapterDividerProps {
  orderIndex: number;
}

export default function ChapterDivider({ orderIndex }: ChapterDividerProps) {
  const { roman, title } = chapterFor(orderIndex);
  return (
    <div className="chapter-divider my-12 flex flex-col items-center gap-2">
      <div
        aria-hidden
        className="h-px w-24"
        style={{ background: "var(--divider)" }}
      />
      <p
        className="text-center italic"
        style={{
          color: "var(--chapter)",
          fontFamily: "var(--font-display)",
          fontSize: "1.05rem",
          letterSpacing: "0.04em",
        }}
      >
        Chapter {roman} — {title}
      </p>
      <div
        aria-hidden
        className="h-px w-24"
        style={{ background: "var(--divider)" }}
      />
    </div>
  );
}
