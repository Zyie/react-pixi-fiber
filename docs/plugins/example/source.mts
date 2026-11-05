/**
 * An example file as the site runs it: the program the frame imports, compiled, with the files it
 * imports as text. The loader of `<Example>` and the examples generator both build it here.
 */
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from '../../scripts/paths.mts';
import type { Shared } from '../../scripts/sync.mts';
import { compile } from '../../src/components/Live/compile.ts';
import { listExamples } from './catalogue.mts';
import type { Program } from './program.mts';
import { toProgram } from './program.mts';

/** An example's program, ready to run */
export interface ExampleProgram extends Program {
  readonly language: 'ts' | 'tsx';
  /** `code` as JavaScript, line for line, so a first run needs no compiler in the page */
  readonly compiled: string;
  /** The text of each file the program imports by a relative path, by the import as written */
  readonly files: Readonly<Record<string, string>>;
}

/**
 * The program of an example
 * @param file - The example, from the repo root
 * @throws When the example imports another file as anything but text
 */
export function exampleProgram(file: string): ExampleProgram {
  const language = file.endsWith('.tsx') ? 'tsx' : 'ts';
  const program = toProgram(fs.readFileSync(path.join(ROOT, file), 'utf8'), file);
  const files: Record<string, string> = {};

  for (const specifier of program.relativeImports) {
    const [relative = '', query] = specifier.split('?');

    if (query !== 'raw') continue;
    files[specifier] = fs.readFileSync(path.join(ROOT, path.posix.dirname(file), relative), 'utf8');
  }

  return { ...program, language, compiled: compile(program.code, language), files };
}

/**
 * The program of every example, by id; a sync builds them once, for the gallery and the API reference
 * @param shared - The values of the sync
 */
export function examplePrograms(shared: Shared): ReadonlyMap<string, ExampleProgram> {
  return new Map(shared(listExamples).map(({ id, file }) => [id, exampleProgram(file)]));
}
