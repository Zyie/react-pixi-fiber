/**
 * The pages of the Docs section, grouped as its sidebar shows them. `docs/sidebars.ts` reads the
 * sidebar from here and `content.mts` writes a page for every id, so the two can't disagree. A page's
 * id is its path in `content/` without the extension, and its URL is that path with a trailing slash,
 * or the folder's for an `index`: a guide lives at `/docs/<section>/<id>/`, and the introduction at `/docs/`.
 */
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

import type { GuideSection } from '../../typedoc/guides.mts';
import { GUIDES, INTRODUCTION_ID, SECTIONS } from '../../typedoc/guides.mts';

/** The id of the introduction, the page at `/docs/`, which the Getting started heading links */
export const INTRODUCTION = 'docs/index';

/** The overview of each section but the first, whose overview is the introduction */
export const SECTION_INDEX: Readonly<Record<GuideSection, string>> = {
  'getting-started': INTRODUCTION,
  tutorials: 'docs/tutorials/index',
  '3d': 'docs/3d/index',
  '2d': 'docs/2d/index',
  reference: 'docs/reference/index',
  advanced: 'docs/advanced/index',
};

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
 * The URL of a page of the Docs section: `docs/tutorials/basic-animations` is
 * `/docs/tutorials/basic-animations/`, and an index is its folder, `docs/tutorials/index` `/docs/tutorials/`
 * @param id - The page's id
 */
export function pageUrl(id: string): string {
  return `/${id.replace(/\/index$/, '')}/`;
}

/** The page made from each doc of the repo that is one, by the doc's path from the repo root */
const DOC_PAGES: ReadonlyMap<string, { readonly id: string; readonly title: string }> = new Map(
  GUIDES.map(({ file, id, title }) => [file, { id: guidePage(id), title }] as const),
);

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
 * The Docs sidebar: a heading per section, always open, so every page is listed on every page. A
 * heading links the section's overview, which is what the breadcrumbs link too. The reference ends with
 * the API reference, which has a sidebar of its own.
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
    ...(section === 'reference' ? [{ type: 'link' as const, label: 'API reference', href: '/api/' }] : []),
  ],
}));
