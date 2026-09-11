import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          950: "#161412",
          900: "#1d1a16",
          800: "#26221d",
          700: "#332e27",
          600: "#463f35",
          500: "#5c5346",
          400: "#7d7264",
          300: "#a89c8a",
          200: "#d3c8b6",
          100: "#ece5d8",
        },
        oak: {
          600: "#9c6b3a",
          500: "#c9975a",
          400: "#dcb27e",
        },
        moss: {
          600: "#5a7d3a",
          500: "#7cb648",
          400: "#9ed26a",
        },
        redstone: {
          500: "#b3402a",
          400: "#d9583b",
        },
        lapis: {
          500: "#33578f",
          400: "#4c76b8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        pixel: "3px 3px 0 0 rgba(0,0,0,0.35)",
        "pixel-sm": "2px 2px 0 0 rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
