import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Добавление совместимости с Jest
    testTimeout: 10000,
  },
  define: {
    global: 'globalThis',
  },
});