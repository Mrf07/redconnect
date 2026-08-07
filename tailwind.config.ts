/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#eef2ff',
          200: '#dbe4ff',
          300: '#b8c8ff',
          400: '#8b99ff',
          500: '#5f6cff',
          600: '#444ee5',
          700: '#3b40b9',
          800: '#343a91',
          900: '#2c3273',
        },
      },
    },
  },
  plugins: [],
}

export default config
