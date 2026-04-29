import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Lora"', "Georgia", "serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"Courier Prime"', '"Courier New"', "monospace"],
      },
      colors: {
        // Manuscript palette
        manuscript: {
          bg: "#faf8f3",
          text: "#2a2217",
          muted: "#6a5f50",
          numbers: "#a89880",
          divider: "#d6cfc0",
          chapter: "#8a7e6a",
        },
        // Typewriter palette
        typewriter: {
          bg: "#0f0f0f",
          text: "#e8e8e8",
          muted: "#666666",
          numbers: "#444444",
          rule: "#1e1e1e",
          accent: "#2e2e2e",
        },
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        blink: {
          "0%, 50%": { opacity: "1" },
          "50.01%, 100%": { opacity: "0" },
        },
        flashHighlight: {
          "0%": { backgroundColor: "rgba(168, 152, 128, 0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        blink: "blink 1.1s steps(1) infinite",
        "flash-highlight": "flashHighlight 2.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
