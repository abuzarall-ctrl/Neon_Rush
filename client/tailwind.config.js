/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        body: ["Rajdhani", "system-ui", "sans-serif"],
      },
      colors: {
        night: "#070311",
        ink: "#0d0820",
        magenta: "#ff2e97",
        cyan: "#19e3ff",
        amber: "#ffb627",
        lime: "#b6ff3c",
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(255,46,151,0.4), 0 0 24px rgba(255,46,151,0.35)",
        cyanglow: "0 0 0 1px rgba(25,227,255,0.4), 0 0 24px rgba(25,227,255,0.35)",
      },
      keyframes: {
        scan: { "0%": { backgroundPosition: "0 0" }, "100%": { backgroundPosition: "0 -1000px" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        pulseFast: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.55" } },
      },
      animation: {
        scan: "scan 18s linear infinite",
        floaty: "floaty 4s ease-in-out infinite",
        pulseFast: "pulseFast 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
