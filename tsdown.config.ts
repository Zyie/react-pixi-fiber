import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: './src/index.ts' },
  format: ['esm'],
  // Oxc emits declarations per file, which needs explicit types on exports (isolatedDeclarations).
  dts: { generator: 'oxc' },
  sourcemap: true,
  platform: 'browser',
  logLevel: 'warn',
  failOnWarn: true,
  exports: true,
  deps: {
    neverBundle: [/^@pixi\/3d/],
  },
});
