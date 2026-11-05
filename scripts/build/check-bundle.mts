/**
 * Checks the built package: `npm run build`, then `npm run test:bundle`.
 *
 * three must not be a runtime dependency of the library. It is a devDependency only so the vendored
 * r3f entries (`src/r3f/src/legacy.tsx`) can render the same scenes through three for parity. This
 * fails when any file in `dist`, of any entry (`react-pixi-fiber`, `react-pixi-fiber/three`,
 * `react-pixi-fiber/addons`), imports `three` or a `three/...` subpath, statically, dynamically or as a
 * declaration import, or when `package.json` lists three as a dependency or peer dependency.
 *
 * It then type-checks an app against the built declarations (`consumer/app.tsx`), strict and with
 * TypeScript's default `skipLibCheck: false`, and fails on any error, in the app or in `dist`.
 */
import fs from 'node:fs';
import path from 'node:path';

import { typeCheck } from './declarations.mts';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const DIST = path.join(REPO_ROOT, 'dist');
const THREE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"])(three|@types\/three)(?:\/[^'"]*)?\1/g;

/**
 * Every file under `dir`
 * @param dir - Folder to list
 */
function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}

if (!fs.existsSync(DIST)) {
  console.error('dist is missing; run npm run build first');
  process.exit(1);
}

const problems: string[] = [];
const files = listFiles(DIST).filter((file) => /\.(?:[cm]?js|d\.[cm]?ts)$/.test(file));

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(THREE_IMPORT)) {
    const line = source.slice(0, match.index).split('\n').length;
    problems.push(`${path.relative(REPO_ROOT, file)}:${line} imports ${match[0]}`);
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as Record<
  string,
  Record<string, string> | undefined
>;
for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  if (pkg[field]?.three) problems.push(`package.json lists three in ${field}`);
}

if (problems.length) {
  console.error(`The built package depends on three.js:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`dist is free of three.js (${files.length} files)`);

const errors = typeCheck('scripts/build/consumer/tsconfig.json');

if (errors.length) {
  const list = errors.map(
    ({ file, line, code, message }) => `${path.relative(REPO_ROOT, file)}:${line} ${code} ${message}`,
  );
  console.error(`An app doesn't type-check against the built declarations:\n  ${list.join('\n  ')}`);
  process.exit(1);
}
console.log('An app type-checks against the built declarations with skipLibCheck off');
