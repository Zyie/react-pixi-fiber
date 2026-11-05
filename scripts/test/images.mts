import fs from 'node:fs';
import path from 'node:path';

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/** The 5 by 7 glyphs the titles of a strip are drawn with */
const FONT: Record<string, string> = {
  A: '01110100011000111111100011000110001',
  B: '11110100011000111110100011000111110',
  C: '01110100011000010000100001000101110',
  D: '11110100011000110001100011000111110',
  E: '11111100001000011110100001000011111',
  F: '11111100001000011110100001000010000',
  G: '01110100011000010111100011000101111',
  H: '10001100011000111111100011000110001',
  I: '11111001000010000100001000010011111',
  J: '00111000100001000010000101001001100',
  K: '10001100101010011000101001001010001',
  L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001',
  N: '10001110011010110011100011000110001',
  O: '01110100011000110001100011000101110',
  P: '11110100011000111110100001000010000',
  Q: '01110100011000110001101011001001101',
  R: '11110100011000111110101001001010001',
  S: '01111100001000001110000010000111110',
  T: '11111001000010000100001000010000100',
  U: '10001100011000110001100011000101110',
  V: '10001100011000110001100010101000100',
  W: '10001100011000110101101011010101010',
  X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100',
  Z: '11111000010001000100010001000011111',
  0: '01110100011001110101110011000101110',
  1: '00100011000010000100001000010001110',
  2: '01110100010000100010001000100011111',
  3: '11111000100010000010000011000101110',
  4: '00010001100101010010111110001000010',
  5: '11111100001111000001000011000101110',
  6: '00110010001000011110100011000101110',
  7: '11111000010001000100010000100001000',
  8: '01110100011000101110100011000101110',
  9: '01110100011000101111000010001001100',
  '.': '00000000000000000000000000110001100',
  '%': '11000110010001000100010001001100011',
  '-': '00000000000000011111000000000000000',
  ':': '00000011000110000000011000110000000',
  '/': '00001000010001000100010001000010000',
  '(': '00010001000100001000010000010000010',
  ')': '01000001000001000010000100010001000',
};

/** How many image pixels each pixel of a glyph takes */
const LABEL_SCALE = 2;

/** Height of the band a title is drawn in, above each image of a strip */
const TITLE_HEIGHT = 7 * LABEL_SCALE + 8;

/**
 * An opaque black image
 * @param width - Width in pixels
 * @param height - Height in pixels
 */
export function blackImage(width: number, height: number): PNG {
  const image = new PNG({ width, height });

  for (let alpha = 3; alpha < image.data.length; alpha += 4) image.data[alpha] = 255;

  return image;
}

/**
 * The image padded with black to a size, so two captures of different sizes can be compared
 * @param image - The image to pad
 * @param width - Width to pad to
 * @param height - Height to pad to
 */
export function padImage(image: PNG, width: number, height: number): PNG {
  if (image.width === width && image.height === height) return image;

  const output = blackImage(width, height);

  PNG.bitblt(image, output, 0, 0, image.width, image.height, 0, 0);

  return output;
}

/**
 * Draws a title in white capitals; a character without a glyph leaves a gap
 * @param image - The image to draw on
 * @param label - The text
 * @param x - Left edge of the text
 * @param y - Top edge of the text
 */
function drawLabel(image: PNG, label: string, x: number, y: number): void {
  let cursor = x;

  for (const character of label.toUpperCase()) {
    const glyph = FONT[character];

    for (let bit = 0; glyph && bit < glyph.length; bit++) {
      if (glyph[bit] !== '1') continue;

      for (let dy = 0; dy < LABEL_SCALE; dy++) {
        for (let dx = 0; dx < LABEL_SCALE; dx++) {
          const px = cursor + (bit % 5) * LABEL_SCALE + dx;
          const py = y + Math.floor(bit / 5) * LABEL_SCALE + dy;

          if (px < image.width && py < image.height)
            image.data.fill(255, (image.width * py + px) << 2, ((image.width * py + px) << 2) + 4);
        }
      }
    }

    cursor += 6 * LABEL_SCALE;
  }
}

/**
 * Writes images side by side, each under its title. A missing image leaves a black panel.
 * @param file - Where to write the strip
 * @param panels - The images, left to right, with the title of each
 */
export function saveStrip(file: string, panels: readonly (readonly [title: string, image: PNG | undefined])[]): void {
  const gap = 4;
  const images = panels.flatMap(([, image]) => (image ? [image] : []));
  const width = Math.max(...images.map((image) => image.width));
  const height = Math.max(...images.map((image) => image.height));
  const output = blackImage((width + gap) * panels.length - gap, height + TITLE_HEIGHT);

  panels.forEach(([title, image], index) => {
    const x = (width + gap) * index;

    drawLabel(output, title, x + 4, 4);
    if (image) PNG.bitblt(image, output, 0, 0, image.width, image.height, x, TITLE_HEIGHT);
  });

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(output));
}

/**
 * Compares two images of any sizes
 * @param actual - One image
 * @param expected - The other
 * @param threshold - How far apart two colours may be and still count as the same: pixelmatch's
 * threshold, from 0 to 1
 * @returns How many pixels differ, with both images padded to one size and pixelmatch's picture of the
 * difference. Pixels pixelmatch recognises as anti-aliasing are left out of the count.
 */
export function diffImages(
  actual: PNG,
  expected: PNG,
  threshold = 0.1,
): { diff: number; actual: PNG; expected: PNG; image: PNG } {
  const width = Math.max(actual.width, expected.width);
  const height = Math.max(actual.height, expected.height);
  const paddedActual = padImage(actual, width, height);
  const paddedExpected = padImage(expected, width, height);
  const image = new PNG({ width, height });
  const diff = pixelmatch(paddedActual.data, paddedExpected.data, image.data, width, height, { threshold });

  return { diff, actual: paddedActual, expected: paddedExpected, image };
}
