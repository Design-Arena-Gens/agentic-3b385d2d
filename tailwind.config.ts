import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}", "./features/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0d11",
        surface: "#12161d",
        accent: "#5b8def",
        accentMuted: "#395bb5",
        positive: "#58d68d",
        warning: "#f7c55f",
        danger: "#f57b7b"
      },
      boxShadow: {
        soft: "0 20px 40px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
};

export default config;
