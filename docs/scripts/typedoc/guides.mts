/**
 * The guides of the docs site: Markdown that lives with the code, `src/**\/__docs__/<id>.md`, laid out
 * as react-three-fiber's own docs are. The site's Docs section has a page for each, in this order, under
 * the label of its section.
 */

/** A section of the Docs sidebar, which is also the folder of its guides' pages: `/docs/<section>/<id>/` */
export type GuideSection = 'getting-started' | 'tutorials' | 'reference';

/** One guide of the docs site */
export interface Guide {
  /** Its page name on the site, and the folder of `examples/` whose examples it is about, if any */
  readonly id: string;
  /** Its title in the navigation and as its page's heading */
  readonly title: string;
  /** Its label in the sidebar, when shorter than its title */
  readonly label?: string;
  /** The Markdown file, from the repo root */
  readonly file: string;
  readonly section: GuideSection;
}

/** The title of each section, in the sidebar's order */
export const SECTIONS: Readonly<Record<GuideSection, string>> = {
  'getting-started': 'Getting started',
  tutorials: 'Tutorials',
  reference: 'Reference',
};

/** The guide that is the introduction, the page at `/docs/` */
export const INTRODUCTION_ID = 'introduction';

/** The guide the reference's parity tables, read from docs/feasibility.md, are added to */
export const DIFFERENCES_ID = 'differences';

/** Every guide, in the order of the site's navigation */
export const GUIDES: readonly Guide[] = [
  { id: INTRODUCTION_ID, title: 'Introduction', file: 'src/__docs__/introduction.md', section: 'getting-started' },
  { id: 'installation', title: 'Installation', file: 'src/__docs__/installation.md', section: 'getting-started' },
  {
    id: 'your-first-scene',
    title: 'Your first scene',
    file: 'src/__docs__/your-first-scene.md',
    section: 'getting-started',
  },
  { id: 'basic-animations', title: 'Basic animations', file: 'src/__docs__/basic-animations.md', section: 'tutorials' },
  {
    id: 'events-and-interaction',
    title: 'Events and interaction',
    file: 'src/__docs__/events-and-interaction.md',
    section: 'tutorials',
  },
  {
    id: 'loading-models-and-textures',
    title: 'Loading models and textures',
    file: 'src/__docs__/loading-models-and-textures.md',
    section: 'tutorials',
  },
  {
    id: 'lights-and-shadows',
    title: 'Lights and shadows',
    file: 'src/__docs__/lights-and-shadows.md',
    section: 'tutorials',
  },
  { id: 'canvas', title: 'Canvas', file: 'src/__docs__/canvas.md', section: 'reference' },
  { id: 'camera-parenting', title: 'Camera parenting', file: 'src/__docs__/camera-parenting.md', section: 'reference' },
  { id: 'visibility', title: 'Visibility', file: 'src/__docs__/visibility.md', section: 'reference' },
  {
    id: 'objects',
    title: 'Objects, properties and arguments',
    label: 'Objects',
    file: 'src/__docs__/objects.md',
    section: 'reference',
  },
  { id: 'three-entry', title: 'The three entry', file: 'src/__docs__/three-entry.md', section: 'reference' },
  {
    id: DIFFERENCES_ID,
    title: 'Differences from react-three-fiber',
    label: 'Differences from r3f',
    file: 'src/__docs__/differences.md',
    section: 'reference',
  },
];

/**
 * Where the list of guides in a README parts from `GUIDES`: a link per guide, in its order, with its
 * title and file. A README with no `## Guides` section has nothing to check.
 * @param doc - The README's path from the repo root
 * @param markdown - Its text
 */
export function guideListProblems(doc: string, markdown: string): string[] {
  const lines = markdown.split('\n');
  const start = lines.indexOf('## Guides');

  if (start < 0) return [];

  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  const listed = lines
    .slice(start + 1, end < 0 ? undefined : end)
    .flatMap((line) => /^- \[([^\]]+)\]\(([^)]+)\)/.exec(line)?.slice(1, 3).join(' ') ?? []);
  const wanted = GUIDES.map((guide) => `${guide.title} ${guide.file}`);

  return listed.join('\n') === wanted.join('\n')
    ? []
    : [
        `${doc}: the list of guides differs from GUIDES in docs/scripts/typedoc/guides.mts, which has ${wanted.join('; ')}`,
      ];
}
