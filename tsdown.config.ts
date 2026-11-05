import { defineConfig } from 'tsdown';

import { markRetypedMembers } from './scripts/build/declarations.mts';

export default defineConfig({
  entry: { index: './src/index.tsx', three: './src/three.ts', addons: './src/addons/index.ts' },
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
  hooks: {
    // The declarations drop the source's @ts-expect-error over members typed as three's; see the script.
    'build:done': () => void markRetypedMembers(),
  },
});
