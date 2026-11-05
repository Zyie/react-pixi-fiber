/**
 * Runs a program in a frame of its own: a sandboxed iframe with an opaque origin, so a program from a
 * shared link can't reach the page. The frame imports the runtime's modules from the site by URL, which
 * the site lets any origin read, so the browser caches them across runs and pages. The program and the
 * files it imports by a relative path go to the frame as blobs. The frame's bootstrap writes the import
 * map, then runs `frame/frame.ts`, which runs the program.
 */
import manifest from '@site/static/runtime/manifest.json';

import { CHANNEL, FILE_PREFIX } from './types';
import type { ControlMessage, FrameEvent, Renderer, RunError, RunMessage } from './types';

/** The frame's background, under the canvas until it draws: the visual tests' stage */
const STAGE = '#101010';

/** What a run reports: everything a frame tells its page, past its bootstrap */
export type RunEvent = Exclude<FrameEvent, { type: 'ready' }>;

/** A program to run */
export interface RunRequest {
  /** The program as JavaScript, from `compile` */
  readonly code: string;
  /** The text of each file the program imports by a relative path, by the path it's written as */
  readonly files?: Readonly<Record<string, string>>;
  readonly renderer: Renderer;
  /** The name the program goes by in an error's stack */
  readonly name: string;
  /** The site's base URL, `/` */
  readonly baseUrl: string;
}

/** A program running in its frame */
export interface Run {
  readonly frame: HTMLIFrameElement;
  /** Stops and starts its tickers, for while it's out of sight */
  setPaused(paused: boolean): void;
  /** Removes the frame, which ends the program and frees its GPU context */
  destroy(): void;
}

const SCRIPT_MIME = 'text/javascript';

/** The bare specifiers and relative paths a module's code imports */
const IMPORT = /(?:\bfrom|\bimport)\s*\(?\s*(["'])([^"'\n]+)\1/g;

/**
 * The frame's document. Its bootstrap waits for the run message, writes the import map, with a blob URL
 * for the program and each of its files, asks for every runtime file the run needs at once, then imports
 * the frame's module; it reports a failure to load that module itself.
 */
const FRAME_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:${STAGE}}canvas{display:block}</style>
</head>
<body>
<div id="root"></div>
<script>
addEventListener('message', function run(event) {
  var data = event.data;
  if (event.source !== parent || !data || data.type !== 'run') return;
  removeEventListener('message', run);
  var map = document.createElement('script');
  for (var file in data.files) data.imports[file] = URL.createObjectURL(data.files[file]);
  map.type = 'importmap';
  map.textContent = JSON.stringify({ imports: data.imports });
  document.head.appendChild(map);
  data.preload.forEach(function (href) {
    var link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = href;
    document.head.appendChild(link);
  });
  import(data.frame).then(function (frame) { return frame.run(data, URL.createObjectURL(data.program)); }).catch(function (error) {
    parent.postMessage({ channel: ${JSON.stringify(CHANNEL)}, type: 'error', error: { name: error && error.name || 'Error', message: String(error && error.message || error) } }, '*');
  });
});
parent.postMessage({ channel: ${JSON.stringify(CHANNEL)}, type: 'ready' }, '*');
</script>
</body>
</html>`;

/**
 * Every runtime file a module needs, itself included
 * @param file - The module's file
 * @param into - The files found so far
 */
function closure(file: string, into: Set<string>): Set<string> {
  if (into.has(file)) return into;
  into.add(file);
  for (const imported of manifest.imports[file] ?? []) closure(imported, into);

  return into;
}

/** The modules a program can import, for an error that names one it can't */
export const MODULES: readonly string[] = Object.keys(manifest.modules);

/**
 * The bare modules and relative files a program imports
 * @param code - The program as JavaScript
 */
export function importsOf(code: string): string[] {
  return [...new Set([...code.matchAll(IMPORT)].map((match) => match[2]!))];
}

/**
 * Turns a run request into the frame's message: the program's imports checked, its relative imports
 * renamed to bare specifiers the import map knows, and the URL of everything the frame loads from the site
 * @param request - The run
 * @throws {RunError} When the program imports something the runtime doesn't have
 */
function message(request: RunRequest): RunMessage {
  const site = new URL(request.baseUrl, location.href).href;
  const runtime = `${site}${manifest.base}`;
  const files: Record<string, Blob> = {};
  const needed = closure(manifest.frame, new Set());

  for (const specifier of importsOf(request.code)) {
    if (specifier.startsWith('.')) {
      const text = request.files?.[specifier];

      if (text === undefined) throw runError('ImportError', `This program can't import the file '${specifier}'.`);
      files[`${FILE_PREFIX}${specifier}`] = new Blob([`export default ${JSON.stringify(text)};\n`], {
        type: SCRIPT_MIME,
      });
      continue;
    }

    const module = manifest.modules[specifier];

    if (!module) {
      throw runError(
        'ImportError',
        `'${specifier}' isn't available here. A live example can import ${MODULES.map((name) => `'${name}'`).join(', ')}.`,
      );
    }
    closure(module, needed);
  }

  const code = request.code.replace(IMPORT, (match, quote: string, specifier: string) =>
    specifier.startsWith('.')
      ? match.replace(`${quote}${specifier}${quote}`, `${quote}${FILE_PREFIX}${specifier}${quote}`)
      : match,
  );

  return {
    type: 'run',
    imports: Object.fromEntries(
      Object.entries(manifest.modules).map(([specifier, file]) => [specifier, runtime + file]),
    ),
    preload: [...needed].map((file) => runtime + file),
    frame: runtime + manifest.frame,
    runtime,
    program: new Blob([code], { type: SCRIPT_MIME }),
    programName: request.name,
    files,
    renderer: request.renderer,
    assets: manifest.assets.map((asset) => ({ ...asset, file: site + asset.file })),
  };
}

