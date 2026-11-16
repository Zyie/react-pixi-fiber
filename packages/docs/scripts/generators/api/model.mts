/**
 * The pages of the API section and where each name's page is, read once per sync from the API of
 * every package entry (docs/scripts/typedoc/api.mts). The API generator writes the pages; the Docs
 * section links names to them.
 *
 * The routes:
 *
 * - `/api/`: the entries;
 * - `/api/<entry>/`: an entry, by its name in `ENTRIES`: `/api/core/`;
 * - `/api/<entry>/<kind>/<Name>/`: a name, where `<kind>` is `functions`, `classes`, `constants`,
 *   `enums`, `interfaces` or `types`, and a const that is a function is a function:
 *   `/api/core/functions/useFrame/`;
 * - `/api/<entry>/augments/<Name>/`: an interface of another package that the entry adds members to,
 *   such as React's JSX `IntrinsicElements`, by its own name;
 * - `#<member>` on a page: a member, by its name as written.
 */
import { ROOT } from '../../paths.mts';
import type { Shared } from '../../sync.mts';
import { collectAll } from '../../typedoc/api.mts';
import type { ApiEntry, ApiKind, ApiSymbol } from '../../typedoc/api.mts';
import type { Entry } from '../../typedoc/entries.mts';

/** The folder, heading and badge of each kind, in the order of an entry's overview and sidebar */
export const KINDS: readonly { kind: ApiKind; folder: string; title: string; label: string }[] = [
  { kind: 'function', folder: 'functions', title: 'Functions', label: 'Function' },
  { kind: 'class', folder: 'classes', title: 'Classes', label: 'Class' },
  { kind: 'const', folder: 'constants', title: 'Constants', label: 'Constant' },
  { kind: 'enum', folder: 'enums', title: 'Enums', label: 'Enum' },
  { kind: 'interface', folder: 'interfaces', title: 'Interfaces', label: 'Interface' },
  { kind: 'type', folder: 'types', title: 'Types', label: 'Type' },
];

/** The folder of the interfaces an entry adds to */
export const AUGMENTS = 'augments';

/** The package an augmented namespace belongs to; a `declare module` block is named by its package */
const AUGMENTED: Readonly<Record<string, string>> = { JSX: 'React', 'react.JSX': 'React' };

/** The page of one name */
export interface SymbolPage {
  readonly entry: Entry;
  readonly symbol: ApiSymbol;
  /** The name it is shown by: its own, without the namespace of an augment */
  readonly title: string;
  /** Its folder under the entry's: a kind's, or `augments` */
  readonly folder: string;
  /** Its badge: `Function`, or `Added to React` */
  readonly label: string;
  /** The package an augment adds to; null for a name the entry exports */
  readonly augments: string | null;
  /** From the site root, with the trailing slash */
  readonly route: string;
  /** The anchor of each member, by its name */
  readonly anchors: ReadonlyMap<string, string>;
}

/** Every page of the section, and how a name is linked from a page */
export interface ApiModel {
  readonly apis: readonly ApiEntry[];
  readonly pages: readonly SymbolPage[];
  /**
   * The route of a name or `Name.member`, looked for first among the names of `from`, then in every
   * entry in the order of `ENTRIES`; null for a name no entry exports
   */
  resolve(name: string, from: Entry): string | null;
}

/**
 * The anchor of every member of a symbol: its name, or `call`, `new` and `index` for a call, construct
 * or index signature, with anything but letters, digits, `_`, `$` and `-` made `-`
 * @param symbol - The symbol
 */
function anchorsOf(symbol: ApiSymbol): Map<string, string> {
  const anchors = new Map<string, string>();
  const used = new Set<string>();

  for (const { name } of symbol.members) {
    let base: string;

    if (name === '()') base = 'call';
    else if (name === 'new()') base = 'new';
    else if (name.startsWith('[') && name.includes(':')) base = 'index';
    else base = name.replace(/[^\w$-]+/g, '-').replace(/^-+|-+$/g, '') || 'member';

    let id = base;

    for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    anchors.set(name, id);
  }

  return anchors;
}

