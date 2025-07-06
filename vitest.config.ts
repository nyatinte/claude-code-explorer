import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts,tsx}'],
    exclude: ['node_modules'],
    globals: true,
    environment: 'node',
  },
  esbuild: {
    jsx: 'automatic',
  },
});
