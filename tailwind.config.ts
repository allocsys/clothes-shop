import type { Config } from 'tailwindcss';

// MahPari moonlit palette
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6b4fa0',
        ink: '#1c1b2e',
        sand: '#f6f3fb',
        gold: '#d9b36c',
        night: '#241a47',
        rose: '#b4566e',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
