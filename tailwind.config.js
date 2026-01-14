/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iskf: {
          red: '#BE1322',
          blue: '#2D2E83',
          dark: '#0a0a0a',
          secondary: '#141414',
          gray: '#2a2a2a'
        }
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'sans-serif'],
        serif: ['Times New Roman', 'serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(190, 19, 34, 0.5), 0 0 20px rgba(190, 19, 34, 0.3)',
      },
      textShadow: {
        'glow': '0 0 10px rgba(255, 255, 255, 0.5)',
      },
      animation: {
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { left: '-10rem', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
