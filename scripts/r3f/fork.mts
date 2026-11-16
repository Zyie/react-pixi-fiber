/**
 * Keeps `packages/r3f/fork.diff` the diff of `packages/r3f` (`@react-fiber/r3f`), our fork of
 * react-three-fiber's fiber package,
 * against the upstream commit `scripts/repos/manifest.mts` pins, read from `.repos/react-three-fiber`
 * (`npm run sync:repos`).
 *
 * - `node scripts/r3f/fork.mts --write` (`npm run diff:r3f`) writes the diff, and the size line of
 *   `packages/r3f/README.md` between its `diff-size` markers.
 * - `node scripts/r3f/fork.mts --check` fails when either is stale, when one of our own files is
 *   missing, or when `git apply` of the diff in a fresh git checkout of upstream's files doesn't give the
 *   fork's files exactly. `npm run test:lint` runs it.
 *
 * The diff covers what the fork copies from `packages/fiber` (`src`, `types`): changed, added and
 * deleted files, with paths from the root of react-three-fiber's repository (`packages/fiber/src/...`),
 * so `git apply fork.diff` takes it at the root of a clone. git reads a patch's paths from the
 * repository's root and skips, without an error, those outside the folder it runs in, so a diff
 * relative to `packages/fiber` applied there would change nothing. Our own files in the tree are listed
 * in `EXTRAS` and left out: the
 * react-reconciler shims sit at the relative path r3f's core imports (upstream generates that folder at
 * install time), the README is written for r3f's maintainers, the diff is this script's, and the
 * package is ours to name and build: its package.json is upstream's under the name `@react-fiber/r3f`
 * (in the diff, the rename would break upstream's workspace, whose packages depend on
 * `@react-three/fiber`), built with a tsconfig.json and a tsdown.config.ts of ours where upstream's build
 * reads its monorepo's tsconfig and its own unbuild config.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { referenceRepos } from '../repos/manifest.mts';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const UPSTREAM = '.repos/react-three-fiber';
const UPSTREAM_PACKAGE = `${UPSTREAM}/packages/fiber`;
/** Where the fork's files are in react-three-fiber's repository, which the diff's paths start from */
const PACKAGE_PATH = 'packages/fiber';
const FORK = 'packages/r3f';
const DIFF = `${FORK}/fork.diff`;
const README = `${FORK}/README.md`;
const SIZE_MARKERS = ['<!-- diff-size -->', '<!-- /diff-size -->'] as const;

/** What the fork copies from `packages/fiber`: whole folders, and single files */
const COPIED = ['src', 'types'];

/** Files in `packages/r3f` that are ours, relative to it */
const EXTRAS = new Set([
  'README.md',
  'fork.diff',
  'package.json',
  'tsconfig.json',
  'tsdown.config.ts',
  'react-reconciler/index.js',
  'react-reconciler/index.d.ts',
  'react-reconciler/constants.js',
  'react-reconciler/constants.d.ts',
]);

/**
 * Every file under `dir`, as paths relative to `base` with forward slashes
 * @param base - Folder the paths are relative to, from the repository root or absolute
 * @param dir - Folder or file to list, relative to `base`
 */
function listFiles(base: string, dir: string): string[] {
  const full = path.resolve(REPO_ROOT, base, dir);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [dir];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap((entry) => listFiles(base, path.posix.join(dir, entry.name)))
    .sort();
}

/**
 * The bytes of a file, or `null` when it doesn't exist
 * @param file - Path from the repository root, or absolute
 */
const read = (file: string): Buffer | null =>
  fs.existsSync(path.resolve(REPO_ROOT, file)) ? fs.readFileSync(path.resolve(REPO_ROOT, file)) : null;

/**
 * git's diff of one file of the fork against upstream, with paths from the root of upstream's repository
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
    (text, root) => text.replaceAll(`a/${root}/`, `a/${PACKAGE_PATH}/`).replaceAll(`b/${root}/`, `b/${PACKAGE_PATH}/`),
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
    `# packages/r3f against react-three-fiber packages/fiber at ${commit}`,
    '# Written by npm run diff:r3f. Apply it at the root of a clone of react-three-fiber at that commit:',
    '# git apply fork.diff',
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

/**
 * What differs between the fork's files and what `git apply` of the diff makes of upstream's, in a git
 * checkout of upstream's files of its own, as a maintainer's clone has them
 * @param diff - The diff
 */
function applyProblems(diff: string): string[] {
  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'r3f-fork-'));
  try {
    const target = path.join(clone, PACKAGE_PATH);
    for (const entry of COPIED) {
      const from = path.join(REPO_ROOT, UPSTREAM_PACKAGE, entry);
      if (fs.existsSync(from)) fs.cpSync(from, path.join(target, entry), { recursive: true });
    }
    execFileSync('git', ['init', '--quiet'], { cwd: clone });
    const applied = spawnSync('git', ['apply', '-'], { cwd: clone, input: diff, encoding: 'utf8' });
    if (applied.status !== 0) return [`git apply of ${DIFF} fails: ${applied.stderr.trim()}`];
    const ours = COPIED.flatMap((entry) => listFiles(FORK, entry));
    const theirs = COPIED.flatMap((entry) => listFiles(target, entry));
    return [...new Set([...ours, ...theirs])]
      .filter((file) => read(path.join(target, file))?.equals(read(`${FORK}/${file}`) ?? Buffer.alloc(0)) !== true)
      .map((file) => `git apply of ${DIFF} doesn't give the fork's ${file}`);
  } finally {
    fs.rmSync(clone, { recursive: true, force: true });
  }
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
  ...applyProblems(diff),
];
if (problems.length) {
  console.error(`packages/r3f:\n  ${problems.join('\n  ')}`);
  console.error('Run npm run diff:r3f to write the diff and its size.');
  process.exit(1);
}
console.log(`packages/r3f: ${sizeOf(diff)} against upstream`);
