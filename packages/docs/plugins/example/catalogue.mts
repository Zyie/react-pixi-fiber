/**
 * Where the examples are and what they are called: `examples/<topic>/<name>.example.ts(x)` is the
 * example `<topic>/<name>`, whose visual test draws `tests/snapshots/docs/<topic>/<name>.webgl.png`,
 * which the site serves from `static/example-pictures` and, cropped, from `static/example-thumbs`.
 * A page shows the WebP of a picture; the PNG beside it is for the cards of shared links.
 *
 * There may be no examples at all: every reader of the catalogue works with zero or more.
 */
import fs from 'node:fs';
import path from 'node:path';

import { ROOT, SITE } from '../../scripts/paths.mts';
import { GUIDES } from '../../scripts/typedoc/guides.mts';

/** One example */
export interface ExampleFile {
  /** `<topic>/<name>` */
  readonly id: string;
  /** Its folder under `examples/` */
  readonly topic: string;
  /** From the repo root */
  readonly file: string;
}

const EXAMPLE = /^examples\/(([\w-]+)\/[\w-]+)\.example\.tsx?$/;

/** The folders of `static/` the examples generator writes each example's picture and thumbnail in */
export const PICTURES = 'example-pictures';
export const THUMBNAILS = 'example-thumbs';

/** The renderer whose reference image the site shows: the one every visual test draws with */
export const PICTURE_RENDERER = 'webgl';

/**
 * The id of an example
 * @param file - A file, from the repo root
 * @returns `<topic>/<name>`, or null when the file is no example
 */
export function exampleId(file: string): string | null {
  return EXAMPLE.exec(file)?.[1] ?? null;
}

/**
 * The reference image of an example's visual test, from the repo root
 * @param id - The example
 */
export function referencePicture(id: string): string {
  return `tests/snapshots/docs/${id}.${PICTURE_RENDERER}.png`;
}

/**
 * The place of a topic among the topics: those named like a guide in the guides' order, then the rest
 * @param topic - The topic
 */
export function topicRank(topic: string): number {
  const guide = GUIDES.findIndex(({ id }) => id === topic);

  return guide < 0 ? GUIDES.length : guide;
}

/** Every example, by topic in the order of `topicRank`, then by id; empty when there are none */
export function listExamples(): ExampleFile[] {
  if (!fs.existsSync(path.join(ROOT, 'examples'))) return [];

  return fs
    .globSync('examples/*/*.example.{ts,tsx}', { cwd: ROOT })
    .map((found) => {
      const file = found.split(path.sep).join('/');
      const [, id = '', topic = ''] = EXAMPLE.exec(file) ?? [];

      return { id, topic, file };
    })
    .filter(({ id }) => id)
    .sort(
      (a, b) => topicRank(a.topic) - topicRank(b.topic) || a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id),
    );
}

/**
 * The URL of the picture the examples generator wrote for a page to show: lossless WebP, or PNG where
 * that isn't smaller
 * @param folder - `PICTURES` or `THUMBNAILS`
 * @param id - The example
 * @returns The URL from the site's root, or null when the example has no picture yet
 */
export function pictureUrl(folder: string, id: string): string | null {
  const type = ['webp', 'png'].find((each) => fs.existsSync(path.join(SITE, 'static', folder, `${id}.${each}`)));

  return type ? `/${folder}/${id}.${type}` : null;
}
