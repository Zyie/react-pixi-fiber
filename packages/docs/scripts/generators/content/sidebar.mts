/**
 * The pages of the Docs section, grouped as its sidebar shows them. `docs/sidebars.ts` reads the
 * sidebar from here and `content.mts` writes a page for every id, so the two can't disagree. A page's
 * id is its path in `content/` without the extension, and its URL is that path with a trailing slash,
 * or the folder's for an `index`: a guide lives at `/docs/<section>/<id>/`, and the introduction at `/docs/`.
 */
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

import { ENTRIES } from '../../typedoc/entries.mts';
import type { GuideSection } from '../../typedoc/guides.mts';
import { GUIDES, INTRODUCTION_ID, SECTION_PACKAGES, SECTIONS } from '../../typedoc/guides.mts';

/** The id of the introduction, the page at `/docs/`, which the Getting started heading links */
export const INTRODUCTION = 'docs/index';

/** The overview of each section but the first, whose overview is the introduction */
export const SECTION_INDEX: Readonly<Record<GuideSection, string>> = {
  'getting-started': INTRODUCTION,
  core: 'docs/core/index',
  '2d': 'docs/2d/index',
  '3d': 'docs/3d/index',
  'threejs-compat': 'docs/threejs-compat/index',
  r3f: 'docs/r3f/index',
};

/** The page of the r3f fork's diff against upstream, which the content generator writes from the diff itself */
export const FORK_DIFF = { id: 'docs/r3f/diff', title: 'The diff against upstream', file: 'packages/r3f/fork.diff' };

/**
 * The id of a guide's page
 * @param id - The guide's id in `GUIDES`
 */
export function guidePage(id: string): string {
  const guide = GUIDES.find((each) => each.id === id);

  if (!guide) throw new Error(`content: no guide ${id} in GUIDES`);

  return id === INTRODUCTION_ID ? INTRODUCTION : `docs/${guide.section}/${id}`;
}

/**
 * The URL of a page of the Docs section: `docs/2d/sprites-2d` is `/docs/2d/sprites-2d/`, and an index
 * is its folder, `docs/2d/index` `/docs/2d/`
 * @param id - The page's id
 */
export function pageUrl(id: string): string {
  return `/${id.replace(/\/index$/, '')}/`;
}

/** The page made from each doc of the repo that is one, by the doc's path from the repo root */
const DOC_PAGES: ReadonlyMap<string, { readonly id: string; readonly title: string }> = new Map([
  ...GUIDES.map(({ file, id, title }) => [file, { id: guidePage(id), title }] as const),
  [FORK_DIFF.file, FORK_DIFF] as const,
]);

/**
 * Where a link to a doc of the repo goes: the page made from it, at the anchor
 * @param file - The doc's path from the repo root
 * @param anchor - The anchor without `#`; empty for none
 * @returns The URL, or null when the doc is no page
 */
export function pageOf(file: string, anchor: string): string | null {
  const page = DOC_PAGES.get(file);

  return page ? `${pageUrl(page.id)}${anchor ? `#${anchor}` : ''}` : null;
}

/**
 * The title of the page made from a doc of the repo, which a link to it whose text is the doc's file
 * name reads as
 * @param file - The doc's path from the repo root
 * @returns The title, or null when the doc is no page
 */
export function titleOf(file: string): string | null {
  return DOC_PAGES.get(file)?.title ?? null;
}

/**
 * The API reference of the entries of a section's package, the links its sidebar ends with
 * @param section - The section
 */
function apiLinks(section: GuideSection): { type: 'link'; label: string; href: string }[] {
  if (section === 'getting-started') return [];

  const entries = ENTRIES.filter((entry) => entry.package === SECTION_PACKAGES[section] && entry.subpath === '.');

  return entries.map((entry) => ({ type: 'link' as const, label: 'API reference', href: `/api/${entry.name}/` }));
}

/**
 * The Docs sidebar: a heading per section, always open, so every page is listed on every page. A
 * heading links the section's overview, which is what the breadcrumbs link too. A package's section
 * ends with its API reference, which has a sidebar of its own, and the r3f fork's with its diff.
 */
export const DOCS_SIDEBAR: SidebarsConfig[string] = (Object.keys(SECTIONS) as GuideSection[]).map((section) => ({
  type: 'category' as const,
  label: SECTIONS[section],
  className: 'sidebar-section',
  collapsible: false,
  link: { type: 'doc' as const, id: SECTION_INDEX[section] },
  items: [
    ...GUIDES.filter((guide) => guide.section === section && guide.id !== INTRODUCTION_ID).map(({ id }) =>
      guidePage(id),
    ),
    ...(section === 'r3f' ? [FORK_DIFF.id] : []),
    ...apiLinks(section),
  ],
}));
