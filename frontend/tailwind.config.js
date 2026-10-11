/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfd',
          300: '#7cc2fb',
          400: '#36a2f7',
          500: '#0c85eb',
          600: '#0067ca',
          700: '#0052a3',
          800: '#044686',
          900: '#093b6f',
          950: '#06254a',
        },
        cyber: {
          dark: '#070d19',
          navy: '#0b1528',
          card: '#0f1c36',
          border: 'rgba(56, 189, 248, 0.2)',
          cyan: '#00f0ff',
          blue: '#38bdf8',
          orange: '#ff6b00',
        }
      },
    },
  },
  plugins: [],
}
