import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['lib/index.ts'],
  format: ['esm'],
  dts: true,
  bundle: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'es2017',
  platform: 'browser',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' };
  }
});
