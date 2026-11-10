/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f472b6',
          400: '#e11d48',
          500: '#be123c', // deep rich rose/crimson
          600: '#9f1239',
          700: '#881337',
          800: '#701a75', // deep magenta/purple
          900: '#4a044e', // midnight plum
          950: '#2e022d',
        },
        safecampus: {
          dark: '#0f0e17',
          card: '#1a1829',
          border: '#2a2744',
          accent: '#e11d48',
          purple: '#8b5cf6',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'beacon': 'beacon 2.5s infinite',
      },
      keyframes: {
        beacon: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.25)', opacity: '0.4' },
        }
      }
    },
  },
  plugins: [],
}
