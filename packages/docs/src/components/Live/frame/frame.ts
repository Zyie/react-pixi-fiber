import { DefaultLoadingManager } from '@react-fiber/threejs-compat/three';
/**
 * The module a live example's frame runs before the program: it reports the console and errors to the
 * page, tells the page once pixi has drawn a frame and with which renderer, registers the runtime's
 * assets under their names, then imports the program and mounts its example (`mount.tsx`).
 * `docs/scripts/generators/live.mts` builds it with the runtime, so it shares the program's
 * react-pixi-fiber, pixi.js and React.
 */
import { AbstractRenderer, Assets, Ticker } from 'pixi.js';

import { CHANNEL } from '../types';
import type { ConsoleLevel, FrameEvent, RunError, RunMessage } from '../types';
import { mount } from './mount';

const LEVELS: readonly ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

/** The tickers the page paused while it couldn't see the frame */
const paused = new Set<Ticker>();

/**
 * Tells the page something
 * @param event - What happened
 */
function post(event: FrameEvent): void {
  parent.postMessage({ channel: CHANNEL, ...event }, '*');
}

/**
 * A value as the console panel shows it
 * @param value - The value
 * @param depth - How deep in an object it is
 */
function format(value: unknown, depth = 0): string {
  if (typeof value === 'string') return depth ? JSON.stringify(value) : value;
  if (typeof value === 'function') return `ƒ ${value.name || 'anonymous'}()`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value !== 'object' || value === null) return String(value);

  const name = value.constructor?.name;

  if (depth > 1) return Array.isArray(value) ? `Array(${value.length})` : `${name ?? 'Object'} {…}`;
  if (Array.isArray(value)) {
    const items = value.slice(0, 20).map((item) => format(item, depth + 1));

    return `[${items.join(', ')}${value.length > 20 ? ', …' : ''}]`;
  }
  if (value instanceof Map || value instanceof Set) return `${name}(${value.size})`;
  if (name && name !== 'Object') return `${name} {…}`;

  const entries = Object.entries(value);
  const shown = entries.slice(0, 20).map(([key, item]) => `${key}: ${format(item, depth + 1)}`);

  return `{ ${shown.join(', ')}${entries.length > 20 ? ', …' : ''} }`;
}

/**
 * The text of a console call, with `%s`, `%d`, `%o` and `%c` applied
 * @param args - The call's arguments
 */
function formatArgs(args: unknown[]): string {
  const rest = [...args];
  let text = '';

  if (typeof rest[0] === 'string' && rest[0].includes('%')) {
    text = rest.shift() as string;
    text = text.replace(/%([sdifoOc%])/g, (match, kind: string) => {
      if (kind === '%') return '%';
      if (!rest.length) return match;

      const arg = rest.shift();

      return kind === 'c' ? '' : format(arg, 1);
    });
  }

  return [text, ...rest.map((arg) => format(arg))].filter(Boolean).join(' ');
}

/**
 * Makes an error something the page can show, with the program and the runtime's files named in its stack
 * @param error - What was thrown
 * @param message - The run, which names the program and says where the runtime is
 * @param program - The program's URL
 */
function describe(error: unknown, message: RunMessage, program: string): RunError {
  if (!(error instanceof Error)) return { name: 'Error', message: format(error) };

  const stack = error.stack ?? '';
  const at = stack.split(program)[1]?.match(/^:(\d+):(\d+)/);

  return {
    name: error.name,
    message: error.message,
    stack:
      stack
        .replaceAll(program, message.programName)
        .replaceAll(message.runtime, '')
        .replace(`${error.name}: ${error.message}`, '')
        .trim() || undefined,
    ...(at ? { line: Number(at[1]), column: Number(at[2]) } : {}),
  };
}

/**
 * Sends the console and uncaught errors to the page
 * @param message - The run
 * @param program - The program's URL
 */
function capture(message: RunMessage, program: string): (error: unknown) => void {
  const report = (error: unknown): void => post({ type: 'error', error: describe(error, message, program) });

  for (const level of LEVELS) {
    const original = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      original(...args);
      post({ type: 'console', entry: { level, text: formatArgs(args) } });
    };
  }
  addEventListener('error', (event) => report(event.error ?? event.message));
  addEventListener('unhandledrejection', (event) => report(event.reason));

  return report;
}

/** Tells the page once any pixi renderer has drawn a frame, and which renderer it is */
function watchFirstFrame(): void {
  type Render = (this: AbstractRenderer<never, never>, ...args: unknown[]) => void;
  const prototype = AbstractRenderer.prototype as unknown as { render: Render };
  const render = prototype.render;
  let rendered = false;

  prototype.render = function renderInFrame(...args) {
    render.apply(this, args);
    if (rendered) return;
    rendered = true;
    // The frame the renderer just drew reaches the screen on the next one
    requestAnimationFrame(() => post({ type: 'rendered', renderer: this.name }));
  };
}

/**
 * Stops or starts the shared ticker, which pixi-3d's helpers run on; r3f's own loop stops by itself
 * while the frame is out of sight, as the browser stops its animation frames
 * @param pause - Whether to stop it
 */
function setPaused(pause: boolean): void {
  const ticker = Ticker.shared;

  if (pause && ticker.started) {
    ticker.stop();
    paused.add(ticker);
  } else if (!pause && paused.delete(ticker)) {
    ticker.start();
  }
}

/**
 * Has three's loaders (`TextureLoader`, `GLTFLoader`, ...) load the runtime's assets by the paths the
 * visual tests serve them at, `/textures/crate.png`, as pixi's `Assets` loads them by name
 * @param message - What the page sent, with the runtime's assets
 */
function serveAssets(message: RunMessage): void {
  const files = new Map(message.assets.map(({ alias, file }) => [alias, new URL(file, document.baseURI).href]));

  DefaultLoadingManager.setURLModifier((url) => files.get(url.replace(/[?#].*$/, '').replace(/^\//, '')) ?? url);
}

/**
 * Runs a program; the frame's bootstrap calls it with the page's message
 * @param message - What the page sent
 * @param program - The blob URL the bootstrap made for the program
 */
export async function run(message: RunMessage, program: string): Promise<void> {
  const report = capture(message, program);

  addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
    if (event.source !== parent) return;
    if (event.data?.type === 'pause') setPaused(true);
    else if (event.data?.type === 'resume') setPaused(false);
  });
  watchFirstFrame();

  try {
    Assets.add(message.assets.map(({ alias, file }) => ({ alias: [alias, `/${alias}`], src: file })));
    serveAssets(message);

    const module = (await import(/* @vite-ignore */ program)) as Parameters<typeof mount>[0];

    post({ type: 'evaluated' });
    mount(module, document.getElementById('root')!, message.renderer);
  } catch (error) {
    report(error);
  }
}
