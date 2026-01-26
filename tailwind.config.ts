import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        paper: {
          DEFAULT: "#fdf8f1",
          50: "#fdf8f1",
          100: "#f7efdf",
          200: "#efe1c9",
          300: "#e5d4bb",
          400: "#ddcbb1",
        },
        ink: {
          DEFAULT: "#231f1b",
          muted: "#3f3833",
          soft: "#5c544f",
        },
        accent: {
          coral: "#f26b4f",
          sun: "#f4c44d",
          sky: "#4da3c7",
          leaf: "#7fa06a",
          berry: "#d35b6a",
          indigo: "#2e3a5d",
        },
      },
    },
  },
  plugins: [],
};
export default config;
