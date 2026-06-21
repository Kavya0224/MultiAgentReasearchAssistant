/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        bg: "#080c14",
        surface: "#0d1520",
        border: "#1a2538",
        accent: "#00d4ff",
        "accent-dim": "#0096b3",
        "accent-glow": "rgba(0, 212, 255, 0.15)",
        node: {
          planner: "#a78bfa",
          retriever: "#34d399",
          summarizer: "#fbbf24",
          validator: "#f87171",
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        muted: "#4b6070",
        text: {
          primary: "#e2edf5",
          secondary: "#8aa3b8",
          dim: "#4b6070",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 4s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "node-gradient": "linear-gradient(135deg, #0d1520 0%, #111827 100%)",
      },
      backgroundSize: {
        "grid-size": "40px 40px",
      },
    },
  },
  plugins: [],
};
