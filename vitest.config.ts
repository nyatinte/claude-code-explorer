import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts,tsx}'],
    exclude: [
      'src/commands.backup/**/*',
      'src/ui/prompts/**/*',
      'src/ui/interactive-pager/**/*',
    ],
    globals: true,
    environment: 'node',
  },
  esbuild: {
    jsx: 'automatic',
  },
});
