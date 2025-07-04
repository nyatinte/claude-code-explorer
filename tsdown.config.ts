import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.tsx',
  format: ['esm'],
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  external: ['ink', 'react'],
  jsx: 'automatic',
});
