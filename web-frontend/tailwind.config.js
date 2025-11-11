import lineClamp from "@tailwindcss/line-clamp";
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        custom: "#FFFF00",
      },
    },
  },
  plugins: [lineClamp],
};
