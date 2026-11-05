/**
 * The parts of @easyops-cn/docusaurus-search-local that the site's search box and search page are built
 * on (src/theme/SearchBar, src/theme/SearchPage), which the plugin ships without types: its search
 * worker, what draws a result and marks the query's words in it, and the options the config gave it
 */

declare module '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces' {
  /** What of a page a result matched */
  export enum SearchDocumentType {
    Title = 0,
    Heading = 1,
    Description = 2,
    Keywords = 3,
    Content = 4,
  }

  /** A page, or a part of one, in the index */
  export interface SearchDocument {
    /** Its id */
    readonly i: number;
    /** Its text: a title, a heading, or a paragraph */
    readonly t: string;
    /** Its URL */
    readonly u: string;
    /** Its anchor, `#id` */
    readonly h?: string;
    /** The title of the section it's in */
    readonly s?: string;
    /** The titles of the sidebar categories above it */
    readonly b?: readonly string[];
  }

  /** Where the query's words are in a result, by word and field */
  export type SearchMetadata = Readonly<
    Record<string, Readonly<Record<string, { readonly position: readonly (readonly [number, number])[] }>>>
  >;

  /** One match of a search */
  export interface SearchResult {
    readonly document: SearchDocument;
    readonly type: SearchDocumentType;
    /** The page a match under a title is in; false for a title's own match */
    readonly page: SearchDocument | false;
    readonly metadata: SearchMetadata;
    /** The query's words as they matched */
    readonly tokens: readonly string[];
  }
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker' {
  import type { SearchResult } from '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces';

  export function fetchIndexesByWorker(baseUrl: string, searchContext: string): Promise<void>;
  export function searchByWorker(
    baseUrl: string,
    searchContext: string,
    input: string,
    limit: number,
  ): Promise<SearchResult[]>;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/highlight' {
  /** Text as HTML, with each of the words marked */
  export function highlight(content: string, tokens: readonly string[]): string;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/highlightStemmed' {
  /** The part of some text around its matches, as HTML with the matches marked */
  export function highlightStemmed(
    content: string,
    positions: readonly (readonly [number, number])[],
    tokens: readonly string[],
    maxLength?: number,
  ): string;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/getStemmedPositions' {
  import type { SearchMetadata } from '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces';

  export function getStemmedPositions(metadata: SearchMetadata, field: string): [number, number][];
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGenerated' {
  /** mark.js, when `highlightSearchTermsOnTargetPage` is on */
  export const Mark:
    | (new (root: Element) => {
        mark(words: readonly string[], options?: { exclude?: readonly string[] }): void;
        unmark(): void;
      })
    | undefined;
  export const searchBarShortcut: boolean;
  export const searchBarShortcutHint: boolean;
  /** The keys that focus the search box, such as `mod+k` */
  export const searchBarShortcutKeymap: string;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGeneratedConstants' {
  /** How many results the search box lists */
  export const searchResultLimits: number;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/keymap' {
  /** A parsed keymap */
  export interface Keymap {
    readonly key: string;
    readonly ctrl: boolean;
    readonly alt: boolean;
    readonly shift: boolean;
    readonly meta: boolean;
  }

  export function parseKeymap(keymap: string): Keymap;
  export function matchesKeymap(event: KeyboardEvent, keymap: Keymap): boolean;
  /** The label of each key of a keymap, such as `⌘` and `K` */
  export function getKeymapHints(keymap: string, isMac: boolean): string[];
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/utils/platform' {
  export function isMacPlatform(): boolean;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/SuggestionTemplate' {
  import type { SearchResult } from '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces';

  /** A result as a row of the dropdown, as HTML */
  export function SuggestionTemplate(result: SearchResult): string;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/EmptyTemplate' {
  /** The dropdown's "No results" row, as HTML */
  export function EmptyTemplate(): string;
}

declare module '@easyops-cn/docusaurus-search-local/dist/client/client/theme/LoadingRing/LoadingRing' {
  import type { ReactNode } from 'react';

  export default function LoadingRing(props: { className?: string }): ReactNode;
}

declare module '@easyops-cn/autocomplete.js' {
  import type { SearchResult } from '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces';

  /** A dropdown of suggestions on an input */
  export interface Autocomplete {
    readonly autocomplete: {
      open(): void;
      close(): void;
      destroy(): void;
      setVal(value: string): void;
    };
    on(event: 'autocomplete:selected', handler: (event: Event, suggestion: SearchResult) => void): this;
    on(event: 'autocomplete:closed', handler: () => void): this;
  }

  /** Where a dataset's suggestions come from and how each part of it is drawn */
  export interface Dataset {
    source(query: string, callback: (suggestions: readonly SearchResult[]) => void): void;
    templates: {
      suggestion(suggestion: SearchResult): string;
      empty(): string;
      footer(state: { query: string; isEmpty: boolean }): Element | undefined;
    };
  }

  const autocomplete: {
    (input: HTMLInputElement, options: object, datasets: readonly Dataset[]): Autocomplete;
    noConflict?(): void;
  };

  export default autocomplete;
}
