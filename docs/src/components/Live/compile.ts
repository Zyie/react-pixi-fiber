import { transform } from 'sucrase';

/** Where a program failed to compile, 1-based */
export interface CompileError {
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Compiles a program from TypeScript to JavaScript the browser runs, line for line, so a line of an
 * error's stack is a line of the source. JSX uses React's automatic runtime, and modern syntax is
 * kept as it is.
 * @param code - The program
 * @param language - `tsx` parses JSX
 * @returns The JavaScript
 * @throws {SyntaxError} With a `loc` of `{ line, column }` where the program doesn't parse
 */
export function compile(code: string, language: 'ts' | 'tsx'): string {
  return transform(code, {
    transforms: language === 'tsx' ? ['typescript', 'jsx'] : ['typescript'],
    jsxRuntime: 'automatic',
    production: true,
    disableESTransforms: true,
  }).code;
}

/**
 * The message and place of a compile error
 * @param error - What `compile` threw
 */
export function compileError(error: unknown): CompileError {
  const loc = (error as { loc?: { line: number; column: number } }).loc;
  const message = error instanceof Error ? error.message.replace(/\s*\(\d+:\d+\)$/, '') : String(error);

  return loc ? { message, line: loc.line, column: loc.column } : { message };
}
