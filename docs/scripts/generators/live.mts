/**
 * The runtime of the live examples, in `static/runtime`:
 *
 * - `js/`: ES modules of every package a program can import, built from the repo's sources and the
 *   pinned packages: react-pixi-fiber from its entry in `src`, @pixi/3d from `.repos/pixi-3d`, pixi.js,
 *   React and React DOM, and the frame's own module. A frame imports them from the site by URL, each
 *   chunk importing another by its relative path; `manifest.json` lists them, with what each imports.
 * - `assets/`: the images and models of `tests/assets`, when there is one, which a program loads by name
 *   as the visual tests do.
 *
 * The modules are built again only when what they are built from changed: the sources they bundle, the
 * lockfile and this file. The editor that layout's site runs on Monaco isn't built here yet: a live
 * example runs as written, and `Example` has the seam for one (see `docs/README.md`).
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { rolldown } from 'rolldown';
import type { OutputChunk, Plugin } from 'rolldown';

import type { RuntimeAsset, RuntimeManifest } from '../../src/components/Live/types.ts';
import { ROOT } from '../paths.mts';
import type { GeneratedFiles, Generator } from '../sync.mts';
import { ENTRIES, entryFile, packageName } from '../typedoc/entries.mts';
import type { Built } from './cache.mts';
import { cached, hashOf, LOCKFILE } from './cache.mts';

const OUT = 'static/runtime';
const BASE = 'runtime/';
const LIVE = 'docs/src/components/Live';
const FRAME = path.join(ROOT, LIVE, 'frame/frame.ts');
const PIXI3D = path.join(ROOT, '.repos/pixi-3d/src');
const ASSETS = 'tests/assets';
const require = createRequire(path.join(ROOT, 'package.json'));

/** What every cached build here is built from besides its own sources: the packages, and this file */
const BUILT_WITH = [LOCKFILE, 'docs/scripts/generators/live.mts'];

/** The CommonJS packages a program imports by name, each given ES exports by a facade */
const COMMONJS = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'];

/** The files a runtime asset may be: what a scene loads as a texture or a model */
const ASSET_FILES = '**/*.{png,jpg,jpeg,webp,ktx2,glb,gltf,bin,hdr}';

/**
 * Every module a program can import, by its specifier, with what the build reads for it: a package
 * name, a file, or a facade
 */
function modules(): Record<string, string> {
  return {
    ...Object.fromEntries(ENTRIES.map((entry) => [packageName(entry), path.join(ROOT, entryFile(entry, ROOT))])),
    'pixi.js': 'pixi.js',
    '@pixi/3d': path.join(PIXI3D, 'index.ts'),
    '@pixi/3d/extras': path.join(PIXI3D, 'extras/index.ts'),
    ...Object.fromEntries(COMMONJS.map((name) => [name, `\0facade:${name}`])),
  };
}

/**
 * A file name for a module specifier
 * @param specifier - The specifier
 */
function chunkName(specifier: string): string {
  return specifier.replace(/^@/, '').replace(/[^\w.-]+/g, '-');
}

/**
 * Resolves the names the repo resolves through tsconfig paths, `react-pixi-fiber`, `@pixi/3d` and
 * `~/`, to their sources, and gives each CommonJS package an ES facade with named exports
 * @param entries - Every module a program can import, from `modules()`
 */
function runtimePlugin(entries: Readonly<Record<string, string>>): Plugin {
  return {
    name: 'live-runtime',
    resolveId(id) {
      if (id.startsWith('\0facade:')) return id;
      if (id.startsWith('~/')) return { id: path.join(ROOT, 'src', id.slice(2)) };

      const file = entries[id];

      return file && path.isAbsolute(file) ? file : null;
    },
    load(id) {
      if (!id.startsWith('\0facade:')) return null;

      const name = id.slice('\0facade:'.length);
      const names = Object.keys(require(name) as object).filter((key) => /^[A-Za-z_$][\w$]*$/.test(key));

      return `import module from ${JSON.stringify(name)};\nexport default module;\nexport const { ${names.join(', ')} } = module;\n`;
    },
  };
}

/** Builds the modules; returns the files of `js/`, the file of each module and what each file imports */
async function buildModules(): Promise<Built<Pick<RuntimeManifest, 'modules' | 'frame' | 'imports'>>> {
  const entries = modules();
  const inputs = { ...entries, frame: FRAME };
  const bundle = await rolldown({
    cwd: ROOT,
    input: Object.fromEntries(Object.entries(inputs).map(([specifier, file]) => [chunkName(specifier), file])),
    platform: 'browser',
    logLevel: 'silent',
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    transform: {
      define: { 'process.env.NODE_ENV': '"production"' },
      jsx: { runtime: 'automatic' },
      // r3f's vendored core imports types without `type`, which only eliding unused imports drops
      typescript: { onlyRemoveTypeImports: false },
    },
    plugins: [runtimePlugin(entries)],
  });
  const { output } = await bundle.generate({
    format: 'esm',
    minify: true,
    entryFileNames: '[name]-[hash].js',
    chunkFileNames: '[name]-[hash].js',
  });

  await bundle.close();

  const chunks = output.filter((item): item is OutputChunk => item.type === 'chunk');
  const files: GeneratedFiles = {};
  const imports: Record<string, string[]> = {};
  const byName = new Map(chunks.filter((chunk) => chunk.isEntry).map((chunk) => [chunk.name, chunk.fileName]));

  for (const chunk of chunks) {
    files[`${OUT}/js/${chunk.fileName}`] = chunk.code;
    imports[chunk.fileName] = [...chunk.imports, ...chunk.dynamicImports];
  }

  return {
    files,
    meta: {
      modules: Object.fromEntries(
        Object.keys(entries).map((specifier) => [specifier, byName.get(chunkName(specifier))!]),
      ),
      frame: byName.get('frame')!,
      imports,
    },
  };
}

/** The live runtime's generator */
export const live: Generator = {
  name: 'live',
  outputs: [OUT],
  sources: ['src', ASSETS, LIVE, LOCKFILE],
  async generate() {
    const built = await cached(
      'live-modules',
      hashOf([], ['src', '.repos/pixi-3d/src', `${LIVE}/frame`, `${LIVE}/types.ts`, 'tsconfig.json', ...BUILT_WITH]),
      buildModules,
    );
    const files: GeneratedFiles = { ...built.files };
    const assets: RuntimeAsset[] = [];

    if (fs.existsSync(path.join(ROOT, ASSETS))) {
      for (const file of fs.globSync(ASSET_FILES, { cwd: path.join(ROOT, ASSETS) })) {
        const alias = file.split(path.sep).join('/');

        files[`static/${BASE}assets/${alias}`] = fs.readFileSync(path.join(ROOT, ASSETS, file));
        assets.push({ alias, file: `${BASE}assets/${alias}` });
      }
    }

    const manifest: RuntimeManifest = { base: `${BASE}js/`, ...built.meta, assets };

    files[`${OUT}/manifest.json`] = `${JSON.stringify(manifest, null, 2)}\n`;

    return files;
  },
};
