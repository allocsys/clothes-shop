import type { Config } from 'tailwindcss';

// MahPari moonlit palette. Colors are CSS variables (see app/globals.css)
// so the whole site switches between light and dark automatically.
const c = (name: string) => 'rgb(var(--c-' + name + ') / <alpha-value>)';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: c('brand'),
        ink: c('ink'),
        sand: c('sand'),
        gold: c('gold'),
        night: c('night'),
        rose: c('rose'),
        surface: c('surface'),
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
