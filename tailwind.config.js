/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Sora"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6c5ce7',
          50: 'rgba(108,92,231,0.08)',
          100: 'rgba(108,92,231,0.15)',
          200: 'rgba(108,92,231,0.25)',
          light: '#a29bfe',
          600: '#5a4bd1',
        },
        surface: {
          DEFAULT: '#16181f',
          2: '#1e2028',
        },
        z: {
          bg: '#0d0e12',
          text: '#eaeaea',
          muted: '#8890a4',
          border: 'rgba(255,255,255,0.08)',
          mint: '#00cec9',
          coral: '#ff6b6b',
          pink: '#fd79a8',
        },
      },
      borderRadius: {
        z: '14px',
        'z-sm': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease both',
        'slide-up': 'slideUp 0.3s ease both',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
