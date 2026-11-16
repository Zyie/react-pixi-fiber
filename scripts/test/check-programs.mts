/**
 * Checks that `npm run test:types` checks every TypeScript file of the repo in one program, and the
 * right one: each is named by the `include` of exactly one of `tsconfig.json`, which has
 * threejs-compat in its program, and `tsconfig.native.json`, the folders the native vitest project runs,
 * without it. A file named by neither is never type-checked, and a native file named by `tsconfig.json`
 * is checked against three's types for a root, so a new file or folder fails here until it goes in one.
 * A file the other program imports, such as the harness, is checked there too; only the `include` that
 * names it counts. `packages/r3f` is checked through what core imports from it, and `packages/docs` by
 * `npm run test:docs`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const TSC = path.join(REPO_ROOT, 'node_modules/.bin/tsc');
const PROGRAMS = ['tsconfig.json', 'tsconfig.native.json'];
const CHECKED_ELSEWHERE = new Set(['packages/r3f', 'packages/docs']);
const SKIPPED = new Set(['node_modules', 'dist']);

/**
 * The files a tsconfig's `include` names, from the repo root
 * @param project - The tsconfig, from the repo root
 */
function namedBy(project: string): Set<string> {
  const config = execFileSync(TSC, ['--showConfig', '-p', project], { cwd: REPO_ROOT, encoding: 'utf8' });
  const { files } = JSON.parse(config) as { files: string[] };
  return new Set(files.map((file) => path.normalize(file)));
}

/**
 * Every TypeScript file under a folder, from the repo root, but in hidden folders, dependencies and builds
 * @param dir - The folder, from the repo root
 */
function sourcesIn(dir: string): string[] {
  return fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (!entry.isDirectory()) return /\.[cm]?tsx?$/.test(entry.name) ? [file] : [];
    if (entry.name.startsWith('.') || SKIPPED.has(entry.name) || CHECKED_ELSEWHERE.has(file)) return [];
    return sourcesIn(file);
  });
}

const named = PROGRAMS.map(namedBy);
const sources = sourcesIn('');
const problems = sources.flatMap((file) => {
  const owners = PROGRAMS.filter((_, index) => named[index]!.has(file));
  if (owners.length === 1) return [];
  return [`${file} is named by ${owners.length === 0 ? 'neither' : owners.join(' and ')}`];
});

if (problems.length) {
  console.error(
    `Each TypeScript file goes in exactly one of ${PROGRAMS.join(' and ')}, the native folders in the second:\n  ` +
      problems.join('\n  '),
  );
  process.exit(1);
}
console.log(`Each of ${sources.length} TypeScript files is in exactly one of ${PROGRAMS.join(' and ')}`);
