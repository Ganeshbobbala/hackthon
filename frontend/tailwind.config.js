/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sky: {
          950: "#070B14",
          900: "#0B1220",
          850: "#0F1A2E",
          800: "#13203A",
          700: "#1C2F54",
          600: "#2B457A",
        },
        radar: {
          accent: "#4DA3FF",
          accentHover: "#3B8CE0",
          good: "#2DD4A7",
          goodBg: "rgba(45, 212, 167, 0.12)",
          warn: "#F5B84B",
          warnBg: "rgba(245, 184, 75, 0.12)",
          high: "#F26D6D",
          highBg: "rgba(242, 109, 109, 0.12)",
          neutral: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beacon-ping": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
}
