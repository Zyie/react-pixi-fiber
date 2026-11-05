import type { ExampleSource } from '@site/plugins/example/types';

/** An example as `static/example-sources/<topic>/<name>.json` has it */
export interface ExampleSourceFile extends Pick<ExampleSource, 'id' | 'language' | 'compiled' | 'files' | 'picture'> {
  readonly title: string;
  /** The whole example file, as the live frame runs it: `ExampleSource.program` */
  readonly code: string;
}

/** Every example, by topic: `static/example-sources/index.json` */
export interface ExampleCatalogue {
  readonly topics: readonly { readonly id: string; readonly title: string }[];
  readonly examples: readonly { readonly id: string; readonly title: string; readonly topic: string }[];
}
