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
    name: 'Your scene',
    owner: 'react',
    ownerLabel: 'React',
    body: (
      <>
        <code>&lt;Canvas&gt;</code>, <code>&lt;mesh&gt;</code>, <code>useFrame</code>: written for react-three-fiber,
        imported from <code>react-pixi-fiber</code>.
      </>
    ),
  },
  {
    name: 'react-three-fiber v10 core',
    owner: 'r3f',
    ownerLabel: 'r3f, forked',
    body: <>Reconciler, store, frame loop, events, Canvas and loaders, with renderer hooks in a checked diff.</>,
  },
  {
    name: 'Support, three-compat and aliases',
    owner: 'ours',
    ownerLabel: 'react-pixi-fiber',
    body: (
      <>
        A pixi-3d renderer behind r3f&apos;s seam, three&apos;s object surface on pixi-3d objects, and three&apos;s JSX
        names.
      </>
    ),
  },
  {
    name: 'pixi-3d on PixiJS',
    owner: 'pixi',
    ownerLabel: 'pixi-3d',
    body: <>Meshes, materials, lights and glTF, drawn with WebGL or WebGPU.</>,
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
          Because r3f&apos;s core is copied rather than rewritten, it behaves as r3f does: the same event order, the
          same Suspense, the same frame loop. Updating it is copying it again.
        </p>
        <p>
          What react-pixi-fiber writes is the thin layer that teaches that core to drive pixi-3d. Where pixi-3d differs
          from three.js, the reference says so.
        </p>
        <Link to="/docs/reference/differences/">Read what differs from react-three-fiber</Link>
      </div>
    </div>
  );
}
