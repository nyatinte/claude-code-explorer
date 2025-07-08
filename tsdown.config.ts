import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.tsx',
  format: ['esm'],
  banner: { js: '#!/usr/bin/env node' },
  external: ['ink', 'react'],
  jsx: 'automatic',
  outDir: 'dist',
  clean: true,
  dts: true,
  publint: true,
});
