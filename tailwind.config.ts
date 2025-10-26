import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#58CC02',
          dark: '#2B8000',
          light: '#B8F28C'
        }
      },
      fontFamily: {
        rounded: ['var(--font-baloo)', 'ui-rounded', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '2rem'
      }
    }
  },
  plugins: []
};

export default config;

