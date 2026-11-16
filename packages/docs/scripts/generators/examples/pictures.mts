/**
 * The pictures of the examples as the site serves them, each a static file with its size: an example's
 * reference image in `static/example-pictures`, and the same cropped to what it draws in
 * `static/example-thumbs`, for a card. Both are lossless WebP, pixel for pixel the reference image, or
 * PNG where that is smaller. A picture is encoded again only when its reference image changes.
 *
 * The reference image is also there as the PNG it is, for the card a shared link shows: not every
 * scraper reads WebP, and only scrapers fetch it.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { PNG } from 'pngjs';

import { listExamples, PICTURES, referencePicture, THUMBNAILS } from '../../../plugins/example/catalogue.mts';
import type { ExamplePicture } from '../../../plugins/example/types.ts';
import { ROOT } from '../../paths.mts';
import type { GeneratedFiles, Shared } from '../../sync.mts';
import { cached } from '../cache.mts';

/** The space a thumbnail keeps around what the picture draws, in pixels */
const THUMB_PADDING = 16;
/** The narrowest crop, so a small drawing isn't blown up past the card's resolution */
const THUMB_MIN_WIDTH = 200;
/** How the pictures are made, which a change of the code here must change, so cached ones are made again */
const RECIPE = `webp-lossless-3-50 stage-corner padding-${THUMB_PADDING} min-${THUMB_MIN_WIDTH}`;

/** An example's pictures in the site */
interface SitePictures {
  /** Its reference image */
  readonly picture: ExamplePicture;
  /** Its reference image cropped to what it draws, at 4:3 */
  readonly thumbnail: ExamplePicture;
  /** The URL of its reference image as PNG, for the card a shared link shows */
  readonly card: string;
  /** The files of all three, from `docs/` */
  readonly files: GeneratedFiles;
}

/** The WebP encoder, loaded when the first picture has to be encoded */
let encoder: Promise<(image: PNG) => Promise<Uint8Array>> | undefined;

/** Loads the WebP encoder from its package, with the WebAssembly binary read from disk */
async function loadEncoder(): Promise<(image: PNG) => Promise<Uint8Array>> {
  const { default: encode, init } = await import('@jsquash/webp/encode.js');
  const binary = createRequire(import.meta.url).resolve('@jsquash/webp/codec/enc/webp_enc_simd.wasm');

  await init({ wasmBinary: fs.readFileSync(binary) });

  return async ({ data, width, height }) => {
    const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);

    return new Uint8Array(
      await encode({ data: pixels, width, height } as ImageData, { lossless: 1, exact: 1, method: 3, quality: 50 }),
    );
  };
}

/**
 * A picture as the smaller of lossless WebP and PNG
 * @param image - The picture
 * @param png - Its PNG file
 * @returns The file's bytes and its extension
 */
async function smallest(image: PNG, png: Uint8Array): Promise<{ bytes: Uint8Array; type: string }> {
  const webp = await (await (encoder ??= loadEncoder()))(image);

  return webp.length < png.length ? { bytes: webp, type: 'webp' } : { bytes: png, type: 'png' };
}

/**
 * A picture cropped to what it draws, with some padding, at 4:3 and no narrower than
 * `THUMB_MIN_WIDTH`, so a card shows the drawing rather than the empty stage around it. The stage is
 * the colour of the picture's top-left pixel, whatever the scene cleared it to.
 * @param png - The picture
 */
export function cropped(png: PNG): PNG {
  const { width, height, data } = png;
  const [RED, GREEN, BLUE] = [data[0]!, data[1]!, data[2]!];
  let [left, top, right, bottom] = [width, height, -1, -1];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      if (Math.abs(data[i]! - RED) + Math.abs(data[i + 1]! - GREEN) + Math.abs(data[i + 2]! - BLUE) > 12) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < 0) [left, top, right, bottom] = [0, 0, width - 1, height - 1];

  const most = Math.min(Math.floor(width / 4), Math.floor(height / 3));
  const needed = Math.max(
    (right - left + 1 + 2 * THUMB_PADDING) / 4,
    (bottom - top + 1 + 2 * THUMB_PADDING) / 3,
    THUMB_MIN_WIDTH / 4,
  );
  const unit = Math.min(most, Math.ceil(needed));
  const crop = new PNG({ width: unit * 4, height: unit * 3 });
  const place = (low: number, high: number, size: number, total: number): number =>
    Math.min(total - size, Math.max(0, Math.round((low + high + 1 - size) / 2)));

  PNG.bitblt(
    png,
    crop,
    place(left, right, crop.width, width),
    place(top, bottom, crop.height, height),
    crop.width,
    crop.height,
    0,
    0,
  );

  return crop;
}

/**
 * The pictures of one example, from the cache unless its reference image changed
 * @param id - The example
 * @param reference - Its reference image's bytes
 */
async function sitePictures(id: string, reference: Uint8Array): Promise<SitePictures> {
  const key = createHash('sha256').update(RECIPE).update(reference).digest('hex').slice(0, 16);
  const { files, meta } = await cached(`picture-${id.replace('/', '-')}`, key, async () => {
    const image = PNG.sync.read(Buffer.from(reference));
    const crop = cropped(image);
    const [picture, thumbnail] = await Promise.all([
      smallest(image, reference),
      smallest(crop, PNG.sync.write(crop, { colorType: 2 })),
    ]);
    const pictureFile = `${PICTURES}/${id}.${picture.type}`;
    const thumbnailFile = `${THUMBNAILS}/${id}.${thumbnail.type}`;

    return {
      files: { [`static/${pictureFile}`]: picture.bytes, [`static/${thumbnailFile}`]: thumbnail.bytes },
      meta: {
        picture: { src: `/${pictureFile}`, width: image.width, height: image.height },
        thumbnail: { src: `/${thumbnailFile}`, width: crop.width, height: crop.height },
      },
    };
  });

  const card = `${PICTURES}/${id}.png`;

  return { ...meta, card: `/${card}`, files: { ...files, [`static/${card}`]: reference } };
}

/**
 * The pictures of every example that has a reference image, by id; a sync makes them once, for the
 * examples' pages and the cards of the API reference
 * @param shared - The values of the sync
 */
export async function examplePictures(shared: Shared): Promise<ReadonlyMap<string, SitePictures>> {
  const pictures = await Promise.all(
    shared(listExamples).map(async ({ id }) => {
      const file = path.join(ROOT, referencePicture(id));

      return fs.existsSync(file) ? ([id, await sitePictures(id, fs.readFileSync(file))] as const) : null;
    }),
  );

  return new Map(pictures.filter((each) => each !== null));
}
