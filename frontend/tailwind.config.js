/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        manchester: {
          red: '#dc2626',
          orange: '#ea580c',
          yellow: '#eab308',
          green: '#16a34a',
          blue: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}
