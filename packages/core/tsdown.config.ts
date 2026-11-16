import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: './src/index.tsx', extension: './src/extension.ts' },
  format: ['esm'],
  // Oxc emits declarations per file, which needs explicit types on exports (isolatedDeclarations).
  dts: { generator: 'oxc' },
  sourcemap: true,
  platform: 'browser',
  logLevel: 'warn',
  failOnWarn: true,
  exports: true,
  // r3f's core is bundled, so the packages on core share one copy of it through core's entries.
  deps: { neverBundle: [/^@pixi\/3d/], alwaysBundle: [/^@react-fiber\/r3f\//] },
});
