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
        dark: {
          DEFAULT: "#0B0E14",
          50: "#1A2234",
          100: "#161D2C",
          200: "#121724",
          300: "#0E121C",
          400: "#0B0E14",
          surface: "#121622",
          elevated: "#181F30",
          border: "#232B42",
          hover: "#1D253A",
        },
        brand: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          light: "#818CF8",
          dim: "rgba(99, 102, 241, 0.15)",
        },
        accent: {
          DEFAULT: "#EC4899",
          hover: "#DB2777",
          dim: "rgba(236, 72, 153, 0.15)",
        },
        amber: {
          gold: "#F59E0B",
          dim: "rgba(245, 158, 11, 0.15)",
        },
        emerald: {
          online: "#10B981",
          dim: "rgba(16, 185, 129, 0.15)",
        },
        // Backward-compatibility aliases so existing modules compile safely
        void: "#0B0E14",
        sanctum: {
          DEFAULT: "#121622",
          card: "#121622",
          border: "#232B42",
          hover: "#1D253A",
        },
        sindoor: {
          DEFAULT: "#6366F1",
          glow: "#818CF8",
          dark: "#4F46E5",
          dim: "rgba(99, 102, 241, 0.15)",
        },
        gada: {
          DEFAULT: "#818CF8",
          bright: "#A5B4FC",
          dark: "#6366F1",
          dim: "rgba(99, 102, 241, 0.15)",
        },
        prana: {
          DEFAULT: "#10B981",
          glow: "#34D399",
          dim: "rgba(16, 185, 129, 0.15)",
        },
        ashram: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          dark: "#64748B",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        mythic: ["'Inter'", "system-ui", "sans-serif"],
        hud: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 10px 25px -3px rgba(99, 102, 241, 0.25)",
        glow: "0 0 20px rgba(99, 102, 241, 0.35)",
        "sindoor-neon": "0 0 15px rgba(99, 102, 241, 0.4)",
        "gada-gold": "0 0 15px rgba(99, 102, 241, 0.3)",
        "prana-cyan": "0 0 12px rgba(16, 185, 129, 0.3)",
        "hud-glow": "0 0 20px rgba(99, 102, 241, 0.2)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
