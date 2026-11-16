import { defineConfig } from 'tsdown';

// Ours, not upstream's: the entries of upstream's build.config.ts (unbuild), built with tsdown.
export default defineConfig({
  entry: {
    index: './src/index.tsx',
    legacy: './src/legacy.tsx',
    'webgpu/index': './src/webgpu/index.tsx',
    extension: './src/extension.tsx',
  },
  format: ['esm', 'cjs'],
  // The forked source isn't written for isolated declarations, so TypeScript emits them.
  dts: { generator: 'tsgo' },
  platform: 'neutral',
  // The CJS build warns that Canvas's HMR branch reads `import.meta`, which it empties there, as unbuild does.
  logLevel: 'error',
  outExtensions: ({ format }) => (format === 'cjs' ? { js: '.cjs', dts: '.d.cts' } : { js: '.mjs', dts: '.d.ts' }),
  deps: { neverBundle: [/^three/] },
  // `#types` re-exports declaration files, which the bundle reads as empty modules.
  inputOptions: { resolve: { extensions: ['.tsx', '.ts', '.d.ts', '.mjs', '.js'] } },
});
