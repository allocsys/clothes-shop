import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#b4456b',
        ink: '#1f1b24',
        sand: '#f8f4ef',
      },
    },
  },
  plugins: [],
};

export default config;
