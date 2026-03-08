import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#EDC02C",
          light: "#F5D45A",
          50: "#FFF9E5",
          100: "#FFF3CC",
          200: "#FFE799",
          700: "#B8950E",
          800: "#8A6F0A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
