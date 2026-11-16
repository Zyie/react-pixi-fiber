/**
 * Checks the built packages: `npm run build`, then `npm run test:bundle`.
 *
 * three must not be a runtime dependency of any package but r3f's fork. It is a devDependency only so
 * r3f's own entries (`packages/r3f/src/legacy.tsx`) can render the same scenes through three for
 * parity. For each of `@react-fiber/core`, `@react-fiber/2d`, `@react-fiber/3d` and
 * `@react-fiber/threejs-compat`, this fails when a file in its `dist` imports `three` or a `three/...`
 * subpath, statically, dynamically or as a declaration import, or when its `package.json` lists three
 * as a dependency or peer dependency. It also fails when a file of those imports `@react-fiber/r3f`,
 * which core bundles so every package shares one copy of r3f's core through core's entries.
 *
 * It then type-checks three apps against the built declarations, found through `node_modules` and each
 * package's `exports`, strict and with TypeScript's default `skipLibCheck: false`, and fails on any
 * error, in the app or in `dist`: `consumer/app.tsx`, an r3f app on threejs-compat, `native/app.tsx`,
 * an app on core, 2d and 3d alone, and `two-d/app.tsx`, a 2D app on core and 2d alone. Last, it bundles
 * the native app and fails when the bundle holds a module of threejs-compat or three, since without the
 * compat package nothing three-shaped is bundled, and bundles the 2D app and fails when it holds one of
 * those or of @react-fiber/3d.
 */
import fs from 'node:fs';
import path from 'node:path';

import { rolldown } from 'rolldown';

import { typeCheck } from './declarations.mts';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const PACKAGES = ['core', '2d', '3d', 'threejs-compat'];
const FORBIDDEN_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"])(three|@types\/three|@react-fiber\/r3f)(?:\/[^'"]*)?\1/g;

/**
 * Every file under `dir`
 * @param dir - Folder to list
 */
function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}

const problems: string[] = [];
let checked = 0;

for (const name of PACKAGES) {
  const folder = path.join(REPO_ROOT, 'packages', name);
  const dist = path.join(folder, 'dist');
  if (!fs.existsSync(dist)) {
    console.error(`packages/${name}/dist is missing; run npm run build first`);
    process.exit(1);
  }
  const files = listFiles(dist).filter((file) => /\.(?:[cm]?js|d\.[cm]?ts)$/.test(file));
  checked += files.length;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(FORBIDDEN_IMPORT)) {
      const line = source.slice(0, match.index).split('\n').length;
      problems.push(`${path.relative(REPO_ROOT, file)}:${line} imports ${match[0]}`);
    }
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')) as Record<
    string,
    Record<string, string> | undefined
  >;
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    if (pkg[field]?.three) problems.push(`packages/${name}/package.json lists three in ${field}`);
  }
}

if (problems.length) {
  console.error(`The built packages depend on three.js or on r3f's fork:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`dist of ${PACKAGES.join(', ')} is free of three.js and r3f's fork (${checked} files)`);

for (const app of ['consumer', 'native', 'two-d']) {
  const errors = typeCheck(`scripts/build/${app}/tsconfig.json`);

  if (errors.length) {
    const list = errors.map(
      ({ file, line, code, message }) => `${path.relative(REPO_ROOT, file)}:${line} ${code} ${message}`,
    );
    console.error(
      `scripts/build/${app}/app.tsx doesn't type-check against the built declarations:\n  ${list.join('\n  ')}`,
    );
    process.exit(1);
  }
}
console.log(
  'An app on threejs-compat, one on 2d and 3d alone and one on 2d alone type-check against the built declarations',
);

/**
 * The module ids of an app's bundle, with react, pixi.js and @pixi/3d left out
 * @param app - The app's folder in `scripts/build`
 */
async function bundledModules(app: string): Promise<string[]> {
  const bundle = await rolldown({
    input: path.join(REPO_ROOT, `scripts/build/${app}/app.tsx`),
    cwd: REPO_ROOT,
    platform: 'browser',
    external: [/^react(?:-dom)?(?:\/|$)/, /^pixi\.js(?:\/|$)/, /^@pixi\/3d(?:\/|$)/],
    transform: { jsx: 'react-jsx' },
    logLevel: 'silent',
  });
  const { output } = await bundle.generate({ format: 'esm' });
  await bundle.close();
  return output.flatMap((chunk) => (chunk.type === 'chunk' ? chunk.moduleIds : []));
}

/** The apps bundled, each with the package folders its bundle must not hold */
const BUNDLED = [
  {
    app: 'native',
    name: 'The app on 2d and 3d alone',
    forbidden: /[\\/](?:threejs-compat|three)[\\/]/,
    left: 'threejs-compat or three',
  },
  {
    app: 'two-d',
    name: 'The 2D app on 2d alone',
    forbidden: /[\\/](?:threejs-compat|three|3d)[\\/]/,
    left: '@react-fiber/3d, threejs-compat or three',
  },
];

for (const { app, name, forbidden, left } of BUNDLED) {
  const modules = await bundledModules(app);
  const unwanted = modules.filter((id) => forbidden.test(id));
  if (unwanted.length) {
    console.error(`${name} bundles a package it doesn't import:\n  ${unwanted.join('\n  ')}`);
    process.exit(1);
  }
  const ours = modules.filter((id) => id.includes(`${path.sep}packages${path.sep}`)).length;
  console.log(`${name} bundles ${ours} modules of the packages, none of ${left}`);
}
