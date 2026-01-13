/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      gridColumn: {
        'span-7': 'span 7 / span 7',
        'span-9': 'span 9 / span 9',
      }
    },
  },
  plugins: [],
}
