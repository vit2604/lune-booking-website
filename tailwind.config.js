/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lune: {
          ink: '#171412',
          charcoal: '#2b2825',
          cream: '#f7f3ec',
          linen: '#ebe2d4',
          gold: '#b08a4b',
          goldDark: '#8b6834',
          sage: '#6f7d6b',
          mist: '#eef2f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px rgba(23, 20, 18, 0.08)',
      },
      animation: {
        scaleIn: 'scaleIn 0.45s ease-out',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
