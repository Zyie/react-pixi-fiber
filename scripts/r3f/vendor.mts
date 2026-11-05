/**
 * Keeps `src/r3f` a byte-for-byte copy of react-three-fiber's fiber package, read from
 * `.repos/react-three-fiber` (`npm run sync:repos`).
 *
 * - `node scripts/r3f/vendor.mts --check` fails on any difference: a changed, missing or extra file.
 *   `npm run test:lint` runs it.
 * - `node scripts/r3f/vendor.mts --write` copies the upstream files over, deletes vendored files
 *   upstream no longer has, and rewrites `src/r3f/README.md` with the upstream commit.
 *
 * The copy is never edited by hand. Our own files in the tree are listed in `EXTRAS`: the
 * react-reconciler shims sit at the relative path r3f's core imports (upstream generates that folder
 * at install time), and the README is written by this script.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const UPSTREAM = path.join(REPO_ROOT, '.repos/react-three-fiber');
const UPSTREAM_PACKAGE = path.join(UPSTREAM, 'packages/fiber');
const VENDORED = path.join(REPO_ROOT, 'src/r3f');

/** What is copied from `packages/fiber`: whole folders, and single files */
const COPIED = ['src', 'types', 'package.json'];

/** Files in `src/r3f` that are ours, relative to it */
const EXTRAS = new Set([
  'README.md',
  'react-reconciler/index.js',
  'react-reconciler/index.d.ts',
  'react-reconciler/constants.js',
  'react-reconciler/constants.d.ts',
]);

/**
 * Every file under `dir`, as paths relative to `base` with forward slashes
 * @param base - Folder the paths are relative to
 * @param dir - Folder or file to list, relative to `base`
 */
function listFiles(base: string, dir: string): string[] {
  const full = path.join(base, dir);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [dir];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap((entry) => listFiles(base, path.posix.join(dir, entry.name)))
    .sort();
}

/** The README `--write` generates, naming the upstream commit the copy came from */
function readme(): string {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: UPSTREAM, encoding: 'utf8' }).trim();
  return [
    '# Vendored react-three-fiber',
    '',
    `A byte-for-byte copy of \`packages/fiber\` (\`src\`, \`types\`, \`package.json\`) from`,
    `[react-three-fiber](https://github.com/pmndrs/react-three-fiber) \`v10\` at commit \`${sha}\`.`,
    '',
    'Never edit these files. `npm run test:lint` fails on any difference from `.repos/react-three-fiber`;',
    'run `node scripts/r3f/vendor.mts --write` after `npm run sync:repos` to take a new upstream commit.',
    '',
    'Our own files here: this README (written by the script) and `react-reconciler/`, which stands in for',
    "the ESM build of react-reconciler that upstream generates at install time, at the path r3f's core imports.",
    '',
  ].join('\n');
}

if (!fs.existsSync(UPSTREAM_PACKAGE)) {
  console.error('.repos/react-three-fiber is missing; run npm run sync:repos first');
  process.exit(1);
}

const mode = process.argv[2];
if (mode !== '--check' && mode !== '--write') {
  console.error('Usage: node scripts/r3f/vendor.mts --check | --write');
  process.exit(1);
}

const upstreamFiles = COPIED.flatMap((entry) => listFiles(UPSTREAM_PACKAGE, entry));
const upstreamSet = new Set(upstreamFiles);
const vendoredFiles = listFiles(VENDORED, '.').map((file) => file.replace(/^\.\//, ''));

const changed = upstreamFiles.filter((file) => {
  const target = path.join(VENDORED, file);
  return !fs.existsSync(target) || !fs.readFileSync(target).equals(fs.readFileSync(path.join(UPSTREAM_PACKAGE, file)));
});
const extra = vendoredFiles.filter((file) => !upstreamSet.has(file) && !EXTRAS.has(file));
const missingExtras = [...EXTRAS].filter((file) => file !== 'README.md' && !vendoredFiles.includes(file));
const readmePath = path.join(VENDORED, 'README.md');
const staleReadme = !fs.existsSync(readmePath) || fs.readFileSync(readmePath, 'utf8') !== readme();

if (mode === '--write') {
  for (const file of changed) {
    fs.mkdirSync(path.dirname(path.join(VENDORED, file)), { recursive: true });
    fs.copyFileSync(path.join(UPSTREAM_PACKAGE, file), path.join(VENDORED, file));
  }
  for (const file of extra) fs.rmSync(path.join(VENDORED, file));
  if (staleReadme) fs.writeFileSync(readmePath, readme());
  console.log(`src/r3f: ${changed.length} copied, ${extra.length} deleted${staleReadme ? ', README updated' : ''}`);
  if (missingExtras.length) console.warn(`src/r3f: missing our own files: ${missingExtras.join(', ')}`);
  process.exit(0);
}

const problems = [
  ...changed.map((file) => `differs from upstream: ${file}`),
  ...extra.map((file) => `not in upstream: ${file}`),
  ...missingExtras.map((file) => `missing: ${file}`),
  ...(staleReadme ? ['README.md names another upstream commit'] : []),
];
if (problems.length) {
  console.error(`src/r3f is not a copy of .repos/react-three-fiber/packages/fiber:\n  ${problems.join('\n  ')}`);
  console.error('Never edit src/r3f. Run node scripts/r3f/vendor.mts --write to resync it.');
  process.exit(1);
}
console.log(`src/r3f matches upstream (${upstreamFiles.length} files)`);
