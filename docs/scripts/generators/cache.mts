/**
 * Keeps what a generator built, keyed by a hash of everything it was built from, so a sync whose inputs
 * didn't change skips the work: the live runtime and the example pictures. An entry is a folder of
 * `node_modules/.cache/react-pixi-fiber-docs`, written whole through a rename, so callers syncing at
 * once never read half of one; the newest few of each name are kept.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from '../paths.mts';
import type { GeneratedFiles } from '../sync.mts';

const CACHE = path.join(ROOT, 'node_modules/.cache/react-pixi-fiber-docs');

/** How many entries of one name stay, for callers on different versions of the sources */
const KEEP = 3;

/** The lockfile, whose hash stands for the version of every package a build reads */
export const LOCKFILE = 'package-lock.json';

/** What a cached build made: its files, and what it says about them */
export interface Built<Meta> {
  readonly files: GeneratedFiles;
  readonly meta: Meta;
}

/**
 * A hash of texts and of the files under paths of the repo, by their paths and bytes
 * @param texts - Anything else the result depends on, such as options
 * @param paths - Files and folders, from the repo root
 */
export function hashOf(texts: readonly string[], paths: readonly string[] = []): string {
  const hash = createHash('sha256');

  for (const text of texts) hash.update(`${text}\0`);
  for (const source of paths) {
    const absolute = path.join(ROOT, source);
    const files = fs.statSync(absolute).isDirectory()
      ? fs
          .readdirSync(absolute, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => path.join(entry.parentPath, entry.name))
          .sort()
      : [absolute];

    for (const file of files) hash.update(`${path.relative(ROOT, file)}\0`).update(fs.readFileSync(file));
  }

  return hash.digest('hex').slice(0, 16);
}

/**
 * The files of a build from its cache entry, or from building it when there is none
 * @param name - What is built, which names its entries
 * @param key - The hash of its inputs
 * @param build - Makes the files
 */
export async function cached<Meta>(name: string, key: string, build: () => Promise<Built<Meta>>): Promise<Built<Meta>> {
  const entry = path.join(CACHE, `${name}@${key}`);
  const index = path.join(entry, '.index.json');

  if (fs.existsSync(index)) {
    const { files, meta } = JSON.parse(fs.readFileSync(index, 'utf8')) as { files: string[]; meta: Meta };

    fs.utimesSync(entry, new Date(), new Date());

    return { files: Object.fromEntries(files.map((file) => [file, fs.readFileSync(path.join(entry, file))])), meta };
  }

  const built = await build();
  const temp = `${entry}.${process.pid}.tmp`;

  fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });
  for (const [file, data] of Object.entries(built.files)) {
    fs.mkdirSync(path.dirname(path.join(temp, file)), { recursive: true });
    fs.writeFileSync(path.join(temp, file), data);
  }
  fs.writeFileSync(
    path.join(temp, '.index.json'),
    JSON.stringify({ files: Object.keys(built.files), meta: built.meta }),
  );
  try {
    fs.renameSync(temp, entry);
  } catch {
    // Another caller stored the same entry first
    fs.rmSync(temp, { recursive: true, force: true });
  }
  prune(name);

  return built;
}

/**
 * Deletes all but the newest `KEEP` entries of a name
 * @param name - The name
 */
function prune(name: string): void {
  const entries = fs
    .readdirSync(CACHE, { withFileTypes: true })
    .filter((each) => each.isDirectory() && each.name.startsWith(`${name}@`) && !each.name.endsWith('.tmp'))
    .map((each) => ({ folder: path.join(CACHE, each.name), time: fs.statSync(path.join(CACHE, each.name)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  for (const { folder } of entries.slice(KEEP)) fs.rmSync(folder, { recursive: true, force: true });
}
