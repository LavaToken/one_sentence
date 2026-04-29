import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p
        className="meta-label text-xs"
        style={{ color: "var(--muted)" }}
      >
        404
      </p>
      <h1
        className="text-2xl"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text)",
        }}
      >
        That page hasn&rsquo;t been written yet.
      </h1>
      <Link href="/" className="cta">
        Back to the story
      </Link>
    </main>
  );
}
