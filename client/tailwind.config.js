/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8faf8",
          100: "#f0f4f0",
          200: "#e2eae2",
          700: "#0d1a2a",
          800: "#0a1628",
          900: "#060d1a",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-up":   "fadeUp 0.4s ease forwards",
        "scan-line": "scanLine 2s ease-in-out infinite",
        "pulse-ring":"pulseRing 1.5s ease-out infinite",
      },
      keyframes: {
        fadeUp:    { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        scanLine:  { "0%,100%": { top: "10%" }, "50%": { top: "85%" } },
        pulseRing: { "0%": { transform: "scale(1)", opacity: 0.6 }, "100%": { transform: "scale(1.6)", opacity: 0 } },
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};
