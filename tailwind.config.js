/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E8F0FC",
          100: "#C7D9F8",
          200: "#95B3F0",
          300: "#5E86E0",
          400: "#3E66CC",
          500: "#0A2463",
          600: "#081D4F",
          700: "#06163B",
          800: "#041027",
          900: "#020A13",
        },
        accent: {
          50: "#E8F6FD",
          100: "#C2E6F9",
          200: "#8CCEF3",
          300: "#55B3EC",
          400: "#3E92CC",
          500: "#2A7AB0",
          600: "#22628E",
          700: "#1A4A6B",
          800: "#113249",
          900: "#091A26",
        },
        danger: "#D62828",
        warning: "#F77F00",
        success: "#00A896",
        info: "#0466C8",
        dark: {
          bg: "#0F172A",
          bg2: "#1E293B",
          bg3: "#334155",
          border: "#475569",
          text: "#F1F5F9",
          text2: "#CBD5E1",
          text3: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "count-up": "countUp 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        countUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(62, 146, 204, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(62, 146, 204, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
