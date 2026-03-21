import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/test/**/*.test.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
