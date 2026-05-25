import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        ocean: '#007c89',
        coral: '#e86f51',
        leaf: '#3f8f5f'
      },
      boxShadow: {
        soft: '0 16px 50px rgba(23, 32, 38, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
