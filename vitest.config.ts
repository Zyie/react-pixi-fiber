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
    alias: {
      '~': path.resolve(import.meta.dirname, './src'),
      '@pixi/3d/extras': path.join(pixi3d, 'extras/index.ts'),
      '@pixi/3d': path.join(pixi3d, 'index.ts'),
    },
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
