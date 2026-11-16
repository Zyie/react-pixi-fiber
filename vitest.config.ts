import path from 'node:path';

import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

import { fiberAliases, sharedAliases } from './scripts/test/aliases.mts';
import BrowserCommands from './scripts/test/browser-commands.mts';
import generateTestWrappers from './scripts/test/generate-test-wrappers.mts';
import { ParityReporter } from './scripts/test/parity.mts';
import { NATIVE_FOLDERS, PIXI_ONLY_FOLDERS, TWO_D_FOLDERS } from './tests/harness/scene-constants';

const EXCLUDE = [...configDefaults.exclude, '.claude/**', '.repos/**'];

/** The wrappers of every scene and example, which the `three` and `scenes` projects both run */
const SCENE_WRAPPERS = ['tests/scenes/**/*.scene.test.ts', 'tests/docs/**/*.example.test.ts'];

/**
 * The wrappers of the scenes and examples in some folders of keys
 * @param folders - The folders, such as `2d` or `docs/2d`
 */
const wrappersIn = (folders: readonly string[]): string[] =>
  folders.map((folder) => (folder.startsWith('docs/') ? `tests/${folder}/**` : `tests/scenes/${folder}/**`));

/** The wrappers of the 2D scenes and examples, which the `three` project leaves out: three.js has no 2D */
const PIXI_ONLY_WRAPPERS = wrappersIn(PIXI_ONLY_FOLDERS);

/** The wrappers of the scenes and examples that run without threejs-compat, in the `native` project only */
const NATIVE_WRAPPERS = wrappersIn(NATIVE_FOLDERS);

/** The wrappers of the 2D scenes and examples, which run on core and 2d alone, in the `2d` project only */
const TWO_D_WRAPPERS = wrappersIn(TWO_D_FOLDERS);

/** The tests of the native project beside its scenes: the unit tests and the synthetic input of its scenes */
const NATIVE_TESTS = [
  'tests/unit/native/**/*.test.{ts,tsx}',
  'tests/harness/__tests__/synthetic-input-native.test.tsx',
];

/** Installs threejs-compat, which every scene outside the native folders uses */
const COMPAT_SETUP = ['tests/harness/setup/threejs-compat.ts'];

/** `@react-fiber/threejs-compat` and its entries as an error, so a native or 2D page can't load it */
const NO_COMPAT = {
  find: /^@react-fiber\/threejs-compat(\/.*)?$/,
  replacement: path.resolve(import.meta.dirname, 'tests/harness/no-threejs-compat.ts'),
};

/** `@react-fiber/3d` as an error, so a 2D page can't load it */
const NO_3D = { find: /^@react-fiber\/3d$/, replacement: path.resolve(import.meta.dirname, 'tests/harness/no-3d.ts') };

export default defineConfig({
  server: {
    // Vite forwards the browser console to the terminal. Warnings are left out: they are pixi and WebGPU
    // noise, and a pixel comparison decides a scene, not a log.
    forwardConsole: { unhandledErrors: true, logLevels: ['error', 'log', 'info', 'debug'] },
  },
  optimizeDeps: {
    exclude: ['pixi.js', 'pixi-filters'],
    // Listed so a cold cache doesn't optimize them mid-run, which reloads the page and fails that run.
    include: [
      'pixi.js > eventemitter3',
      '@pixi/3d',
      'parse-svg-path',
      '@xmldom/xmldom',
      'three',
      'three/addons/controls/MapControls.js',
      'three/addons/controls/OrbitControls.js',
      'three/addons/libs/meshopt_decoder.module.js',
      'three/addons/loaders/DRACOLoader.js',
      'three/addons/loaders/GLTFLoader.js',
      'three/addons/loaders/HDRLoader.js',
      'three/addons/loaders/RGBELoader.js',
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
      { find: /^@test-utils$/, replacement: path.resolve(import.meta.dirname, 'tests/harness/test-utils.tsx') },
      // Unit tests reach threejs-compat's internals, which no entry exports.
      {
        find: /^~threejs-compat\//,
        replacement: `${path.resolve(import.meta.dirname, 'packages/threejs-compat/src')}/`,
      },
      ...sharedAliases,
    ],
  },
  test: {
    projects: [
      // Every scene through r3f's own entry on three.js, held to its three.js reference, which is what
      // parity is measured against. It runs first, so in a full run the pixi-3d projects measure against
      // a reference this run has just checked (or rewritten, with --update).
      {
        extends: true,
        resolve: { alias: fiberAliases('three') },
        test: {
          name: 'three',
          include: SCENE_WRAPPERS,
          exclude: [...EXCLUDE, ...PIXI_ONLY_WRAPPERS],
          setupFiles: COMPAT_SETUP,
          provide: { fiber: 'three' },
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        resolve: { alias: fiberAliases('pixi') },
        test: {
          name: 'scenes',
          include: SCENE_WRAPPERS,
          exclude: [...EXCLUDE, ...NATIVE_WRAPPERS, ...TWO_D_WRAPPERS],
          setupFiles: COMPAT_SETUP,
          provide: { fiber: 'pixi' },
          sequence: { groupOrder: 1 },
        },
      },
      // The scenes of @react-fiber/3d and 2d without threejs-compat, on pages of their own where it can't load,
      // held to their own references.
      {
        extends: true,
        resolve: { alias: [NO_COMPAT, ...fiberAliases('pixi')] },
        test: {
          name: 'native',
          include: [...NATIVE_WRAPPERS.map((folder) => `${folder}/*.test.ts`), ...NATIVE_TESTS],
          exclude: EXCLUDE,
          setupFiles: ['tests/harness/setup/native.ts'],
          provide: { fiber: 'pixi' },
          sequence: { groupOrder: 2 },
        },
      },
      // The 2D scenes and examples on core and 2d alone, as a 2D app runs, on pages where neither
      // @react-fiber/3d nor threejs-compat can load, held to their own references.
      {
        extends: true,
        resolve: { alias: [NO_COMPAT, NO_3D, ...fiberAliases('pixi')] },
        test: {
          name: '2d',
          include: TWO_D_WRAPPERS.map((folder) => `${folder}/*.test.ts`),
          exclude: EXCLUDE,
          provide: { fiber: 'pixi' },
          sequence: { groupOrder: 2 },
        },
      },
      // Behaviour with no picture to compare, and the harness's own tests, on pixi-3d. After the scenes: one
      // of these runs the real requestAnimationFrame loop, which stalls while other pages hold the GPU.
      {
        extends: true,
        resolve: { alias: fiberAliases('pixi') },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/harness/__tests__/**/*.test.{ts,tsx}'],
          exclude: [...EXCLUDE, ...NATIVE_TESTS],
          setupFiles: COMPAT_SETUP,
          provide: { fiber: 'pixi' },
          sequence: { groupOrder: 3 },
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
