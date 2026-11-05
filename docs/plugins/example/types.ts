/** The picture an example draws, its reference image from the visual tests */
export interface ExamplePicture {
  /** Its URL in the site */
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/** What `loader.mts` makes of an example file, handed to `<Example>` as its `source` prop */
export interface ExampleSource {
  /** `<topic>/<name>`, as the gallery names it */
  readonly id: string;
  /** The code to show: every part of the region, without region markers, or the whole program */
  readonly code: string;
  readonly language: 'ts' | 'tsx';
  /** The reference image of its visual test, as the site serves it; null until the example has one */
  readonly picture: ExamplePicture | null;
  /** The whole example file, without region markers, which the live frame imports and mounts */
  readonly program: string;
  /** `program` as JavaScript, line for line, so a first run needs no compiler in the page */
  readonly compiled: string;
  /** The lines of `program` the region covers, 1-based and inclusive; empty with no region */
  readonly focus: readonly (readonly [number, number])[];
  /** The text of each file the program imports by a relative path, such as `./theme.css?raw` */
  readonly files: Readonly<Record<string, string>>;
}
