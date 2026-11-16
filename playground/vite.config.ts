import path from 'node:path';

import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

import { FIBER_TARGETS, isFiberEntry, sharedAliases } from '../scripts/test/aliases.mts';

const root = import.meta.dirname;
const projectRoot = path.resolve(root, '..');

/** The query that marks a module as part of a three.js frame's module graph */
const THREE_MARK = 'fiber=three';

/** The modules that are marked: scripts. A JSON or CSS file is a leaf, and Vite's plugins for it match on its extension. */
const SCRIPT = /\.[cm]?[jt]sx?$/;

/**
 * Resolves the packages' entries per frame, as vitest's `scenes` and `three` projects resolve them per
 * project. A frame on the three renderer loads its entry with `?fiber=three`; every script that entry
 * reaches outside `node_modules` is loaded with the same query, so it is a module of its own in that
 * frame, and the entries `FIBER_TARGETS` names (`@react-fiber/threejs-compat`, its `/three` and `/addons`,
 * `@react-fiber/core` and `@react-fiber/2d`) resolve to r3f's own entry, three, three's addons and an
 * empty module there, and to the packages' sources everywhere else.
 */
function fiberPerFrame(): Plugin {
  return {
    name: 'playground:fiber-per-frame',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      const three = importer?.includes(THREE_MARK) ?? false;

      if (isFiberEntry(source) && !three) return FIBER_TARGETS.pixi[source];
      if (!three) return null;

      const target = isFiberEntry(source) ? FIBER_TARGETS.three[source] : source;
      const resolved = await this.resolve(target, importer, { ...options, skipSelf: true });

      if (
        !resolved ||
        resolved.external ||
        resolved.id.startsWith('\0') ||
        resolved.id.includes('/node_modules/') ||
        resolved.id.includes(THREE_MARK) ||
        !SCRIPT.test(resolved.id.split('?')[0])
      ) {
        return resolved;
      }

      return { ...resolved, id: `${resolved.id}${resolved.id.includes('?') ? '&' : '?'}${THREE_MARK}` };
    },
  };
}

/**
 * Watches the scene and example folders, which sit outside the playground's root, so a file added
 * while the server runs joins the list without a restart
 */
function watchScenes(): Plugin {
  return {
    name: 'playground:watch-scenes',
    configureServer(server) {
      server.watcher.add([path.join(projectRoot, 'tests/scenes'), path.join(projectRoot, 'examples')]);
    },
  };
}

export default defineConfig({
  root,
  // The textures and models the scenes load, at the URLs vitest serves them from.
  publicDir: path.resolve(projectRoot, 'tests/assets'),
  plugins: [fiberPerFrame(), watchScenes()],
  resolve: { alias: sharedAliases },
  optimizeDeps: {
    exclude: ['pixi.js', 'pixi-filters'],
    // A frame's entry is loaded by a URL the scanner can't follow, so what it reaches is named here, and a
    // first visit doesn't optimize mid-load and reload the page.
    entries: ['index.html', 'src/**/*.{ts,tsx}', '../tests/scenes/**/*.tsx', '../examples/**/*.tsx'],
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
      'pixelmatch',
    ],
  },
  server: {
    port: 5181,
    strictPort: true,
    fs: { allow: [projectRoot] },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: { main: path.join(root, 'index.html'), 'scene-frame': path.join(root, 'scene-frame.html') },
    },
  },
});
