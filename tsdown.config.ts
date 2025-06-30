import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false, // Keep readable for CLI tools
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
