/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          primary: '#10b981',
          secondary: '#f3f4f6',
          dark: '#1f2937',
          light: '#ffffff',
        }
      },
    },
  },
  plugins: [],
}
 