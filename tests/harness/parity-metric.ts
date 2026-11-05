import pixelmatch from 'pixelmatch';

import { SCENE_BACKGROUND } from './scene-constants.ts';

/**
 * How far apart two colours may be and still count as the same when a pixi-3d picture is held to
 * three.js's: pixelmatch's threshold. 0.05 lets a grey be about 13 levels off, so shading that is close
 * counts as the same picture, while a face lit a fifth darker, another colour, or a missing or moved
 * object does not. A reference comparison uses 0.1 and an exact pixel budget instead.
 */
export const PARITY_THRESHOLD = 0.05;

/** How far a channel may be from the scene's background and still count as background */
const BACKGROUND_TOLERANCE = 8;

/** The scene background as RGB */
const BACKGROUND = [1, 3, 5].map((start) => parseInt(SCENE_BACKGROUND.slice(start, start + 2), 16));

/** How one pixi-3d picture of a scene compares with three.js's */
export interface ParityMeasure {
  /** Pixels that differ at `PARITY_THRESHOLD`, anti-aliasing left out */
  differing: number;
  /** Pixels either picture draws: every pixel that isn't the scene's background in both */
  drawn: number;
  /** `differing / drawn`, from 0 to 1: the share of drawn pixels that differ. 0 when nothing is drawn. */
  share: number;
}

/**
 * Whether a pixel is the scene's background colour, within `BACKGROUND_TOLERANCE`
 * @param data - RGBA bytes
 * @param offset - Where the pixel starts
 */
const isBackground = (data: Uint8Array | Uint8ClampedArray, offset: number): boolean =>
  Math.abs(data[offset] - BACKGROUND[0]) <= BACKGROUND_TOLERANCE &&
  Math.abs(data[offset + 1] - BACKGROUND[1]) <= BACKGROUND_TOLERANCE &&
  Math.abs(data[offset + 2] - BACKGROUND[2]) <= BACKGROUND_TOLERANCE;

/**
 * Measures one picture of a scene against another of the same size: the tests hold each pixi-3d capture
 * to three.js's reference with it, and the playground's diff view any two renderers
 * @param a - RGBA bytes of one picture
 * @param b - RGBA bytes of the other
 * @param width - Width of both in pixels
 * @param height - Height of both in pixels
 * @param output - RGBA bytes pixelmatch draws the difference into, if wanted: differing pixels red,
 * anti-aliasing yellow, the rest a faded grey of `a`
 */
export function measureParity(
  a: Uint8Array | Uint8ClampedArray,
  b: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  output?: Uint8Array | Uint8ClampedArray,
): ParityMeasure {
  const differing = pixelmatch(a, b, output, width, height, { threshold: PARITY_THRESHOLD });
  let drawn = 0;

  for (let offset = 0; offset < a.length; offset += 4) {
    if (!isBackground(a, offset) || !isBackground(b, offset)) drawn++;
  }

  return { differing, drawn, share: drawn === 0 ? 0 : differing / drawn };
}