let prefetched = false;

/**
 * Starts the downloads of a first run, at the browser's lowest priority, for when a pointer reaches a
 * button that runs a program; the frame's own requests are then answered from the HTTP cache
 * @param baseUrl - The site's base URL
 */
export function prefetchRuntime(baseUrl: string): void {
  if (prefetched) return;
  prefetched = true;
  const files = closure(manifest.frame, new Set());

  for (const module of ['react-pixi-fiber', 'react-dom/client']) {
    if (manifest.modules[module]) closure(manifest.modules[module], files);
  }
  for (const file of files) {
    const link = document.createElement('link');

    link.rel = 'prefetch';
    link.as = 'script';
    link.href = `${baseUrl}${manifest.base}${file}`;
    document.head.appendChild(link);
  }
}

/**
 * An error a run reports before its frame does
 * @param name - The error's name
 * @param message - What went wrong
 */
function runError(name: string, message: string): RunError {
  return { name, message };
}

/**
 * Runs a program in a new frame inside a host element
 * @param host - The element the frame goes in
 * @param request - The program
 * @param onEvent - Called with what the frame reports, and with an error that stops the run before it
 * @param title - The frame's accessible name
 */
export function startRun(
  host: HTMLElement,
  request: RunRequest,
  onEvent: (event: RunEvent) => void,
  title: string,
): Run {
  const frame = document.createElement('iframe');
  let destroyed = false;

  const onMessage = (event: MessageEvent<({ channel?: string } & FrameEvent) | null>): void => {
    if (destroyed || event.source !== frame.contentWindow || event.data?.channel !== CHANNEL) return;
    if (event.data.type !== 'ready') {
      onEvent(event.data);

      return;
    }
    try {
      frame.contentWindow?.postMessage(message(request), '*');
    } catch (error) {
      onEvent({ type: 'error', error: error as RunError });
    }
  };

  frame.setAttribute('sandbox', 'allow-scripts');
  frame.title = title;
  frame.srcdoc = FRAME_HTML;
  addEventListener('message', onMessage);
  host.appendChild(frame);

  return {
    frame,
    setPaused(paused) {
      const control: ControlMessage = { type: paused ? 'pause' : 'resume' };

      frame.contentWindow?.postMessage(control, '*');
    },
    destroy() {
      destroyed = true;
      removeEventListener('message', onMessage);
      frame.remove();
    },
  };
}
