/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./App.jsx",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(31,138,112,0)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(31,138,112,0.25)" },
        },
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.3s ease-out both",
        "float-in": "floatIn 0.4s ease-out both",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
