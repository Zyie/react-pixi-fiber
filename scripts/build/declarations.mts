/**
 * Marks the members of the built declarations that give a pixi-3d member three's type.
 *
 * In `@react-fiber/threejs-compat`, a catalog alias keeps three's types where pixi-3d's class types a member otherwise: a light's
 * `color` is a three `Color` where pixi-3d's is a pixi `Color`, a material's `emissive` is a `Color`
 * where pixi-3d's holds its emissive controls. TypeScript can't type such an override, so the source
 * marks each one with `@ts-expect-error`, which the declaration build drops. Without a mark, each is
 * a TS2416 error in an app that type-checks its libraries, as TypeScript does by default
 * (`skipLibCheck: false`). After every package is built (`npm run build`), this type-checks the
 * declarations of all of them (`consumer/tsconfig.dist.json`) and writes `@ts-ignore` above every line
 * TypeScript reports as TS2416. Any other error fails the build. `npm run test:bundle` checks an app
 * against the result.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const TSC = path.join(REPO_ROOT, 'node_modules/.bin/tsc');
const MARK = "// @ts-ignore -- three's type for a member pixi-3d types otherwise";
const DIAGNOSTIC = /^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/;

/** One error tsc reported */
interface Diagnostic {
  file: string;
  line: number;
  code: string;
  message: string;
}

/**
 * Type-checks a project with tsc and returns its errors
 * @param project - The tsconfig, from the repo root
 */
export function typeCheck(project: string): Diagnostic[] {
  const { stdout, stderr, error } = spawnSync(TSC, ['-p', project, '--pretty', 'false'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  if (error) throw error;

  return `${stdout}${stderr}`.split('\n').flatMap((text) => {
    const match = DIAGNOSTIC.exec(text);

    if (!match) return [];
    const [, file, line, code, message] = match;

    return [{ file: path.resolve(REPO_ROOT, file!), line: Number(line), code: code!, message: message! }];
  });
}

/**
 * Writes `@ts-ignore` above every member of the built declarations that retypes a pixi-3d member
 * @returns How many lines it marked
 * @throws When the declarations have an error other than TS2416
 */
export function markRetypedMembers(): number {
  const diagnostics = typeCheck('scripts/build/consumer/tsconfig.dist.json');
  const others = diagnostics.filter(({ code }) => code !== 'TS2416');

  if (others.length > 0) {
    const list = others.map(
      ({ file, line, code, message }) => `${path.relative(REPO_ROOT, file)}:${line} ${code} ${message}`,
    );
    throw new Error(`The built declarations don't type-check:\n  ${list.join('\n  ')}`);
  }

  const linesByFile = new Map<string, Set<number>>();

  for (const { file, line } of diagnostics) {
    if (!linesByFile.has(file)) linesByFile.set(file, new Set());
    linesByFile.get(file)!.add(line);
  }

  for (const [file, lines] of linesByFile) {
    const text = fs.readFileSync(file, 'utf8').split('\n');

    for (const line of [...lines].sort((a, b) => b - a)) {
      const indent = /^\s*/.exec(text[line - 1]!)![0];
      text.splice(line - 1, 0, `${indent}${MARK}`);
    }
    fs.writeFileSync(file, text.join('\n'));
  }

  return diagnostics.length;
}

if (import.meta.main) console.log(`Marked ${markRetypedMembers()} retyped members in dist`);
