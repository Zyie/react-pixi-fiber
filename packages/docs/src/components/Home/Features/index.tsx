import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** A guide a feature links to */
interface GuideLink {
  readonly label: string;
  readonly to: string;
}

/** The packages, each with an icon of 24 by 24 drawn in strokes, what it is and the guides about it */
const FEATURES: readonly { title: string; icon: ReactNode; body: ReactNode; guides: readonly GuideLink[] }[] = [
  {
    title: '@react-fiber/core',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 12h6M12 9v6" />
      </>
    ),
    body: (
      <>
        <code>&lt;Canvas&gt;</code>, roots, <code>useFrame</code>, <code>useThree</code> and the events, the stage that
        draws 2D over and under 3D, and the bridges between them. Every app has it.
      </>
    ),
    guides: [
      { label: 'Canvas and roots', to: '/docs/core/canvas-and-roots/' },
      { label: 'Events across 2D and 3D', to: '/docs/core/events-2d-and-3d/' },
    ],
  },
  {
    title: '@react-fiber/2d',
    icon: (
      <>
        <rect x="4" y="6" width="10" height="10" rx="1.5" />
        <circle cx="16" cy="14" r="4" />
      </>
    ),
    body: (
      <>
        pixi.js&apos;s classes as elements: <code>&lt;sprite2D&gt;</code>, <code>&lt;graphics2D&gt;</code>,{' '}
        <code>&lt;text2D&gt;</code>, filters and masks, with pixi&apos;s own options and no change to its classes.
      </>
    ),
    guides: [{ label: 'Your first 2D scene', to: '/docs/2d/your-first-2d-scene/' }],
  },
  {
    title: '@react-fiber/3d',
    icon: (
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" opacity="0.6" />
      </>
    ),
    body: (
      <>
        @pixi/3d&apos;s classes as elements under pixi&apos;s conventions: <code>&lt;mesh3D&gt;</code>,{' '}
        <code>&lt;sphereGeometry3D&gt;</code>, <code>&lt;phongMaterial3D&gt;</code>, options objects as{' '}
        <code>args</code>.
      </>
    ),
    guides: [{ label: 'Your first 3D scene', to: '/docs/3d/your-first-3d-scene/' }],
  },
  {
    title: '@react-fiber/threejs-compat',
    icon: (
      <>
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
        <path d="M13.5 4l-3 16" />
      </>
    ),
    body: (
      <>
        Optional: three.js&apos;s names and API over @pixi/3d, <code>&lt;mesh&gt;</code> and{' '}
        <code>&lt;meshStandardMaterial&gt;</code> included, so a react-three-fiber app swaps its imports.
      </>
    ),
    guides: [
      { label: 'Swap your imports', to: '/docs/threejs-compat/swap-imports/' },
      { label: 'Differences from r3f', to: '/docs/threejs-compat/differences/' },
    ],
  },
  {
    title: '@react-fiber/r3f',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    body: (
      <>
        react-three-fiber v10&apos;s own core, forked so it asks its renderer through eight hooks, in a checked diff
        that r3f&apos;s own tests pass on.
      </>
    ),
    guides: [
      { label: 'Renderer hooks', to: '/docs/r3f/renderer-hooks/' },
      { label: 'The diff', to: '/docs/r3f/diff/' },
    ],
  },
];

/** The packages, as a grid of cards */
export default function Features(): ReactNode {
  return (
    <ul className={styles.grid}>
      {FEATURES.map(({ title, icon, body, guides }) => (
        <li key={title} className={styles.card}>
          <svg className={styles.icon} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            {icon}
          </svg>
          <div className={styles.text}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>{' '}
            <p className={styles.guides}>
              {guides.map(({ label, to }) => (
                <Link key={to} to={to} className={styles.guide}>
                  {label}
                </Link>
              ))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
