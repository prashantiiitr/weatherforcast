/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode via a `.dark` class on <html> (needed for the toggle)
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: { soft: '0 10px 30px rgba(0,0,0,0.06)' },
    },
  },
  plugins: [],
}
