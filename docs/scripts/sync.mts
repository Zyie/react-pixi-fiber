/**
 * Writes the site's generated content from the repo's sources: `node docs/scripts/sync.mts`.
 * `docs/scripts/site.mts` runs it before every build and dev server, and again in dev when a source
 * changes.
 *
 * Each area of the site has a generator in `docs/scripts/generators`, listed in `GENERATORS`. A generator
 * owns the folders it names in `outputs` and returns their files; it never writes. What two generators
 * both read, such as the API model or the pages of the Docs section, each gets from `shared`, which
 * builds it once per sync. The sync then:
 *
 * - writes a file only when its bytes changed, through a rename, so a reader never sees half a file;
 * - deletes the files of an output folder that its generator no longer returns, and the folders that
 *   leaves empty;
 * - puts a `.gitignore` of `*` in each output folder, so git, oxlint and oxfmt skip it.
 *
 * Several callers may sync at once: they write the same bytes, so none undoes another.
 */
import fs from 'node:fs';
import path from 'node:path';

import { api } from './generators/api.mts';
import { content } from './generators/content.mts';
import { examples } from './generators/examples.mts';
import { live } from './generators/live.mts';
import { ROOT, SITE } from './paths.mts';

export { ROOT, SITE };

/** The files a generator returns, by path from `docs/`, with their text or bytes */
export type GeneratedFiles = Record<string, string | Uint8Array>;

/**
 * The value a builder makes, built on its first call in a sync and shared by every generator of it
 * @param build - The builder, which may read other shared values
 */
export type Shared = <T>(build: (shared: Shared) => T) => T;

/** One area's generator of site content */
export interface Generator {
  /** Its name in the log */
  readonly name: string;
  /** The folders it owns, from `docs/`. No two generators share one, and nothing else writes in them. */
  readonly outputs: readonly string[];
  /** The files and folders it reads, from the repo root; the dev server syncs again when one changes */
  readonly sources: readonly string[];
  /** Every file of its outputs */
  generate(shared: Shared): GeneratedFiles | Promise<GeneratedFiles>;
}

/** Every generator, run in this order */
export const GENERATORS: readonly Generator[] = [content, examples, api, live];

const IGNORE_ALL = '*\n';

/** The values of one sync, each built on first use */
export function sharedValues(): Shared {
  const values = new Map<unknown, unknown>();
  const shared: Shared = <T,>(build: (shared: Shared) => T): T => {
    if (!values.has(build)) values.set(build, build(shared));

    return values.get(build) as T;
  };

  return shared;
}

/**
 * Writes a file when its bytes differ from what's there, through a temporary file and a rename
 * @param file - Absolute path
 * @param data - The text or bytes
 * @returns Whether it wrote
 */
function writeIfChanged(file: string, data: string | Uint8Array): boolean {
  const next = typeof data === 'string' ? Buffer.from(data) : data;
  const current = fs.existsSync(file) ? fs.readFileSync(file) : null;

  if (current?.equals(next)) return false;

  const temp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`);

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(temp, next);
  fs.renameSync(temp, file);

  return true;
}

/**
 * Deletes the empty folders under an output folder, deepest first, such as one whose files all went
 * stale. `rmdir` refuses a folder that isn't empty, so one another sync is writing to stays.
 * @param folder - Absolute path of the output folder
 */
function removeEmptyFolders(folder: string): void {
  const folders = fs
    .readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort((a, b) => b.length - a.length);

  for (const empty of folders) {
    try {
      fs.rmdirSync(empty);
    } catch {
      // Not empty, or another sync removed it first
    }
  }
}

/**
 * Runs generators and brings their output folders up to date
 * @param generators - The generators to run; all of them by default
 */
export async function sync(generators: readonly Generator[] = GENERATORS): Promise<void> {
  const owners = new Map<string, string>();
  const shared = sharedValues();

  for (const generator of GENERATORS) {
    for (const output of generator.outputs) {
      const clash = [...owners].find(
        ([other]) => `${output}/`.startsWith(`${other}/`) || `${other}/`.startsWith(`${output}/`),
      );

      if (clash) throw new Error(`sync: ${generator.name} and ${clash[1]} both claim ${output}`);
      owners.set(output, generator.name);
    }
  }

  const results = await Promise.all(
    generators.map(async (generator) => [generator, await generator.generate(shared)] as const),
  );

  for (const [generator, files] of results) {
    let written = 0;
    let removed = 0;

    for (const file of Object.keys(files)) {
      if (!generator.outputs.some((output) => file.startsWith(`${output}/`))) {
        throw new Error(
          `sync: ${generator.name} returned ${file}, outside its outputs ${generator.outputs.join(', ')}`,
        );
      }
    }
    for (const output of generator.outputs) {
      const folder = path.join(SITE, output);

      writeIfChanged(path.join(folder, '.gitignore'), IGNORE_ALL);
      for (const entry of fs.readdirSync(folder, { recursive: true, withFileTypes: true })) {
        const file = path.relative(SITE, path.join(entry.parentPath, entry.name)).split(path.sep).join('/');

        if (entry.isFile() && !entry.name.startsWith('.') && !Object.hasOwn(files, file)) {
          fs.rmSync(path.join(SITE, file), { force: true });
          removed++;
        }
      }
    }
    for (const [file, data] of Object.entries(files)) {
      if (writeIfChanged(path.join(SITE, file), data)) written++;
    }
    for (const output of generator.outputs) removeEmptyFolders(path.join(SITE, output));
    console.log(`sync: ${generator.name}, ${Object.keys(files).length} files (${written} written, ${removed} removed)`);
  }
}

if (import.meta.main) await sync();
