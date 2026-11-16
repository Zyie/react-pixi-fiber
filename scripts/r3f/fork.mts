/**
 * Keeps `src/r3f/fork.diff` the diff of `src/r3f`, our fork of react-three-fiber's fiber package,
 * against the upstream commit `scripts/repos/manifest.mts` pins, read from `.repos/react-three-fiber`
 * (`npm run sync:repos`).
 *
 * - `node scripts/r3f/fork.mts --write` (`npm run diff:r3f`) writes the diff, and the size line of
 *   `src/r3f/README.md` between its `diff-size` markers.
 * - `node scripts/r3f/fork.mts --check` fails when either is stale or one of our own files is missing.
 *   `npm run test:lint` runs it.
 *
 * The diff covers what the fork copies from `packages/fiber` (`src`, `types`, `package.json`): changed,
 * added and deleted files, with paths relative to `packages/fiber`, so `git apply` takes it in an
 * upstream checkout of that folder. Our own files in the tree are listed in `EXTRAS` and left out: the
 * react-reconciler shims sit at the relative path r3f's core imports (upstream generates that folder at
 * install time), the README is written for r3f's maintainers, and the diff is this script's.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { referenceRepos } from '../repos/manifest.mts';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const UPSTREAM = '.repos/react-three-fiber';
const UPSTREAM_PACKAGE = `${UPSTREAM}/packages/fiber`;
const FORK = 'src/r3f';
const DIFF = `${FORK}/fork.diff`;
const README = `${FORK}/README.md`;
const SIZE_MARKERS = ['<!-- diff-size -->', '<!-- /diff-size -->'] as const;

/** What the fork copies from `packages/fiber`: whole folders, and single files */
const COPIED = ['src', 'types', 'package.json'];

/** Files in `src/r3f` that are ours, relative to it */
const EXTRAS = new Set([
  'README.md',
  'fork.diff',
  'react-reconciler/index.js',
  'react-reconciler/index.d.ts',
  'react-reconciler/constants.js',
  'react-reconciler/constants.d.ts',
]);

/**
 * Every file under `dir`, as paths relative to `base` with forward slashes
 * @param base - Folder the paths are relative to, from the repository root
 * @param dir - Folder or file to list, relative to `base`
 */
function listFiles(base: string, dir: string): string[] {
  const full = path.join(REPO_ROOT, base, dir);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [dir];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap((entry) => listFiles(base, path.posix.join(dir, entry.name)))
    .sort();
}

/**
 * The bytes of a file, or `null` when it doesn't exist
 * @param file - Path from the repository root
 */
const read = (file: string): Buffer | null =>
  fs.existsSync(path.join(REPO_ROOT, file)) ? fs.readFileSync(path.join(REPO_ROOT, file)) : null;

/**
 * git's diff of one file of the fork against upstream, with paths relative to `packages/fiber`
 * @param file - Path relative to `packages/fiber`
 * @param inUpstream - Whether upstream has the file
 * @param inFork - Whether the fork has it
 */
function diffFile(file: string, inUpstream: boolean, inFork: boolean): string {
  const from = inUpstream ? `${UPSTREAM_PACKAGE}/${file}` : '/dev/null';
  const to = inFork ? `${FORK}/${file}` : '/dev/null';
  const { stdout, status } = spawnSync(
    'git',
    ['diff', '--no-index', '--no-color', '--no-ext-diff', '--src-prefix=a/', '--dst-prefix=b/', from, to],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  if (status !== 0 && status !== 1) throw new Error(`git diff failed on ${file}`);
  return [UPSTREAM_PACKAGE, FORK].reduce(
    (text, root) => text.replaceAll(`a/${root}/`, 'a/').replaceAll(`b/${root}/`, 'b/'),
    stdout,
  );
}

/** The pinned upstream commit, which `.repos/react-three-fiber` must be checked out at */
function pinnedCommit(): string {
  const pin = referenceRepos.find((repo) => repo.name === 'react-three-fiber')?.ref;
  if (typeof pin !== 'string' || !/^[0-9a-f]{40}$/.test(pin)) {
    throw new Error('scripts/repos/manifest.mts must pin react-three-fiber to a full commit sha');
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(REPO_ROOT, UPSTREAM), encoding: 'utf8' });
  if (head.trim() !== pin) throw new Error(`${UPSTREAM} is not at ${pin}; run npm run sync:repos react-three-fiber`);
  return pin;
}

/**
 * The fork's diff, headed by the commit it is against
 * @param commit - The upstream commit
 */
function forkDiff(commit: string): string {
  const upstream = new Set(COPIED.flatMap((entry) => listFiles(UPSTREAM_PACKAGE, entry)));
  const fork = new Set(COPIED.flatMap((entry) => listFiles(FORK, entry)));
  const same = (file: string): boolean => {
    const ours = read(`${FORK}/${file}`);
    return ours !== null && read(`${UPSTREAM_PACKAGE}/${file}`)?.equals(ours) === true;
  };
  const changed = [...new Set([...upstream, ...fork])].sort().filter((file) => !same(file));
  const header = [
    `# src/r3f against react-three-fiber packages/fiber at ${commit}`,
    '# Written by npm run diff:r3f; apply in packages/fiber with git apply.',
    '',
  ].join('\n');
  return header + changed.map((file) => diffFile(file, upstream.has(file), fork.has(file))).join('');
}

/**
 * The size line of a diff: files touched, lines added and removed
 * @param diff - The diff
 */
function sizeOf(diff: string): string {
  const lines = diff.split('\n');
  const files = lines.filter((line) => line.startsWith('diff --git ')).length;
  const added = lines.filter((line) => line.startsWith('+') && !line.startsWith('+++ ')).length;
  const removed = lines.filter((line) => line.startsWith('-') && !line.startsWith('--- ')).length;
  return `${files} files changed, ${added} lines added, ${removed} lines removed`;
}

/**
 * The README with its size line set
 * @param readme - The README as it is
 * @param size - The size line
 */
function withSize(readme: string, size: string): string {
  const [open, close] = SIZE_MARKERS;
  const start = readme.indexOf(open);
  const end = readme.indexOf(close);
  if (start === -1 || end < start) throw new Error(`${README} has no ${open} ... ${close} markers`);
  return `${readme.slice(0, start + open.length)}${size}${readme.slice(end)}`;
}

const mode = process.argv[2];
if (mode !== '--check' && mode !== '--write') {
  console.error('Usage: node scripts/r3f/fork.mts --check | --write');
  process.exit(1);
}

const diff = forkDiff(pinnedCommit());
const readme = read(README)?.toString('utf8') ?? '';
const readmeWithSize = withSize(readme, sizeOf(diff));

if (mode === '--write') {
  fs.writeFileSync(path.join(REPO_ROOT, DIFF), diff);
  fs.writeFileSync(path.join(REPO_ROOT, README), readmeWithSize);
  console.log(`${DIFF}: ${sizeOf(diff)}`);
  process.exit(0);
}

const problems = [
  ...(read(DIFF)?.toString('utf8') === diff ? [] : [`${DIFF} is not the fork's diff against upstream`]),
  ...(readme === readmeWithSize ? [] : [`${README} gives another diff size`]),
  ...[...EXTRAS].filter((file) => file !== 'fork.diff' && !read(`${FORK}/${file}`)).map((file) => `missing: ${file}`),
];
if (problems.length) {
  console.error(`src/r3f:\n  ${problems.join('\n  ')}`);
  console.error('Run npm run diff:r3f to write the diff and its size.');
  process.exit(1);
}
console.log(`src/r3f: ${sizeOf(diff)} against upstream`);
