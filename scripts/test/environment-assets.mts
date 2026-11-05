/**
 * Writes the environment maps the environment scenes load, into tests/assets/environment: six cube faces,
 * an equirectangular PNG and the same sky as a Radiance `.hdr`. Run it again only to change them; the
 * scenes' references follow the files.
 *
 * The sky is one function of direction: a blue zenith fading to a pale horizon, a brown ground, a warm
 * sun up toward +X and +Z (bright enough in the `.hdr` to light a scene), and a coloured marker on each
 * axis (red +X, cyan -X, green +Z, magenta -Z), so a map turned or mirrored the wrong way shows. The
 * cube faces add a white square in each face's top-left corner, so a face stored upside down shows too.
 *
 * Usage: node scripts/test/environment-assets.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { PNG } from 'pngjs';

const out = path.resolve(import.meta.dirname, '../../tests/assets/environment');

type RGB = [number, number, number];

const SUN = normalize([0.55, 0.45, 0.7]);
const MARKERS: [RGB, RGB][] = [
  [
    [1, 0, 0],
    [0.9, 0.15, 0.1],
  ],
  [
    [-1, 0, 0],
    [0.1, 0.8, 0.85],
  ],
  [
    [0, 0, 1],
    [0.2, 0.75, 0.25],
  ],
  [
    [0, 0, -1],
    [0.8, 0.2, 0.75],
  ],
];

function normalize([x, y, z]: RGB): RGB {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

const dot = (a: RGB, b: RGB): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * Linear radiance in a direction
 * @param direction - A unit direction
 * @param sunPower - How bright the sun's disc is; 1 keeps the sky in the 0 to 1 range of a PNG
 */
function sky(direction: RGB, sunPower: number): RGB {
  const [, y] = direction;
  let color: RGB =
    y >= 0
      ? mix([0.75, 0.82, 0.9], [0.12, 0.3, 0.75], Math.sqrt(y))
      : mix([0.35, 0.27, 0.2], [0.12, 0.08, 0.05], Math.sqrt(-y));
  for (const [axis, marker] of MARKERS) {
    const closeness = dot(direction, normalize(axis));
    if (closeness > 0.97) color = marker;
  }
  const sun = dot(direction, SUN);
  if (sun > 0.995) color = [sunPower, sunPower * 0.95, sunPower * 0.85];
  else if (sun > 0.98) color = mix(color, [1, 0.95, 0.85], (sun - 0.98) / 0.015);
  return color;
}

const toSRGB = (c: number): number =>
  Math.round(255 * Math.min(1, c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));

function writePNG(file: string, width: number, height: number, pixel: (x: number, y: number) => RGB): void {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const i = (y * width + x) * 4;
      png.data[i] = toSRGB(r);
      png.data[i + 1] = toSRGB(g);
      png.data[i + 2] = toSRGB(b);
      png.data[i + 3] = 255;
    }
  }
  writeFileSync(file, PNG.sync.write(png));
}

/** The direction through texel (x, y) of an equirectangular map, row 0 at the top */
function equirectDirection(x: number, y: number, width: number, height: number): RGB {
  const u = (x + 0.5) / width;
  const v = (y + 0.5) / height;
  const theta = (u - 0.5) * 2 * Math.PI;
  const phi = (0.5 - v) * Math.PI;
  return [Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)];
}

/** Packs linear RGB into Radiance's shared-exponent bytes */
function rgbe([r, g, b]: RGB): [number, number, number, number] {
  const max = Math.max(r, g, b);
  if (max < 1e-32) return [0, 0, 0, 0];
  const exponent = Math.ceil(Math.log2(max * (256 / 255)));
  const scale = 255 / 2 ** exponent;
  return [Math.round(r * scale), Math.round(g * scale), Math.round(b * scale), exponent + 128];
}

function writeHDR(file: string, width: number, height: number): void {
  const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++)
      pixels.set(rgbe(sky(equirectDirection(x, y, width, height), 24)), (y * width + x) * 4);
  }
  writeFileSync(file, Buffer.concat([Buffer.from(header, 'ascii'), Buffer.from(pixels)]));
}

/**
 * The direction through texel (x, y) of a cube face as three's `CubeTextureLoader` reads the file:
 * mirrored in x, since three samples image cube maps at `(-x, y, z)`
 */
function faceDirection(face: number, x: number, y: number, size: number): RGB {
  const u = ((x + 0.5) / size) * 2 - 1;
  const v = ((y + 0.5) / size) * 2 - 1;
  const gl: RGB[] = [
    [1, -v, -u],
    [-1, -v, u],
    [u, 1, v],
    [u, -1, -v],
    [u, -v, 1],
    [-u, -v, -1],
  ];
  const [dx, dy, dz] = gl[face];
  return normalize([-dx, dy, dz]);
}

mkdirSync(path.join(out, 'cube'), { recursive: true });
['px', 'nx', 'py', 'ny', 'pz', 'nz'].forEach((name, face) => {
  const size = 64;
  writePNG(path.join(out, 'cube', `${name}.png`), size, size, (x, y) =>
    x < 12 && y < 12 ? [1, 1, 1] : sky(faceDirection(face, x, y, size), 1),
  );
});
writePNG(path.join(out, 'equirect.png'), 256, 128, (x, y) => sky(equirectDirection(x, y, 256, 128), 1));
writeHDR(path.join(out, 'equirect.hdr'), 128, 64);
