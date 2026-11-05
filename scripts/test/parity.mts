import fs from 'node:fs';
import path from 'node:path';

import type { PNG } from 'pngjs';
import type { Reporter } from 'vitest/node';

import { diffImages, padImage, saveStrip } from './images.mts';

/** Where the parity composites and the summary of a run are written */
export const PARITY_DIR = path.resolve(process.cwd(), '.temp/parity');

/**
 * How far apart two colours may be and still count as the same when a pixi-3d picture is held to
 * three.js's: pixelmatch's threshold. 0.05 lets a grey be about 13 levels off, so shading that is close
 * counts as the same picture, while a face lit a fifth darker, another colour, or a missing or moved
 * object does not. A reference comparison uses 0.1 and an exact pixel budget instead.
 */
export const PARITY_THRESHOLD = 0.05;

/** How far a channel may be from the scene's background and still count as background */
const BACKGROUND_TOLERANCE = 8;

/** The pixi-3d renderers parity is measured on */
export type PixiRenderer = 'webgl' | 'webgpu';

/** How one pixi-3d picture of a scene compares with three.js's */
export interface ParityMeasure {
  /** Pixels that differ at `PARITY_THRESHOLD`, anti-aliasing left out */
  differing: number;
  /** Pixels either picture draws, which is every pixel that isn't the scene's background in both */
  drawn: number;
  /** `differing / drawn`, from 0 to 1: the share of drawn pixels that differ. 0 when nothing is drawn. */
  share: number;
}

/** What the run knows about the parity of one scene */
export interface ParityEntry {
  /** The scene's `parity.maxDiff`, if it has one */
  maxDiff?: number;
  /** Each pixi-3d renderer the scene ran on, measured against three.js */
  measures: Partial<Record<PixiRenderer, ParityMeasure>>;
  /** Whether `tests/snapshots/<key>.three.png` was missing, so nothing could be measured */
  missingThree?: boolean;
}

/** What a run knows about parity, between the browser commands that measure it and the reporter that prints it */
interface ParityStore {
  /** The parity of every scene that ran on a pixi-3d renderer, by key */
  results: Map<string, ParityEntry>;
  /** The captures of each scene, for its composite */
  captures: Map<string, Partial<Record<PixiRenderer, PNG>>>;
}

/**
 * The run's parity, kept on `globalThis`: vitest loads its config again for each project, so the
 * commands of a project and the reporter each have their own copy of this module.
 */
const store: ParityStore = ((globalThis as { [key: symbol]: ParityStore })[Symbol.for('react-pixi-fiber:parity')] ??= {
  results: new Map(),
  captures: new Map(),
});

/**
 * Whether a pixel is the background colour, within `BACKGROUND_TOLERANCE`
 * @param data - RGBA bytes
 * @param offset - Where the pixel starts
 * @param background - The background's RGB
 */
const isBackground = (data: Buffer, offset: number, background: readonly number[]): boolean =>
  Math.abs(data[offset] - background[0]) <= BACKGROUND_TOLERANCE &&
  Math.abs(data[offset + 1] - background[1]) <= BACKGROUND_TOLERANCE &&
  Math.abs(data[offset + 2] - background[2]) <= BACKGROUND_TOLERANCE;

/**
 * Measures a pixi-3d picture against three.js's
 * @param pixi - The pixi-3d capture
 * @param three - The three.js reference
 * @param background - The RGB the canvas shows where nothing is drawn
 * @returns The measure, and pixelmatch's picture of the difference
 */
export function measureParity(
  pixi: PNG,
  three: PNG,
  background: readonly number[],
): { measure: ParityMeasure; image: PNG } {
  const { diff, actual, expected, image } = diffImages(pixi, three, PARITY_THRESHOLD);
  let drawn = 0;

  for (let offset = 0; offset < actual.data.length; offset += 4) {
    if (!isBackground(actual.data, offset, background) || !isBackground(expected.data, offset, background)) drawn++;
  }

  return { measure: { differing: diff, drawn, share: drawn === 0 ? 0 : diff / drawn }, image };
}

/** A share as a percentage with one decimal */
const percent = (share: number): string => `${(share * 100).toFixed(1)}%`;

