/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070913',
          800: '#0b0e17',
          700: '#111827',
          600: '#1f2937'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Google Sans', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
