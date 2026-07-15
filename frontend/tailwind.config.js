/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00ffef",
          50: "#e6fffd",
          100: "#b3fffa",
          200: "#80fff6",
          300: "#4dfff2",
          400: "#1affee",
          500: "#00ffef",
          600: "#00ccbf",
          700: "#00998f",
          800: "#00665f",
          900: "#003330",
        },
        surface: {
          DEFAULT: "#0f172a",
          alt: "#111827",
          raised: "#1e293b",
        },
        accent: {
          cyan: "#06b6d4",
          teal: "#14b8a6",
          sky: "#0ea5e9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 255, 239, 0.25)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-up": { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
