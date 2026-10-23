/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f1f8f5',
          100: '#deefe7',
          200: '#bfdfd1',
          300: '#93c7b2',
          400: '#63a98f',
          500: '#3f8c71',
          600: '#2f7059',
          700: '#275947',
          800: '#21473a',
          900: '#1b3b30',
          950: '#0d211b',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        sand: {
          50: '#faf9f6',
          100: '#f4f2ec',
          200: '#e8e5db',
          300: '#d7d2c3',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -1px rgba(13, 33, 27, 0.05), 0 1px 3px -1px rgba(13, 33, 27, 0.03)',
        'soft-md': '0 8px 24px -4px rgba(13, 33, 27, 0.08), 0 4px 12px -2px rgba(13, 33, 27, 0.04)',
        'soft-lg': '0 16px 36px -6px rgba(13, 33, 27, 0.12), 0 8px 16px -4px rgba(13, 33, 27, 0.06)',
      }
    },
  },
  plugins: [],
}
