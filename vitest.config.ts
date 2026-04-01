import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['src/lib/datasources/api/__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
    },
  },
});
