import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts}'],
    globals: true,
    environment: 'node',
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});
