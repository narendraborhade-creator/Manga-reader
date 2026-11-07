import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#07060B",
        sanctum: {
          DEFAULT: "#110E1B",
          card: "rgba(17, 14, 27, 0.75)",
          border: "#231B38",
          hover: "#1A152A",
        },
        sindoor: {
          DEFAULT: "#FF3B00",
          glow: "#FF5500",
          dark: "#B82A00",
          dim: "rgba(255, 59, 0, 0.15)",
        },
        gada: {
          DEFAULT: "#FFB800",
          bright: "#FFD700",
          dark: "#B88600",
          dim: "rgba(255, 184, 0, 0.15)",
        },
        prana: {
          DEFAULT: "#00F0FF",
          glow: "#38F9D7",
          dim: "rgba(0, 240, 255, 0.15)",
        },
        ashram: {
          DEFAULT: "#F4EFE6",
          muted: "#9E96B0",
          dark: "#6B637F",
        },
      },
      fontFamily: {
        mythic: ["'Cinzel Decorative'", "Cinzel", "serif"],
        hud: ["'Rajdhani'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "sindoor-neon": "0 0 15px rgba(255, 59, 0, 0.45), inset 0 0 8px rgba(255, 59, 0, 0.2)",
        "gada-gold": "0 0 18px rgba(255, 184, 0, 0.35)",
        "prana-cyan": "0 0 12px rgba(0, 240, 255, 0.4)",
        "hud-glow": "0 0 25px rgba(255, 184, 0, 0.2), 0 0 10px rgba(255, 59, 0, 0.3)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 12s linear infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 8px rgba(255, 59, 0, 0.6))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 2px rgba(255, 59, 0, 0.3))" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
