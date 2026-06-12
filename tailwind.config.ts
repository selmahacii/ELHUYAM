import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory:       "#FFFFF0",
        beige:       "#F5F0E8",
        sand:        "#E8D5B7",
        taupe:       "#B8A99A",
        nude:        "#D4B5A0",
        "matte-black": "#1A1A1A",
        "warm-white":  "#FAF9F6",
        "soft-gold":   "#C9A96E",

        /* Islamic identity palette */
        emerald: {
          50:  "#EDFAF3",
          100: "#D1F4E3",
          200: "#A3E7C7",
          300: "#6DD4A9",
          400: "#40BD8C",
          500: "#1E9B6E",
          600: "#167856",
          700: "#0E5740",
          800: "#083A2C",
          900: "#031E17",
        },
        gold: {
          50:  "#FDF8ED",
          100: "#FAEDCC",
          200: "#F5D899",
          300: "#EFBF62",
          400: "#E8A830",
          500: "#C9A96E",
          600: "#A88244",
          700: "#7A5C2B",
          800: "#503B18",
          900: "#2A1E08",
        },

        brand: {
          50:  "#FAF9F6",
          100: "#F5F0E8",
          200: "#EDE4D3",
          300: "#E0D0B8",
          400: "#D4B5A0",
          500: "#C9A96E",
          600: "#B8956A",
          700: "#9A7A52",
          800: "#7A5C38",
          900: "#4A3520",
        },

        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card:        { DEFAULT: "hsl(var(--card))",    foreground: "hsl(var(--card-foreground))" },
        popover:     { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary:     { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))",   foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))",  foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
      },

      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body:    ["var(--font-body)",    "sans-serif"],
        mono:    ["var(--font-mono)",    "monospace"],
        arabic:  ["var(--font-arabic)", "'Cairo'", "sans-serif"],
        amiri:   ["var(--font-amiri)", "'Amiri'", "serif"],
      },

      backgroundImage: {
        "arabesque":   "url('/patterns/arabesque.svg')",
        "star-of-8":   "url('/patterns/star-8.svg')",
        "gold-gradient": "linear-gradient(135deg, #C9A96E 0%, #E8C87A 50%, #A8894E 100%)",
        "hero-overlay":  "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.55) 100%)",
      },

      animation: {
        "fade-in":        "fadeIn 0.7s ease-in-out both",
        "slide-up":       "slideUp 0.6s ease-out both",
        "slide-in-right": "slideInRight 0.4s ease-out",
        shimmer:          "shimmer 2s linear infinite",
        float:            "float 3s ease-in-out infinite",
        "spin-slow":      "spin-slow 12s linear infinite",
        "gold-shimmer":   "gold-shimmer 4s linear infinite",
        "pulse-ring":     "pulse-ring 1.5s ease-out infinite",
        marquee:          "marquee 30s linear infinite",
      },

      keyframes: {
        fadeIn:      { "0%": { opacity: "0" },    "100%": { opacity: "1" } },
        slideUp:     { "0%": { transform: "translateY(24px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideInRight:{ "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        shimmer:     { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float:       { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        "spin-slow": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "gold-shimmer": { "0%": { backgroundPosition: "0% center" }, "100%": { backgroundPosition: "200% center" } },
        "pulse-ring":   { "0%": { transform: "scale(1)", opacity: "0.5" }, "100%": { transform: "scale(1.5)", opacity: "0" } },
        marquee: { "0%": { transform: "translateX(0%)" }, "100%": { transform: "translateX(-50%)" } },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        "luxury":   "0 8px 32px rgba(74, 53, 32, 0.12), 0 2px 8px rgba(74, 53, 32, 0.06)",
        "luxury-lg":"0 16px 64px rgba(74, 53, 32, 0.16), 0 4px 16px rgba(74, 53, 32, 0.08)",
        "gold":     "0 4px 20px rgba(201, 169, 110, 0.35)",
        "inner-gold":"inset 0 1px 0 rgba(201, 169, 110, 0.3)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
