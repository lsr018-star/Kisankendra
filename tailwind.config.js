/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#EFF7EE",
          100: "#DCEFDB",
          200: "#B9DFB7",
          300: "#8CC488",
          400: "#5DA653",
          500: "#3E8E3A",
          600: "#2E7D32",
          700: "#256528",
          800: "#1B5E20",
          900: "#14471A",
        },
        cream: "#FFF8E7",
        creamdark: "#F7ECD2",
        tang: {
          500: "#F57C00",
          600: "#E65100",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Noto Sans", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
