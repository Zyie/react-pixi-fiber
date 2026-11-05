import fs from 'node:fs';
import path from 'node:path';

import { PNG } from 'pngjs';
import type { Reporter } from 'vitest/node';

import { measureParity, PARITY_THRESHOLD } from '../../tests/harness/parity-metric.ts';
import type { ParityMeasure } from '../../tests/harness/parity-metric.ts';
import { padImage, saveStrip } from './images.mts';

export type { ParityMeasure };

/** Where the parity composites and the summary of a run are written */
export const PARITY_DIR = path.resolve(process.cwd(), '.temp/parity');

/** The pixi-3d renderers parity is measured on */
export type PixiRenderer = 'webgl' | 'webgpu';

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
 * Measures a pixi-3d picture against three.js's
 * @param pixi - The pixi-3d capture
 * @param three - The three.js reference
 * @returns The measure, and pixelmatch's picture of the difference
 */
function measureImages(pixi: PNG, three: PNG): { measure: ParityMeasure; image: PNG } {
  const width = Math.max(pixi.width, three.width);
  const height = Math.max(pixi.height, three.height);
  const image = new PNG({ width, height });
  const measure = measureParity(
    padImage(pixi, width, height).data,
    padImage(three, width, height).data,
    width,
    height,
    image.data,
  );

  return { measure, image };
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
 * @returns The measure, or null when there is no three.js reference to measure against
 */
export function recordParity(
  key: string,
  renderer: PixiRenderer,
  capture: PNG,
  three: PNG | undefined,
  maxDiff: number | undefined,
): ParityMeasure | null {
  const entry = store.results.get(key) ?? { measures: {} };
  const shots = store.captures.get(key) ?? {};

  entry.maxDiff = maxDiff;
  entry.missingThree = !three;
  shots[renderer] = capture;
  store.results.set(key, entry);
  store.captures.set(key, shots);

  if (!three) return null;

  entry.measures[renderer] = measureImages(capture, three).measure;

  const against = shots.webgl ? 'webgl' : 'webgpu';
  const { measure, image } = measureImages(shots[against]!, three);
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
 * writes it to `.temp/parity/summary.json`. The last column says whether a scene with a `maxDiff` is
 * within it; a scene whose test is marked `fails` can be over it.
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
          ? 'reported only'
          : worst > entry.maxDiff
            ? 'over maxDiff'
            : 'within maxDiff';

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
