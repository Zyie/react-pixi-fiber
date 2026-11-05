import path from 'node:path';

import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

import { fiberAlias, sharedAliases } from './scripts/test/aliases.mts';
import BrowserCommands from './scripts/test/browser-commands.mts';
import generateTestWrappers from './scripts/test/generate-test-wrappers.mts';
import { ParityReporter } from './scripts/test/parity.mts';

const EXCLUDE = [...configDefaults.exclude, '.claude/**', '.repos/**', 'spike/**'];

/** The wrappers of every scene and example, which the `three` and `scenes` projects both run */
const SCENE_WRAPPERS = ['tests/scenes/**/*.scene.test.ts', 'tests/docs/**/*.example.test.ts'];

export default defineConfig({
  server: {
    // Vite forwards the browser console to the terminal. Warnings are left out: they are pixi and WebGPU
    // noise, and a pixel comparison decides a scene, not a log.
    forwardConsole: { unhandledErrors: true, logLevels: ['error', 'log', 'info', 'debug'] },
  },
  optimizeDeps: {
    exclude: ['pixi.js'],
    // Listed so a cold cache doesn't optimize them mid-run, which reloads the page and fails that run.
    include: [
      'pixi.js > eventemitter3',
      'parse-svg-path',
      '@xmldom/xmldom',
      'three',
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      'react-reconciler',
      'react-reconciler/constants',
      'scheduler',
      'zustand',
      'zustand/traditional',
      'its-fine',
      'suspend-react',
      'dequal',
      '@pmndrs/scheduler',
      'use-sync-external-store/shim/with-selector',
    ],
  },
  // Textures and models the scenes load. Nothing is fetched from the network at test time.
  publicDir: './tests/assets',
  plugins: [
    generateTestWrappers([
      { dir: './tests/scenes', suffix: /\.scene\.tsx?$/, define: 'defineSceneTests', exportName: 'scene' },
      // Each documentation example runs as a scene keyed `docs/<topic>/<name>`, with its wrapper in tests/docs.
      {
        dir: './examples',
        suffix: /\.example\.tsx?$/,
        define: 'defineSceneTests',
        exportName: 'example',
        outDir: './tests/docs',
        keyPrefix: 'docs/',
      },
    ]),
    BrowserCommands(),
  ],
  resolve: {
    alias: [
      { find: '@test-utils', replacement: path.resolve(import.meta.dirname, 'tests/harness/test-utils.tsx') },
      ...sharedAliases,
    ],
  },
  test: {
    projects: [
      // Every scene through r3f's own entry on three.js, which records the pictures parity is measured
      // against. It runs first, so the pixi-3d projects measure against this run's pictures.
      {
        extends: true,
        resolve: { alias: [fiberAlias('three')] },
        test: {
          name: 'three',
          include: SCENE_WRAPPERS,
          exclude: EXCLUDE,
          provide: { fiber: 'three' },
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        resolve: { alias: [fiberAlias('pixi')] },
        test: {
          name: 'scenes',
          include: SCENE_WRAPPERS,
          exclude: EXCLUDE,
          provide: { fiber: 'pixi' },
          sequence: { groupOrder: 1 },
        },
      },
      // Behaviour with no picture to compare, and the harness's own tests, on pixi-3d. After the scenes: one
      // of these runs the real requestAnimationFrame loop, which stalls while other pages hold the GPU.
      {
        extends: true,
        resolve: { alias: [fiberAlias('pixi')] },
        test: {
          name: 'unit',
          include: [
            'tests/unit/**/*.test.{ts,tsx}',
            'tests/harness/__tests__/**/*.test.{ts,tsx}',
            'tests/*.test.{ts,tsx}',
          ],
          exclude: EXCLUDE,
          provide: { fiber: 'pixi' },
          sequence: { groupOrder: 2 },
        },
      },
    ],
    // Test files share long-lived pages. A fresh page per file would load the whole module graph again and
    // create a GPU context each time.
    isolate: false,
    reporters: ['default', 'json', new ParityReporter()],
    outputFile: { json: '.temp/vitest-last.json' },
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: { args: process.env.CHROMIUM_ARGS?.split(' ') ?? ['--enable-gpu', '--enable-unsafe-webgpu'] },
      }),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
      // A viewport that fits Playwright's default 1280 by 720 page, so the test frame is never scaled with
      // CSS, and that is larger than a scene's canvas.
      viewport: { width: 800, height: 600 },
    },
  },
});
