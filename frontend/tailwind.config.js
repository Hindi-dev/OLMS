/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rajbhasha: {
          navy: '#102a54',
          'navy-dark': '#0b1c38',
          'navy-light': '#1e3a6c',
          saffron: '#e66a08',
          'saffron-light': '#fff5eb',
          ash: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        devanagari: ['"Noto Sans Devanagari"', 'Mangal', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
