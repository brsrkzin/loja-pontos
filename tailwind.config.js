/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kick: { green: "#53fc18", dark: "#0b0e0f", panel: "#16191c" },
      },
    },
  },
  plugins: [],
};
