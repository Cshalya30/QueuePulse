import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#111214",
        surface: {
          1: "#17191c",
          2: "#1d2024",
          3: "#24282d",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          strong: "rgba(255, 255, 255, 0.16)",
        },
        text: {
          primary: "#f2f3f0",
          secondary: "#a3a8ad",
          tertiary: "#6f767d",
        },
        accent: {
          live: "#b8ef79",
          info: "#7cc8ff",
          warning: "#e8b35c",
          critical: "#ef7777",
          neutral: "#a6aeb8",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beam-scan": "beamScan 2s ease-in-out infinite",
        "packet-flow": "packetFlow 2s linear infinite",
      },
      keyframes: {
        beamScan: {
          "0%, 100%": { opacity: "0.4", transform: "scaleX(0.95)" },
          "50%": { opacity: "1", transform: "scaleX(1.05)" },
        },
        packetFlow: {
          "0%": { offsetDistance: "0%" },
          "100%": { offsetDistance: "100%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
