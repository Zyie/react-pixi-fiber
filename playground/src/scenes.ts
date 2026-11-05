/** Which kind of file a playground entry comes from */
export type EntryKind = 'scene' | 'example';

/** A scene or an example the playground can show, and the import that loads its module */
export interface PlaygroundEntry {
  kind: EntryKind;
  /** Its path under its folder without the suffix: `core/use-frame`, or `your-first-scene/first-scene` for an example */
  id: string;
  /** The key its references are stored under: the id, or `docs/<id>` for an example */
  key: string;
  /** Its folder, by which the list groups it */
  folder: string;
  name: string;
  load: () => Promise<unknown>;
}

const SOURCES = [
  {
    kind: 'scene',
    root: '../../tests/scenes/',
    suffix: /\.scene\.tsx?$/,
    modules: import.meta.glob('../../tests/scenes/**/*.scene.{ts,tsx}'),
  },
  {
    kind: 'example',
    root: '../../examples/',
    suffix: /\.example\.tsx?$/,
    modules: import.meta.glob('../../examples/**/*.example.{ts,tsx}'),
  },
] as const;

/** Every visual-test scene and every example in the repo, in the order of their ids */
export const entries: PlaygroundEntry[] = SOURCES.flatMap(({ kind, root, suffix, modules }) =>
  Object.entries(modules).map(([file, load]) => {
    const id = file.slice(root.length).replace(suffix, '');
    const folders = id.split('/');
    const name = folders.pop() ?? id;

    return { kind, id, key: kind === 'example' ? `docs/${id}` : id, folder: folders.join('/'), name, load };
  }),
).sort((a, b) => a.id.localeCompare(b.id));

/**
 * The entry of a kind with an id
 * @param kind - Scene or example
 * @param id - Its id
 */
export const findEntry = (kind: string | null, id: string | null): PlaygroundEntry | undefined =>
  entries.find((entry) => entry.kind === kind && entry.id === id);
