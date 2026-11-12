import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        gamuda: {
          red: "#E11D48",
          navy: "#0F172A",
          teal: "#0D9488",
          amber: "#D97706"
        }
      }
    }
  },
  plugins: []
};
export default config;
