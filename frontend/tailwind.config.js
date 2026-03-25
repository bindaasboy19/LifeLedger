/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'Manrope', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'Sora', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d6edff',
          200: '#adddff',
          300: '#73c4ff',
          400: '#349fff',
          500: '#0a7dff',
          600: '#005fd6',
          700: '#004da3',
          800: '#074384',
          900: '#0d3a6e'
        },
        surface: {
          50: '#f7f9fc',
          900: '#0f172a'
        }
      }
    }
  },
  plugins: []
};
