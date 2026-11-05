import type { ExamplePicture } from '@site/plugins/example/types';

/** A topic of the gallery: a folder of `examples/`, which a guide of the same name explains */
export interface GalleryTopic {
  /** The folder of its examples: `examples/<id>` */
  readonly id: string;
  readonly title: string;
  /** Its guide's page on the site; null when no guide has its name */
  readonly guide: string | null;
}

/** One card of the gallery, which the examples generator writes for each example */
export interface GalleryExample {
  /** `<topic>/<name>` */
  readonly id: string;
  readonly title: string;
  readonly topic: string;
  /** What it shows: the start of the prose that brings it in, else its own description */
  readonly description: string;
  /** What its picture draws, in words, which the search matches too */
  readonly alt: string;
  /** Its page */
  readonly href: string;
  /** Its reference image cropped to what it draws, at 4:3; null until it has one */
  readonly thumbnail: ExamplePicture | null;
}
