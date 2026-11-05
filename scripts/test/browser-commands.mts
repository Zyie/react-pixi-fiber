import fs from 'node:fs';
import path from 'node:path';

import type { FrameLocator, Locator, Page } from 'playwright';
import { PNG } from 'pngjs';
import type { Plugin } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

import type { MouseAction } from '../../tests/harness/scene-input.ts';
import type { RendererType, SceneParity } from '../../tests/harness/scene-runner.tsx';
import { diffImages, saveStrip } from './images.mts';
import { recordParity } from './parity.mts';
import type { ParityMeasure } from './parity.mts';

/** What `compareScreenshot` reports back to the test */
export interface CompareResult {
  /** How many pixels differ from the reference; 0 when it was just written */
  diff: number;
  /** Whether that is within what the test allows. The command decides, since it stores a picture of a failure. */
  passed: boolean;
  /**
   * How a pixi-3d capture compares with three.js's reference, and whether that is within the scene's
   * `maxDiff`; null on three.js, for a scene with `parity: false`, or when three.js has no reference yet
   */
  parity: (ParityMeasure & { maxDiff?: number; passed: boolean }) | null;
}

const SNAPSHOTS = path.resolve(process.cwd(), 'tests/snapshots');
const FAILURES = path.resolve(process.cwd(), '.pr_uploads/visual');

/**
 * pixelmatch's threshold for a reference in update mode: a grey about 5 levels off counts, where the
 * test's 0.1 lets about 25 levels pass, so `npm run test:update` rewrites a reference whose colours
 * have drifted
 */
const UPDATE_THRESHOLD = 0.02;

/**
 * An element of the test page the harness marked, with `markForCapture`
 * @param iframe - The frame the test runs in
 * @param id - The element's `data-shot` attribute
 */
const marked = (iframe: FrameLocator, id: string): Locator => iframe.locator(`[data-shot="${id}"]`);

/** How `compareScreenshot` treats a capture beyond comparing it with its reference */
export interface CompareOptions {
  /** The scene's `parity`: how a pixi-3d capture is held to three.js's; not measured when `false` */
  parity: false | SceneParity;
  /**
   * The capture was driven by the playground's synthetic input rather than Playwright's. It is only
   * compared: a missing reference fails, none is written, parity isn't measured, and a failure's strip
   * goes to `.pr_uploads/visual/synthetic/`.
   */
  synthetic?: boolean;
}

const compareScreenshot: BrowserCommand<
  [id: string, key: string, renderer: RendererType, pixelMatch: number, options: CompareOptions],
  CompareResult
> = async ({ iframe, project }, id, key, renderer, pixelMatch, { parity, synthetic = false }) => {
  // 'all' with --update, 'new' locally, 'none' on CI: so CI fails on a missing reference
  // where a local run writes it.
  const updateSnapshot = synthetic ? 'none' : project.config.snapshotOptions.updateSnapshot;
  const shot = await marked(iframe, id).screenshot({ type: 'png' });
  const name = `${key}.${renderer}`;
  const reference = path.join(SNAPSHOTS, `${name}.png`);
  const failureStrip = path.join(FAILURES, synthetic ? 'synthetic' : '', `${name}.png`);
  const capture = PNG.sync.read(shot);
  const measured = (): CompareResult['parity'] => {
    if (renderer === 'three' || parity === false || synthetic) return null;

    const threeFile = path.join(SNAPSHOTS, `${key}.three.png`);
    const three = fs.existsSync(threeFile) ? PNG.sync.read(fs.readFileSync(threeFile)) : undefined;
    const measure = recordParity(key, renderer, capture, three, parity.maxDiff);

    return (
      measure && {
        ...measure,
        maxDiff: parity.maxDiff,
        passed: parity.maxDiff === undefined || measure.share <= parity.maxDiff,
      }
    );
  };

  // A strip left by an earlier run would read as this run's result.
  fs.rmSync(failureStrip, { force: true });

  if (!fs.existsSync(reference)) {
    if (updateSnapshot === 'none') {
      throw new Error(
        `Missing reference image tests/snapshots/${name}.png. Run the scene locally, look at the image it writes, and commit it.`,
      );
    }

    fs.mkdirSync(path.dirname(reference), { recursive: true });
    fs.writeFileSync(reference, shot);

    return { diff: 0, passed: true, parity: measured() };
  }

  const expectedImage = PNG.sync.read(fs.readFileSync(reference));

  // In update mode a reference is held to a tighter threshold, so colour that drifted by a few levels,
  // which the test lets pass, is rewritten too; one that still matches is left untouched.
  if (updateSnapshot === 'all') {
    if (diffImages(capture, expectedImage, UPDATE_THRESHOLD).diff > pixelMatch) fs.writeFileSync(reference, shot);

    return { diff: 0, passed: true, parity: measured() };
  }

  const { diff, actual, expected, image } = diffImages(capture, expectedImage);

  if (diff <= pixelMatch) return { diff, passed: true, parity: measured() };

  saveStrip(failureStrip, [
    ['expected', expected],
    ['actual', actual],
    ['diff', image],
  ]);

  return { diff, passed: false, parity: measured() };
};