/**
 * Records one pixi-3d capture of a scene, measures it against three.js and writes the scene's
 * composite, `.temp/parity/<key>.png`: pixi WebGL, pixi WebGPU, three.js, and the difference between
 * three.js and pixi WebGL (pixi WebGPU when WebGL hasn't run), each panel from this run.
 * @param key - The scene's key
 * @param renderer - The pixi-3d renderer of the capture
 * @param capture - The capture
 * @param three - The three.js reference, when there is one
 * @param maxDiff - The scene's `parity.maxDiff`, if it has one
 * @param background - The RGB the canvas shows where nothing is drawn
 * @returns The measure, or null when there is no three.js reference to measure against
 */
export function recordParity(
  key: string,
  renderer: PixiRenderer,
  capture: PNG,
  three: PNG | undefined,
  maxDiff: number | undefined,
  background: readonly number[],
): ParityMeasure | null {
  const entry = store.results.get(key) ?? { measures: {} };
  const shots = store.captures.get(key) ?? {};

  entry.maxDiff = maxDiff;
  entry.missingThree = !three;
  shots[renderer] = capture;
  store.results.set(key, entry);
  store.captures.set(key, shots);

  if (!three) return null;

  entry.measures[renderer] = measureParity(capture, three, background).measure;

  const against = shots.webgl ? 'webgl' : 'webgpu';
  const { measure, image } = measureParity(shots[against]!, three, background);
  const width = Math.max(three.width, capture.width);
  const height = Math.max(three.height, capture.height);
  const pad = (shot: PNG | undefined): PNG | undefined => shot && padImage(shot, width, height);

  saveStrip(path.join(PARITY_DIR, `${key}.png`), [
    ['pixi webgl', pad(shots.webgl)],
    ['pixi webgpu', pad(shots.webgpu)],
    ['three', pad(three)],
    [`diff ${against} ${percent(measure.share)}`, image],
  ]);

  return entry.measures[renderer]!;
}

/**
 * Prints a table of the parity of every scene that ran on a pixi-3d renderer at the end of a run, and
 * writes it to `.temp/parity/summary.json`. A scene with a `maxDiff` it exceeds is marked `FAIL`.
 */
export class ParityReporter implements Reporter {
  public onTestRunStart(): void {
    store.results.clear();
    store.captures.clear();
  }

  public onTestRunEnd(): void {
    if (store.results.size === 0) return;

    const rows = [...store.results].sort(([a], [b]) => a.localeCompare(b));
    const cell = (entry: ParityEntry, renderer: PixiRenderer): string => {
      const measure = entry.measures[renderer];

      return measure ? percent(measure.share) : '-';
    };
    const table = rows.map(([key, entry]) => {
      const worst = Math.max(...Object.values(entry.measures).map((measure) => measure.share));
      const verdict = entry.missingThree
        ? 'no three.js reference'
        : entry.maxDiff === undefined
          ? 'reported'
          : worst > entry.maxDiff
            ? 'FAIL'
            : 'ok';

      return [
        key,
        cell(entry, 'webgl'),
        cell(entry, 'webgpu'),
        entry.maxDiff === undefined ? '-' : percent(entry.maxDiff),
        verdict,
      ];
    });
    const header = ['scene', 'webgl', 'webgpu', 'maxDiff', 'parity'];
    const widths = header.map((title, column) => Math.max(title.length, ...table.map((row) => row[column].length)));
    const line = (row: string[]): string => row.map((text, column) => text.padEnd(widths[column])).join('  ');

    process.stdout.write(
      [
        '',
        `Parity with three.js: the share of drawn pixels that differ (pixelmatch threshold ${PARITY_THRESHOLD})`,
        line(header),
        line(widths.map((width) => '-'.repeat(width))),
        ...table.map(line),
        `Composites: ${path.relative(process.cwd(), PARITY_DIR)}/<scene>.png`,
        '',
      ].join('\n'),
    );

    fs.mkdirSync(PARITY_DIR, { recursive: true });
    fs.writeFileSync(path.join(PARITY_DIR, 'summary.json'), `${JSON.stringify(Object.fromEntries(rows), null, 2)}\n`);
  }
}
