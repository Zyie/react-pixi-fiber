/**
 * The parity findings of `docs/feasibility.md`, read for the Differences page: how far each level of
 * react-three-fiber's surface carries over (section 1), every item of the parity matrix by group with
 * its class (section 4), and the major blockers (section 5). The tables are parsed once, as Markdown, so
 * the page shows their cells as written; only the class of a row is read as data.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { PhrasingContent, Root, RootContent, Table } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';

/** The file the findings are in, from the repo root */
export const FEASIBILITY = 'docs/feasibility.md';

/** How an item of r3f's surface is carried over, from the parity matrix's classes */
export type ParityClass = 'as-is' | 'adapter' | 'r3f-core-change' | 'pixi3d-change' | 'not-feasible';

/** Each class, in the order the page explains them, with how it reads to someone porting an r3f app */
export const PARITY_CLASSES: readonly { readonly id: ParityClass; readonly label: string; readonly meaning: string }[] =
  [
    {
      id: 'as-is',
      label: 'Same',
      meaning: "r3f's own code runs unchanged, so it behaves exactly as in react-three-fiber.",
    },
    {
      id: 'adapter',
      label: 'Adapted',
      meaning: 'react-pixi-fiber maps it onto pixi-3d, behind the name and shape r3f gives it.',
    },
    {
      id: 'pixi3d-change',
      label: 'Needs pixi-3d',
      meaning: 'Full parity waits on a change in pixi-3d; until then it is partial or missing.',
    },
    {
      id: 'r3f-core-change',
      label: 'Needs r3f',
      meaning: 'Works today through the vendored core; a small change upstream in r3f would remove the copy.',
    },
    {
      id: 'not-feasible',
      label: 'Not supported',
      meaning: "pixi-3d has no equivalent. r3f's core guards it, so it degrades to a no-op instead of throwing.",
    },
  ];

/** One row of the parity matrix */
export interface ParityRow {
  /** What of r3f's surface it is about, as written */
  readonly item: PhrasingContent[];
  /** Its classes, the first being how it works today */
  readonly classes: readonly ParityClass[];
  /** What the cell writes after each class, such as `but tube/extrude/shape`; empty where nothing */
  readonly qualifiers: readonly string[];
  /** Whether the spike already implements it (`✓`) */
  readonly done: boolean;
  /** The level of parity it belongs to: `L1`, `L2`, `L3` or `L2/L3` */
  readonly level: string;
  /** The notes, as written */
  readonly notes: PhrasingContent[];
}

/** One group of the parity matrix, such as "Events and frame loop" */
export interface ParityGroup {
  readonly title: string;
  readonly rows: readonly ParityRow[];
}

/** A major blocker: what limits swapping the import, and how it gets fixed */
export interface Blocker {
  readonly id: string;
  readonly blocker: PhrasingContent[];
  readonly fix: PhrasingContent[];
}

/** Everything the Differences page reads from the findings */
export interface Parity {
  /** The verdict's table: each level of the API, how much of it carries over, and what's left */
  readonly levels: Table;
  readonly groups: readonly ParityGroup[];
  readonly blockers: readonly Blocker[];
}

/**
 * The nodes under a heading, up to the next heading of its level or above
 * @param tree - The document
 * @param depth - The heading's level
 * @param title - The start of the heading's text
 */
function sectionOf(tree: Root, depth: number, title: string): RootContent[] {
  const start = tree.children.findIndex(
    (node) => node.type === 'heading' && node.depth === depth && toString(node).startsWith(title),
  );

  if (start < 0)
    throw new Error(`${FEASIBILITY}: no "${'#'.repeat(depth)} ${title}" heading, which the Differences page reads`);

  const end = tree.children.findIndex((node, index) => index > start && node.type === 'heading' && node.depth <= depth);

  return tree.children.slice(start + 1, end < 0 ? undefined : end);
}