/** What the harness has done with the real mouse of a test page and has not undone yet */
interface PointerState {
  /** Whether the mouse was moved onto a scene since it was last moved off the page */
  onScene: boolean;
  /** Whether the left button is down */
  down: boolean;
  /**
   * The canvas the last input went to, by its mark, and where it is on the page. A scene's canvas stays
   * where it is while the scene is driven, so only its first input asks the page.
   */
  canvas?: { id: string; x: number; y: number };
}

const pointerStates = new WeakMap<Page, PointerState>();

const pointer: BrowserCommand<
  [id: string, action: MouseAction, x: number, y: number, deltaX: number, deltaY: number],
  void
> = async ({ iframe, page }, id, action, x, y, deltaX, deltaY) => {
  const state = pointerStates.get(page) ?? { onScene: false, down: false };

  pointerStates.set(page, state);

  if (state.canvas?.id !== id) {
    // In the coordinates of the top page, which is what Playwright's input takes.
    const box = await marked(iframe, id).boundingBox();

    if (!box) throw new Error('The canvas of the scene is not on the page, so input has nowhere to go.');
    state.canvas = { id, x: box.x, y: box.y };
  }

  if (action === 'move') {
    await page.mouse.move(state.canvas.x + x, state.canvas.y + y);
    state.onScene = true;
  } else if (action === 'down') {
    await page.mouse.down();
    state.down = true;
  } else if (action === 'up') {
    await page.mouse.up();
    state.down = false;
  } else if (action === 'contextmenu') {
    await page.mouse.down({ button: 'right' });
    await page.mouse.up({ button: 'right' });
  } else if (action === 'dblclick') {
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.down({ clickCount: 2 });
    await page.mouse.up({ clickCount: 2 });
  } else await page.mouse.wheel(deltaX, deltaY);
};

const resetPointers: BrowserCommand<[], void> = async ({ page }) => {
  const state = pointerStates.get(page);

  if (!state) return;

  // The next scene's canvas is another one, or this one somewhere else.
  state.canvas = undefined;

  if (state.down) {
    await page.mouse.up();
    state.down = false;
  }

  if (state.onScene) {
    // Off the page: the frame the tests run in fills it, so no point inside is clear of every canvas.
    await page.mouse.move(-1, -1);
    state.onScene = false;
  }
};

/**
 * The browser commands of the test harness, which a test calls through `server.commands`. An element
 * is found by the `data-shot` attribute the harness gave it.
 *
 * - `compareScreenshot` captures a scene's canvas and compares it with `tests/snapshots/<key>.<renderer>.png`,
 *   as `CompareOptions` describes.
 *   A failing comparison writes an expected, actual and diff strip to `.pr_uploads/visual/<key>.<renderer>.png`.
 *   On a pixi-3d renderer it also measures the capture against `tests/snapshots/<key>.three.png` and
 *   writes the scene's composite to `.temp/parity/<key>.png`.
 * - `pointer` sends real mouse and wheel input to a scene's canvas: moves, left-button presses, a
 *   right-button press that opens the context menu, double clicks and the wheel.
 * - `resetPointers` undoes what `pointer` left behind: it releases a button that is still down and
 *   moves the mouse off the page. Test files share a page, so without it the next canvas would appear
 *   under the mouse of the scene before.
 */
const commands = { compareScreenshot, pointer, resetPointers };

/** Registers the browser commands of the test harness */
export default function BrowserCommands(): Plugin {
  return {
    name: 'vitest:harness-commands',
    config: () => ({ test: { browser: { commands } } }),
  };
}

/** A command as a test calls it: with what follows the context, and through a promise */
type Called<Command> =
  Command extends BrowserCommand<infer Payload, infer Result> ? (...payload: Payload) => Promise<Result> : never;

/** `server.commands` as the commands above type it, so a call and its command can't part */
type HarnessCommands = { [Name in keyof typeof commands]: Called<(typeof commands)[Name]> };

declare module 'vitest/browser' {
  interface BrowserCommands extends HarnessCommands {}
}
