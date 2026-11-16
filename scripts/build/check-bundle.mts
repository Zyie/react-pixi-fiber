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
 * It then type-checks two apps against the built declarations, found through `node_modules` and each
 * package's `exports`, strict and with TypeScript's default `skipLibCheck: false`, and fails on any
 * error, in the app or in `dist`: `consumer/app.tsx`, an r3f app on threejs-compat, and
 * `native/app.tsx`, an app on core, 2d and 3d alone. Last, it bundles the native app and fails when the
 * bundle holds a module of threejs-compat or three: without the compat package, nothing three-shaped is
 * bundled.
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

for (const app of ['consumer', 'native']) {
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
console.log('An app on threejs-compat and one on 2d and 3d alone type-check against the built declarations');

const bundle = await rolldown({
  input: path.join(REPO_ROOT, 'scripts/build/native/app.tsx'),
  cwd: REPO_ROOT,
  platform: 'browser',
  external: [/^react(?:-dom)?(?:\/|$)/, /^pixi\.js(?:\/|$)/, /^@pixi\/3d(?:\/|$)/],
  transform: { jsx: 'react-jsx' },
  logLevel: 'silent',
});
const { output } = await bundle.generate({ format: 'esm' });
await bundle.close();
const modules = output.flatMap((chunk) => (chunk.type === 'chunk' ? chunk.moduleIds : []));
const threeShaped = modules.filter((id) => /[\\/](?:threejs-compat|three)[\\/]/.test(id));

if (threeShaped.length) {
  console.error(`The app on 2d and 3d alone bundles threejs-compat or three:\n  ${threeShaped.join('\n  ')}`);
  process.exit(1);
}
const ours = modules.filter((id) => id.includes(`${path.sep}packages${path.sep}`)).length;
console.log(`The app on 2d and 3d alone bundles ${ours} modules of the packages, none of threejs-compat or three`);
