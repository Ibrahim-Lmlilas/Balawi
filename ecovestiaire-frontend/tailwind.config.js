/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        balawi: {
          bg: '#0B0B0B',
          white: '#FFFFFF',
          border: '#BDBDBD',
          dark: '#1A1A1A',
          muted: '#EDEDED',
          neon: '#A3FF12',
          'dark-neon': '#7CFF00'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Anton', 'sans-serif'],
        hero: ['"Bebas Neue"', 'sans-serif'],
        subheading: ['Oswald', 'sans-serif'],
        slogan: ['"Permanent Marker"', 'cursive'],
      }
    },
  },
  plugins: [],
}
