/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          900: "#05060F",
          800: "#0B0D1E",
          700: "#131632",
          600: "#1C2050",
          500: "#2A2F72"
        },
        nebula: {
          500: "#6366F1",
          400: "#818CF8",
          300: "#A5B4FC"
        },
        starlight: {
          500: "#F59E0B",
          400: "#FBBF24"
        },
        risk: {
          low: "#10B981",
          medium: "#F59E0B",
          high: "#EF4444"
        }
      },
      backgroundImage: {
        "space-gradient":
          "radial-gradient(ellipse at top, #1C2050 0%, #0B0D1E 50%, #05060F 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(19,22,50,0.6) 100%)"
      },
      backdropBlur: {
        xs: "2px"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif"
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "twinkle": "twinkle 3s ease-in-out infinite"
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
}