/**
 * Orders names as a reader looks them up: alphabetically, ignoring case
 * @param a - A name
 * @param b - Another
 */
const byName = (a: string, b: string): number =>
  a.localeCompare(b, 'en', { sensitivity: 'base' }) || a.localeCompare(b);

/** Reads the API of every entry and lays out its pages; a const that is a function is listed as one */
export function apiModel(): ApiModel {
  const apis = collectAll(ROOT);
  const pages: SymbolPage[] = [];
  const byEntry = new Map<string, Map<string, SymbolPage>>();

  for (const api of apis) {
    const names = new Map<string, SymbolPage>();
    const base = `/api/${api.entry.name}`;

    for (const { kind, folder, label } of KINDS) {
      const listed = api.symbols
        .filter((each) => (each.kind === 'const' && each.calls ? 'function' : each.kind) === kind)
        .sort((a, b) => byName(a.name, b.name));

      for (const symbol of listed) {
        const page = {
          entry: api.entry,
          symbol,
          title: symbol.name,
          folder,
          label,
          augments: null,
          route: `${base}/${folder}/${symbol.name}/`,
          anchors: anchorsOf(symbol),
        };

        pages.push(page);
        names.set(symbol.name, page);
      }
    }
    for (const symbol of [...api.augments].sort((a, b) => byName(a.name, b.name))) {
      const parts = symbol.name.split('.');
      const title = parts.pop()!;
      const owner = parts.join('.');
      const augments = AUGMENTED[owner] ?? owner;
      const page = {
        entry: api.entry,
        symbol,
        title,
        folder: AUGMENTS,
        label: `Added to ${augments}`,
        augments,
        route: `${base}/${AUGMENTS}/${title}/`,
        anchors: anchorsOf(symbol),
      };

      pages.push(page);
      names.set(symbol.name, page);
    }

    const folded = new Map<string, string>();

    for (const page of names.values()) {
      const key = `${page.folder}/${page.title.toLowerCase()}`;
      const other = folded.get(key);

      if (other)
        throw new Error(`api: ${other} and ${page.symbol.name} would share a page on a case-blind file system`);
      folded.set(key, page.symbol.name);
    }
    byEntry.set(api.entry.name, names);
  }

  const lookup = (name: string, names: ReadonlyMap<string, SymbolPage> | undefined): string | null => {
    const direct = names?.get(name);

    if (direct) return direct.route;

    const dot = name.lastIndexOf('.');
    const owner = dot > 0 ? names?.get(name.slice(0, dot)) : undefined;
    const anchor = owner?.anchors.get(name.slice(dot + 1));

    return owner && anchor ? `${owner.route}#${anchor}` : null;
  };

  return {
    apis,
    pages,
    resolve: (name, from) => {
      const own = lookup(name, byEntry.get(from.name));

      if (own) return own;
      for (const api of apis) {
        const found = lookup(name, byEntry.get(api.entry.name));

        if (found) return found;
      }

      return null;
    },
  };
}

/**
 * Maps every public name to its page, for links from other pages of the site: `useFrame` to
 * `/api/core/functions/useFrame/`, `Name.member` to the member's anchor on the page of
 * `Name`, and an augment by its full name. A name two entries export maps to the page of the first in
 * `ENTRIES`.
 * @param shared - The values of the sync, which hold the model
 */
export function apiLinks(shared: Shared): Map<string, string> {
  const links = new Map<string, string>();

  for (const page of shared(apiModel).pages) {
    if (!links.has(page.symbol.name)) links.set(page.symbol.name, page.route);
    for (const [member, anchor] of page.anchors) {
      const key = `${page.symbol.name}.${member}`;

      if (!links.has(key)) links.set(key, `${page.route}#${anchor}`);
    }
  }

  return links;
}
