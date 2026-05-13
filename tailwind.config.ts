import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Neutral palette
        ink: {
          DEFAULT: "#0A0A0A",
          900: "#171717",
          700: "#404040",
          500: "#737373",
          400: "#A3A3A3",
          300: "#D4D4D4",
          200: "#E5E5E5",
          100: "#F5F5F5",
          50: "#FAFAFA",
        },
        // Single accent — muted forest green
        accent: {
          DEFAULT: "#1F3D2B",
          600: "#284E37",
          500: "#355F44",
          100: "#E8EFEA",
          50: "#F2F6F3",
        },
        // Semantic
        positive: "#1F3D2B",
        negative: "#9B3A2E",
        warning: "#8A6D3B",
      },
      fontSize: {
        // refined scale
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(10,10,10,0.04)",
        card: "0 1px 0 0 rgba(10,10,10,0.04), 0 0 0 1px rgba(10,10,10,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 240ms ease-out",
        "slide-up": "slideUp 320ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
