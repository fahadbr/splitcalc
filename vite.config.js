import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/splitcalc/',
  plugins: [
    react()
  ],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./test/setup.js']
  }
});
