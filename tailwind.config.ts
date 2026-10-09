import type { Config } from 'tailwindcss';

// MahPari moonlit palette
// brand: soft violet, ink: midnight, sand: moon mist, gold: accent for highlights
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6b4fa0',
        ink: '#1c1b2e',
        sand: '#f6f3fb',
        gold: '#d9b36c',
      },
    },
  },
  plugins: [],
};

export default config;
