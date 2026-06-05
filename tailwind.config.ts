import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#111118",
          card: "#16161f",
        },
        accent: {
          blue: "#3b82f6",
          green: "#22c55e",
          orange: "#f97316",
          purple: "#a855f7",
          pink: "#ec4899",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
