/**
 * The guides of the docs site: Markdown that lives with the code, `src/**\/__docs__/<id>.md`, laid out
 * as react-three-fiber's own docs are. The site's Docs section has a page for each, in this order, under
 * the label of its section.
 */

/** A section of the Docs sidebar, which is also the folder of its guides' pages: `/docs/<section>/<id>/` */
export type GuideSection = 'getting-started' | 'tutorials' | '3d' | '2d' | 'reference' | 'advanced';

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
  '3d': '3D',
  '2d': '2D',
  reference: 'Reference',
  advanced: 'Advanced',
};

/** The guide that is the introduction, the page at `/docs/` */
export const INTRODUCTION_ID = 'introduction';

/** The guide the reference's parity tables, read from docs/feasibility.md, are added to */
export const DIFFERENCES_ID = 'differences';

/** Every guide, in the order of the site's navigation */
export const GUIDES: readonly Guide[] = [
  {
    id: INTRODUCTION_ID,
    title: 'Introduction',
    file: 'packages/threejs-compat/src/__docs__/introduction.md',
    section: 'getting-started',
  },
  {
    id: 'installation',
    title: 'Installation',
    file: 'packages/threejs-compat/src/__docs__/installation.md',
    section: 'getting-started',
  },
  {
    id: 'your-first-scene',
    title: 'Your first scene',
    file: 'packages/threejs-compat/src/__docs__/your-first-scene.md',
    section: 'getting-started',
  },
  {
    id: 'events-and-interaction',
    title: 'Events and interaction',
    file: 'packages/threejs-compat/src/__docs__/events-and-interaction.md',
    section: 'tutorials',
  },
  {
    id: 'loading-models',
    title: 'Loading models',
    file: 'packages/threejs-compat/src/__docs__/loading-models.md',
    section: 'tutorials',
  },
  {
    id: 'loading-textures',
    title: 'Loading textures',
    file: 'packages/threejs-compat/src/__docs__/loading-textures.md',
    section: 'tutorials',
  },
  {
    id: 'basic-animations',
    title: 'Basic animations',
    file: 'packages/threejs-compat/src/__docs__/basic-animations.md',
    section: 'tutorials',
  },
  {
    id: 'lights-and-shadows',
    title: 'Lights and shadows',
    file: 'packages/threejs-compat/src/__docs__/lights-and-shadows.md',
    section: 'tutorials',
  },
  {
    id: 'environment',
    title: 'Environment',
    file: 'packages/threejs-compat/src/environment/__docs__/environment.md',
    section: 'tutorials',
  },
  {
    id: 'camera-controls',
    title: 'Camera controls',
    file: 'packages/threejs-compat/src/addons/controls/__docs__/camera-controls.md',
    section: 'tutorials',
  },
  {
    id: 'elements-3d',
    title: '@pixi/3d elements',
    label: 'Elements',
    file: 'packages/3d/src/__docs__/elements-3d.md',
    section: '3d',
  },
  {
    id: 'your-first-2d-scene',
    title: 'Your first 2D scene',
    file: 'packages/2d/src/__docs__/your-first-2d-scene.md',
    section: '2d',
  },
  {
    id: 'objects-2d',
    title: '2D objects, properties and arguments',
    label: '2D objects',
    file: 'packages/2d/src/__docs__/objects-2d.md',
    section: '2d',
  },
  {
    id: 'screen-layer',
    title: 'The screen layer',
    file: 'packages/2d/src/__docs__/screen-layer.md',
    section: '2d',
  },
  {
    id: 'mixing-2d-and-3d',
    title: 'Mixing 2D and 3D',
    label: '2D and 3D bridges',
    file: 'packages/2d/src/__docs__/mixing-2d-and-3d.md',
    section: '2d',
  },
  { id: 'events-2d', title: '2D events', file: 'packages/2d/src/__docs__/events-2d.md', section: '2d' },
  { id: 'animation-2d', title: 'Animating 2D', file: 'packages/2d/src/__docs__/animation-2d.md', section: '2d' },
  {
    id: 'loading-2d',
    title: 'Loading textures and spritesheets',
    label: 'Loading 2D assets',
    file: 'packages/2d/src/__docs__/loading-2d.md',
    section: '2d',
  },
  { id: 'graphics-2d', title: 'Graphics', file: 'packages/2d/src/__docs__/graphics-2d.md', section: '2d' },
  { id: 'text-2d', title: 'Text', file: 'packages/2d/src/__docs__/text-2d.md', section: '2d' },
  {
    id: 'sprites-2d',
    title: 'Sprites and spritesheets',
    label: 'Sprites',
    file: 'packages/2d/src/__docs__/sprites-2d.md',
    section: '2d',
  },
  {
    id: 'filters-and-masks-2d',
    title: 'Filters, masks and blend modes',
    label: 'Filters and masks',
    file: 'packages/2d/src/__docs__/filters-and-masks-2d.md',
    section: '2d',
  },
  { id: 'meshes-2d', title: 'Meshes', file: 'packages/2d/src/__docs__/meshes-2d.md', section: '2d' },
  { id: 'particles-2d', title: 'Particles', file: 'packages/2d/src/__docs__/particles-2d.md', section: '2d' },
  { id: 'extend-2d', title: 'Your own 2D classes', file: 'packages/2d/src/__docs__/extend-2d.md', section: '2d' },
  { id: 'performance-2d', title: '2D performance', file: 'packages/2d/src/__docs__/performance-2d.md', section: '2d' },
  { id: 'canvas', title: 'Canvas', file: 'packages/threejs-compat/src/__docs__/canvas.md', section: 'reference' },
  {
    id: 'objects',
    title: 'Objects, properties and arguments',
    label: 'Objects',
    file: 'packages/threejs-compat/src/__docs__/objects.md',
    section: 'reference',
  },
  {
    id: 'loading-hooks',
    title: 'Loading hooks',
    file: 'packages/threejs-compat/src/__docs__/loading-hooks.md',
    section: 'reference',
  },
  { id: 'events', title: 'Events', file: 'packages/threejs-compat/src/__docs__/events.md', section: 'reference' },
  {
    id: 'three-entry',
    title: 'The three entry',
    file: 'packages/threejs-compat/src/__docs__/three-entry.md',
    section: 'reference',
  },
  {
    id: 'visibility',
    title: 'Visibility',
    file: 'packages/threejs-compat/src/__docs__/visibility.md',
    section: 'reference',
  },
  {
    id: 'camera-parenting',
    title: 'Camera parenting',
    file: 'packages/threejs-compat/src/__docs__/camera-parenting.md',
    section: 'reference',
  },
  {
    id: 'render-targets',
    title: 'Render targets',
    file: 'packages/threejs-compat/src/environment/__docs__/render-targets.md',
    section: 'reference',
  },
  {
    id: DIFFERENCES_ID,
    title: 'Differences from react-three-fiber',
    label: 'Differences from r3f',
    file: 'packages/threejs-compat/src/__docs__/differences.md',
    section: 'reference',
  },
  {
    id: 'scaling-performance',
    title: 'Scaling performance',
    file: 'packages/threejs-compat/src/__docs__/scaling-performance.md',
    section: 'advanced',
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
        `${doc}: the list of guides differs from GUIDES in packages/docs/scripts/typedoc/guides.mts, which has ${wanted.join('; ')}`,
      ];
}
