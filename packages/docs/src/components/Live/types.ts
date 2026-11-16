/** The renderer a run asks pixi for */
export type Renderer = 'webgpu' | 'webgl';

/** The name of each renderer, as the site writes it */
export const RENDERER_LABELS: Readonly<Record<Renderer, string>> = { webgl: 'WebGL', webgpu: 'WebGPU' };

/**
 * Whether a value, such as a query parameter or what pixi reports, names a renderer
 * @param value - The value
 */
export function isRenderer(value: unknown): value is Renderer {
  return value === 'webgl' || value === 'webgpu';
}

/** The language of a program */
export type Language = 'ts' | 'tsx';

/** A console method a program called */
export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/** One call to the console of a run */
export interface ConsoleEntry {
  readonly level: ConsoleLevel;
  readonly text: string;
}

/** The most entries a console keeps */
const MAX_ENTRIES = 500;

/**
 * A console's entries with one more at the end, the oldest dropped once there are too many
 * @param entries - The entries so far
 * @param entry - The new one
 */
export function withEntry(entries: readonly ConsoleEntry[], entry: ConsoleEntry): ConsoleEntry[] {
  return [...entries.slice(1 - MAX_ENTRIES), entry];
}

/**
 * The name of the renderer pixi says it drew with, as the site writes it
 * @param name - `renderer.name`
 */
export function rendererLabel(name: string): string {
  return isRenderer(name) ? RENDERER_LABELS[name] : name === 'canvas' ? 'Canvas' : name;
}

/** What went wrong in a run: a compile error, an exception or a rejected promise */
export interface RunError {
  readonly name: string;
  readonly message: string;
  /** The stack, with the program's and the runtime's URLs replaced by their names */
  readonly stack?: string;
  /** Where in the program, 1-based, when the error says */
  readonly line?: number;
  readonly column?: number;
}

/** A file of `static/runtime` a program can load */
export interface RuntimeAsset {
  /** The name a program loads it by, `Assets.load('crate.png')`, or `useLoader(TextureLoader, 'crate.png')` */
  readonly alias: string;
  /** Its path from the site root */
  readonly file: string;
}

/**
 * `static/runtime/manifest.json`, which `docs/scripts/generators/live.mts` writes: the ES modules a
 * program can import, built from the repo's sources and the pinned packages, and what they import
 */
export interface RuntimeManifest {
  /** The folder of the modules, from the site root */
  readonly base: string;
  /** The file of each module a program can import, by the name it imports it by */
  readonly modules: Readonly<Record<string, string>>;
  /** The file of the frame's own module, `src/components/Live/frame/frame.ts` */
  readonly frame: string;
  /** The files each file imports, statically or dynamically */
  readonly imports: Readonly<Record<string, readonly string[]>>;
  readonly assets: readonly RuntimeAsset[];
}

/** The prefix of the specifier a program imports one of its own files by, `@file:./theme.css?raw` */
export const FILE_PREFIX = '@file:';

/** The `channel` of every message between a page and its frames */
export const CHANNEL = 'react-pixi-fiber-live';

/** What the page sends a frame to run a program */
export interface RunMessage {
  readonly type: 'run';
  /** The URL of each module a program can import, by its specifier, for the frame's import map */
  readonly imports: Readonly<Record<string, string>>;
  /** The URL of every runtime file the run loads, which the frame asks for at once */
  readonly preload: readonly string[];
  /** The URL of the frame's module */
  readonly frame: string;
  /** The URL of the runtime's folder, which an error's stack names its files without */
  readonly runtime: string;
  readonly program: Blob;
  /** The name the program goes by in a stack */
  readonly programName: string;
  /** The module of each file the program imports by a relative path, by the specifier it's renamed to */
  readonly files: Readonly<Record<string, Blob>>;
  readonly renderer: Renderer;
  /** The assets, each `file` its URL */
  readonly assets: readonly RuntimeAsset[];
}

/** What the page sends a running frame */
export interface ControlMessage {
  readonly type: 'pause' | 'resume';
}

/** What a frame tells its page */
export type FrameEvent =
  | { readonly type: 'ready' }
  | { readonly type: 'rendered'; readonly renderer: string }
  | { readonly type: 'evaluated' }
  | { readonly type: 'console'; readonly entry: ConsoleEntry }
  | { readonly type: 'error'; readonly error: RunError };