/**
 * The cells of a table's rows, under the names of its header's columns
 * @param table - The table
 * @param columns - The columns to read, which the header must have
 * @param where - The section, for the error
 */
function rowsOf(table: Table, columns: readonly string[], where: string): Record<string, PhrasingContent[]>[] {
  const [head, ...rows] = table.children;
  const names = head?.children.map((cell) => toString(cell).trim()) ?? [];
  const missing = columns.filter((column) => !names.includes(column));

  if (missing.length > 0) {
    throw new Error(
      `${FEASIBILITY}: a table of "${where}" has no ${missing.join(', ')} column, which the Differences page reads`,
    );
  }

  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, row.children[names.indexOf(column)]?.children ?? []])),
  );
}

/**
 * The classes a cell of the Class column names, in the order it names them
 * @param text - The cell's text
 */
export function classesOf(text: string): ParityClass[] {
  return PARITY_CLASSES.map(({ id }) => ({ id, at: text.indexOf(id) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(({ id }) => id);
}

/**
 * What a cell of the Class column writes after each class it names, up to the next one, without the
 * `✓` and the punctuation that joins them: `adapter ✓ but tube/extrude/shape` qualifies `adapter` with
 * `but tube/extrude/shape`
 * @param text - The cell's text
 */
export function qualifiersOf(text: string): string[] {
  const found = PARITY_CLASSES.map(({ id }) => ({ id, at: text.indexOf(id) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at);

  return found.map(({ id, at }, index) =>
    text
      .slice(at + id.length, found[index + 1]?.at ?? text.length)
      .replaceAll('✓', '')
      .replace(/\s+/g, ' ')
      .replace(/\s+\)/g, ')')
      .replace(/^[\s;,]+|[\s;,]+$/g, ''),
  );
}

/**
 * Reads the parity findings
 * @param root - The repo root
 * @throws When the findings no longer have a section or a column the page reads, or a row has no class
 */
export function readParity(root: string): Parity {
  const file = path.join(root, FEASIBILITY);

  if (!fs.existsSync(file)) throw new Error(`${FEASIBILITY}: missing; the Differences page is built from it`);

  const tree = fromMarkdown(fs.readFileSync(file, 'utf8'), {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const levels = sectionOf(tree, 2, '1.').find((node): node is Table => node.type === 'table');

  if (!levels) throw new Error(`${FEASIBILITY}: section 1 has no table of levels, which the Differences page shows`);

  const matrix = sectionOf(tree, 2, '4.');
  const groups: ParityGroup[] = [];
  let title: string | null = null;

  for (const node of matrix) {
    if (node.type === 'heading' && node.depth === 3) title = toString(node);
    if (node.type !== 'table' || title === null) continue;
    groups.push({
      title,
      rows: rowsOf(node, ['Item', 'Class', 'Level', 'Notes'], title).map((cells) => {
        const text = toString({ type: 'paragraph', children: cells.Class! });
        const classes = classesOf(text);

        if (classes.length === 0) {
          throw new Error(
            `${FEASIBILITY}: "${toString({ type: 'paragraph', children: cells.Item! })}" has no class the Differences page knows`,
          );
        }

        return {
          item: cells.Item!,
          classes,
          qualifiers: qualifiersOf(text),
          done: text.includes('✓'),
          level: toString({ type: 'paragraph', children: cells.Level! }).trim(),
          notes: cells.Notes!,
        };
      }),
    });
  }
  if (groups.length === 0) throw new Error(`${FEASIBILITY}: section 4 has no tables, which the Differences page lists`);

  const major = sectionOf(tree, 3, 'Major').find((node): node is Table => node.type === 'table');
  const blockers = major
    ? rowsOf(major, ['#', 'Blocker', 'Fix'], 'Major').map((cells) => ({
        id: toString({ type: 'paragraph', children: cells['#']! }).trim(),
        blocker: cells.Blocker!,
        fix: cells.Fix!,
      }))
    : [];

  return { levels, groups, blockers };
}
