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
          red: '#BE1622',
          blue: '#2D2E83',
          dark: '#0a0a0a',
          secondary: '#141414',
          gray: '#2a2a2a'
        }
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Nunito Sans"', 'sans-serif'],
        serif: ['Times New Roman', 'serif'],
      },
      fontSize: {
        xs: 'clamp(0.75rem, 0.70rem + 0.25vw, 0.8rem)',
        sm: 'clamp(0.875rem, 0.825rem + 0.25vw, 0.925rem)',
        base: 'clamp(1rem, 0.90rem + 0.5vw, 1.125rem)',
        lg: 'clamp(1.125rem, 1.025rem + 0.5vw, 1.25rem)',
        xl: 'clamp(1.25rem, 1.05rem + 1vw, 1.5rem)',
        '2xl': 'clamp(1.5rem, 1.2rem + 1.5vw, 1.875rem)',
        '3xl': 'clamp(1.875rem, 1.525rem + 1.75vw, 2.25rem)',
        '4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3rem)',
        '5xl': 'clamp(3rem, 2.25rem + 3.75vw, 4rem)',
        '6xl': 'clamp(3.75rem, 2.75rem + 5vw, 5rem)',
        '7xl': 'clamp(4.5rem, 3.25rem + 6.25vw, 6rem)',
        '8xl': 'clamp(6rem, 4.5rem + 7.5vw, 8rem)',
        '9xl': 'clamp(8rem, 6rem + 10vw, 11rem)',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(190, 22, 34, 0.5), 0 0 20px rgba(190, 22, 34, 0.3)',
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
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
