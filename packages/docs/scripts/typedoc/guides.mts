/**
 * The guides of the docs site: Markdown that lives with the code, `src/**\/__docs__/<id>.md`, laid out
 * as react-three-fiber's own docs are. The site's Docs section has a page for each, in this order, under
 * the label of its section.
 */

/**
 * A section of the Docs sidebar, which is also the folder of its guides' pages: `/docs/<section>/<id>/`.
 * After Getting started, a section per package, its guides living in that package.
 */
export type GuideSection = 'getting-started' | 'core' | '2d' | '3d' | 'threejs-compat' | 'r3f';

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
  core: 'Core',
  '2d': '2D',
  '3d': '3D',
  'threejs-compat': 'three.js compat',
  r3f: 'The r3f fork',
};

/** The npm package each section but the first documents */
export const SECTION_PACKAGES: Readonly<Record<Exclude<GuideSection, 'getting-started'>, string>> = {
  core: '@react-fiber/core',
  '2d': '@react-fiber/2d',
  '3d': '@react-fiber/3d',
  'threejs-compat': '@react-fiber/threejs-compat',
  r3f: '@react-fiber/r3f',
};

/** The guide that is the introduction, the page at `/docs/` */
export const INTRODUCTION_ID = 'introduction';

/** The guide the reference's parity tables, read from docs/feasibility.md, are added to */
export const DIFFERENCES_ID = 'differences';

/** The guide of the r3f fork that its diff, read from `packages/r3f/fork.diff`, follows as a page of its own */
export const FORK_ID = 'renderer-hooks';

/**
 * A guide in a package's `src/__docs__`
 * @param id - Its id, which is its file's name
 * @param title - Its title
 * @param section - Its section, whose package holds it
 * @param label - Its label in the sidebar, when shorter than its title
 * @param folder - The folder of `src` its `__docs__` is in, when not `src` itself
 */
function guide(
  id: string,
  title: string,
  section: Exclude<GuideSection, 'getting-started'>,
  label?: string,
  folder = '',
): Guide {
  return { id, title, label, section, file: `packages/${section}/src/${folder}__docs__/${id}.md` };
}

/** Every guide, in the order of the site's navigation */
export const GUIDES: readonly Guide[] = [
  { ...guide(INTRODUCTION_ID, 'Introduction', 'core'), section: 'getting-started' },
  { ...guide('installation', 'Installation', 'core'), section: 'getting-started' },
  guide('canvas-and-roots', 'Canvas and roots', 'core'),
  guide('screen-layer', 'The stage', 'core'),
  guide('events-2d-and-3d', 'Events across 2D and 3D', 'core'),
  guide('frame-loop', 'The frame loop', 'core'),
  guide('mixing-2d-and-3d', 'Mixing 2D and 3D', 'core', '2D and 3D bridges'),
  guide('your-first-2d-scene', 'Your first 2D scene', '2d'),
  guide('objects-2d', '2D objects, properties and arguments', '2d', '2D objects'),
  guide('events-2d', '2D events', '2d'),
  guide('animation-2d', 'Animating 2D', '2d'),
  guide('loading-2d', 'Loading textures and spritesheets', '2d', 'Loading 2D assets'),
  guide('graphics-2d', 'Graphics', '2d'),
  guide('text-2d', 'Text', '2d'),
  guide('sprites-2d', 'Sprites and spritesheets', '2d', 'Sprites'),
  guide('filters-and-masks-2d', 'Filters, masks and blend modes', '2d', 'Filters and masks'),
  guide('meshes-2d', 'Meshes', '2d'),
  guide('particles-2d', 'Particles', '2d'),
  guide('extend-2d', 'Your own 2D classes', '2d'),
  guide('performance-2d', '2D performance', '2d'),
  guide('your-first-3d-scene', 'Your first 3D scene', '3d'),
  guide('objects-3d', 'Objects', '3d'),
  guide('props-3d', 'Props, args and attach', '3d'),
  guide('lights-and-materials-3d', 'Lights and materials', '3d'),
  guide('events-3d', 'Events in 3D', '3d', 'Events'),
  guide('loading-3d', 'Loading models and textures', '3d', 'Loading'),
  guide('swap-imports', 'Swap your three.js imports', 'threejs-compat'),
  guide('your-first-scene', 'Your first scene', 'threejs-compat'),
  guide('events-and-interaction', 'Events and interaction', 'threejs-compat'),
  guide('loading-models', 'Loading models', 'threejs-compat'),
  guide('loading-textures', 'Loading textures', 'threejs-compat'),
  guide('basic-animations', 'Basic animations', 'threejs-compat'),
  guide('lights-and-shadows', 'Lights and shadows', 'threejs-compat'),
  guide('environment', 'Environment', 'threejs-compat', undefined, 'environment/'),
  guide('camera-controls', 'Camera controls', 'threejs-compat', undefined, 'addons/controls/'),
  guide('canvas', 'Canvas', 'threejs-compat'),
  guide('objects', 'Objects, properties and arguments', 'threejs-compat', 'Objects'),
  guide('loading-hooks', 'Loading hooks', 'threejs-compat'),
  guide('events', 'Events', 'threejs-compat'),
  guide('three-entry', 'The three entry', 'threejs-compat'),
  guide('visibility', 'Visibility', 'threejs-compat'),
  guide('camera-parenting', 'Camera parenting', 'threejs-compat'),
  guide('render-targets', 'Render targets', 'threejs-compat', undefined, 'environment/'),
  guide(DIFFERENCES_ID, 'Differences from react-three-fiber', 'threejs-compat', 'Differences from r3f'),
  guide('scaling-performance', 'Scaling performance', 'threejs-compat'),
  { id: FORK_ID, title: 'Renderer hooks', file: 'packages/r3f/README.md', section: 'r3f' },
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
