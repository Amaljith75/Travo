import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#17382A', deep: '#0F2A1E' },
        emerald: { DEFAULT: '#2E6B4F', soft: '#E3EEE7' },
        sand: { DEFAULT: '#E9DFCC', soft: '#F4EEE2' },
        cream: '#FAF7F1',
        ink: { DEFAULT: '#1F2326', soft: '#3B4146' },
        muted: '#6E767C',
        line: '#E6E1D6',
        gold: '#C48A2C',
        danger: '#B3412E',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(15,42,30,0.04), 0 6px 20px rgba(15,42,30,0.05)' },
    },
  },
  plugins: [],
} satisfies Config;
