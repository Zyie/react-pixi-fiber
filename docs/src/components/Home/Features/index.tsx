import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** A guide a feature links to */
interface GuideLink {
  readonly label: string;
  readonly to: string;
}

/** What react-pixi-fiber promises, each with an icon of 24 by 24 drawn in strokes and the guides about it */
const FEATURES: readonly { title: string; icon: ReactNode; body: ReactNode; guides: readonly GuideLink[] }[] = [
  {
    title: "r3f's own core",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    body: (
      <>
        The reconciler, the store, the frame loop, the events and <code>&lt;Canvas&gt;</code> are react-three-fiber
        v10&apos;s own code, forked with a small, checked diff that adds renderer hooks; r3f&apos;s own tests pass on
        it.
      </>
    ),
    guides: [{ label: 'How it works', to: '/docs/#how-does-it-work' }],
  },
  {
    title: "three's names in JSX",
    icon: (
      <>
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
        <path d="M13.5 4l-3 16" />
      </>
    ),
    body: (
      <>
        <code>&lt;mesh&gt;</code>, <code>&lt;boxGeometry&gt;</code> and <code>&lt;meshStandardMaterial&gt;</code> are
        pixi-3d objects with three&apos;s arguments and props, so <code>args</code> and <code>color</code> mean what
        they mean in three.js.
      </>
    ),
    guides: [{ label: 'Your first scene', to: '/docs/getting-started/your-first-scene/' }],
  },
  {
    title: 'Hooks you already know',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    body: (
      <>
        <code>useFrame</code>, <code>useThree</code>, <code>useLoader</code> and Suspense, <code>invalidate</code> and{' '}
        <code>advance</code> run as r3f runs them, because they are r3f.
      </>
    ),
    guides: [{ label: 'Basic animations', to: '/docs/tutorials/basic-animations/' }],
  },
  {
    title: 'Events that bubble',
    icon: (
      <>
        <path d="M5 3l6 16 2.5-6.5L20 10z" />
      </>
    ),
    body: (
      <>
        <code>onClick</code>, <code>onPointerOver</code> and the rest dispatch through r3f&apos;s event system, on hits
        from pixi-3d&apos;s ray casts against each mesh&apos;s geometry.
      </>
    ),
    guides: [{ label: 'Events and interaction', to: '/docs/tutorials/events-and-interaction/' }],
  },
  {
    title: 'WebGL and WebGPU',
    icon: (
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
      </>
    ),
    body: (
      <>
        PixiJS picks the renderer and pixi-3d draws through it: physically based materials, shadows, image-based light
        and glTF models.
      </>
    ),
    guides: [
      { label: 'Loading models', to: '/docs/tutorials/loading-models/' },
      { label: 'Loading textures', to: '/docs/tutorials/loading-textures/' },
    ],
  },
  {
    title: 'Parity, measured',
    icon: (
      <>
        <rect x="3" y="5" width="8" height="14" rx="2" />
        <rect x="13" y="5" width="8" height="14" rx="2" />
        <path d="M7 9v6M17 9v6" opacity="0.6" />
      </>
    ),
    body: (
      <>
        A scene names only the package, so the same file renders through real three.js too. Every difference is written
        down, item by item.
      </>
    ),
    guides: [{ label: 'Differences from r3f', to: '/docs/reference/differences/' }],
  },
];

/** What the library promises, as a grid of cards */
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
