import type { Metadata } from "next";
import { Lora, Playfair_Display, Courier_Prime } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "One Sentence at a Time",
  description:
    "A collaborative, ever-growing story. Anyone can pay $1 to permanently add the next sentence.",
  openGraph: {
    title: "One Sentence at a Time",
    description:
      "A collaborative, ever-growing story. Anyone can pay $1 to permanently add the next sentence.",
    url: siteUrl,
    siteName: "One Sentence at a Time",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "One Sentence at a Time",
    description:
      "A collaborative, ever-growing story. Anyone can pay $1 to permanently add the next sentence.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="manuscript"
      data-text-size="normal"
      data-spacing="normal"
      data-numbers="show"
      data-authors="show"
      data-chapters="show"
      data-focus="off"
      className={`${lora.variable} ${playfair.variable} ${courier.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
