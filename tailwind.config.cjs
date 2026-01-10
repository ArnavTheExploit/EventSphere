/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ff8a00",
          pink: "#ff3c6a",
          blue: "#007bff",
          dark: "#ffffff", // Professional White background
          darkText: "#0f172a" // Dark text for contrast
        }
      }
    }
  },
  plugins: []
};



