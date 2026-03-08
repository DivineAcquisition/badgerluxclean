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
        "brand-bg": "#0A0A0A",
        "brand-card": "#1A1A1A",
        "brand-section": "#141414",
        "brand-banner": "#0D0D0D",
        "brand-gold": "#EDC02C",
        "brand-table-header": "#2A2A2A",
        "brand-table-even": "#F5F5F5",
        "brand-table-odd": "#FFFFFF",
        "brand-text": "#DDDDDD",
        "brand-muted": "#999999",
        "brand-green": "#2ECC71",
        "brand-red": "#E74C3C",
        "brand-yellow": "#F39C12",
      },
    },
  },
  plugins: [],
};
export default config;
