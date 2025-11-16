/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        custom: "#FFFF00",
        "base-dark-bg": "#191A1F",
        "color-neutral-100": "#A5A6A9",
        "color-neutral-300": "#56575C",
        "color-neutral-350": "#353840",
        "profit-green": "#10B981",
        "loss-red": "#EF4444",
      },
    },
  },
  plugins: [],
};
