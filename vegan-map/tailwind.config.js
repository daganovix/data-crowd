/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f1f9ed",
          100: "#dcefd1",
          200: "#bbdfa7",
          300: "#92c976",
          400: "#6cb04d",
          500: "#4f9530",
          600: "#3c7724",
          700: "#305d1f",
          800: "#284a1d",
          900: "#223f1b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
