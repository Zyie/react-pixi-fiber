import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** The layers of react-pixi-fiber, top to bottom, with whose code each is */
const LAYERS: readonly {
  name: string;
  owner: 'react' | 'r3f' | 'ours' | 'pixi';
  ownerLabel: string;
  body: ReactNode;
}[] = [
  {
    name: 'Your app',
    owner: 'react',
    ownerLabel: 'React',
    body: (
      <>
        <code>&lt;Canvas&gt;</code>, <code>&lt;sprite2D&gt;</code>, <code>&lt;mesh3D&gt;</code> or three&apos;s{' '}
        <code>&lt;mesh&gt;</code>, <code>useFrame</code>: react-three-fiber&apos;s API.
      </>
    ),
  },
  {
    name: '2d, 3d and threejs-compat',
    owner: 'ours',
    ownerLabel: 'packages',
    body: (
      <>
        Each registers its elements and the hooks of the objects it owns with core, through pixi.js&apos;s{' '}
        <code>extensions</code>.
      </>
    ),
  },
  {
    name: 'core',
    owner: 'ours',
    ownerLabel: 'react-pixi-fiber',
    body: (
      <>The renderer support, the stage, hit order across 2D and 3D, a root&apos;s scene and camera, the bridges.</>
    ),
  },
  {
    name: 'react-three-fiber v10 core',
    owner: 'r3f',
    ownerLabel: 'r3f, forked',
    body: <>Reconciler, store, frame loop, events, Canvas and loaders, with eight renderer hooks in a checked diff.</>,
  },
  {
    name: 'pixi.js and @pixi/3d',
    owner: 'pixi',
    ownerLabel: 'PixiJS',
    body: <>2D, meshes, materials, lights and glTF, drawn with WebGL or WebGPU.</>,
  },
];

/** How react-pixi-fiber is built, as a stack of its layers */
export default function Layers(): ReactNode {
  return (
    <div className={styles.layers}>
      <ol className={styles.stack}>
        {LAYERS.map(({ name, owner, ownerLabel, body }) => (
          <li key={name} className={styles[owner]}>
            <div className={styles.head}>
              <span className={styles.name}>{name}</span>
              <span className={styles.owner}>{ownerLabel}</span>
            </div>
            <p className={styles.body}>{body}</p>
          </li>
        ))}
      </ol>
      <div className={styles.aside}>
        <p>
          Because r3f&apos;s core is forked rather than rewritten, it behaves as r3f does: the same event order, the
          same Suspense, the same frame loop. Its whole change is a diff of a few hundred lines.
        </p>
        <p>
          Core answers the fork&apos;s hooks for pixi, and asks the package that owns each object: 2d for
          pixi.js&apos;s, 3d for @pixi/3d&apos;s. threejs-compat gives those same objects three&apos;s names.
        </p>
        <Link to="/docs/r3f/">Read about the r3f fork</Link>
      </div>
    </div>
  );
}
