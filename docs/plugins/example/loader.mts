/**
 * The bundler loader `remark.mts` requires an example through: it turns the file into an
 * `ExampleSource`, its code (or the parts of one region) as the guides show it, the program the live
 * frame runs, and where the site serves the reference image of its visual test, with its size, so the
 * picture takes its place before it loads.
 */
import fs from 'node:fs';
import path from 'node:path';

import { ROOT, SITE } from '../../scripts/paths.mts';
import { readRegion } from '../../scripts/typedoc/snippets.mts';
import { exampleId, PICTURES, pictureUrl, referencePicture } from './catalogue.mts';
import { exampleProgram } from './source.mts';
import type { ExampleSource } from './types.ts';

/** The part of the bundler's loader context the loader uses */
interface LoaderContext {
  readonly resourcePath: string;
  getOptions(): { region?: string };
  addDependency(file: string): void;
  addContextDependency(folder: string): void;
}

/**
 * The loader
 * @param this - The bundler's loader context
 * @returns An ES module whose default export is the `ExampleSource`
 */
export default function exampleLoader(this: LoaderContext): string {
  const file = path.relative(ROOT, this.resourcePath).split(path.sep).join('/');
  const { region } = this.getOptions();
  const id = exampleId(file);

  if (id === null) throw new Error(`${file} isn't an example, examples/<topic>/<name>.example.ts(x)`);

  const program = exampleProgram(file);
  const reference = path.join(ROOT, referencePicture(id));
  const src = pictureUrl(PICTURES, id);

  for (const specifier of program.relativeImports) {
    this.addDependency(path.resolve(path.dirname(this.resourcePath), specifier.split('?')[0]!));
  }
  // The sync writes the picture from the reference image, so it comes, goes and changes size with it
  this.addContextDependency(path.join(SITE, 'static', PICTURES, path.dirname(id)));
  this.addDependency(reference);

  if (region && !program.regions[region]) throw new Error(`${file} has no region ${region}`);

  const header = src ? fs.readFileSync(reference) : null;
  const source: ExampleSource = {
    id,
    code: region ? readRegion(file, region, ROOT) : program.code.trimEnd(),
    language: program.language,
    program: program.code,
    compiled: program.compiled,
    focus: region ? program.regions[region]! : [],
    files: program.files,
    picture: header && src ? { src, width: header.readUInt32BE(16), height: header.readUInt32BE(20) } : null,
  };

  return `export default ${JSON.stringify(source)};`;
}
