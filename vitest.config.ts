import path from 'node:path';

import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const pixi3d = path.resolve(import.meta.dirname, '.repos/pixi-3d/src');

export default defineConfig({
  optimizeDeps: {
    exclude: ['pixi.js'],
    include: ['pixi.js > eventemitter3', 'parse-svg-path', '@xmldom/xmldom'],
  },
  resolve: {
    alias: [
      { find: /^~\//, replacement: `${path.resolve(import.meta.dirname, 'src')}/` },
      // Tests, examples and docs import the library by its package name.
      { find: /^react-pixi-fiber$/, replacement: path.resolve(import.meta.dirname, 'src/index.tsx') },
      { find: /^#types$/, replacement: path.resolve(import.meta.dirname, 'src/r3f/types/index.ts') },
      { find: /^@pixi\/3d\/extras$/, replacement: path.join(pixi3d, 'extras/index.ts') },
      { find: /^@pixi\/3d$/, replacement: path.join(pixi3d, 'index.ts') },
    ],
  },
  test: {
    exclude: [...configDefaults.exclude, '.repos/**'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
