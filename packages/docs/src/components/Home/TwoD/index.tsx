import ExampleCard from '@site/src/components/Examples/ExampleCard';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** A 2D feature on the home page: the guide section about it and the picture of an example that shows it */
interface TwoDFeature {
  readonly title: string;
  readonly body: ReactNode;
  /** The guide, or the section of it, the card opens */
  readonly to: string;
  /** The example in `examples/2d` whose picture the card shows */
  readonly example: string;
}

const GUIDE = '/docs/2d/mixing-2d-and-3d/';

/** pixi.js 2D first, then the four bridges between 2D and 3D */
const FEATURES: readonly TwoDFeature[] = [
  {
    title: 'Sprites, graphics and text',
    body: (
      <>
        <code>&lt;sprite2D&gt;</code>, <code>&lt;graphics2D&gt;</code>, <code>&lt;text2D&gt;</code> and every other
        pixi.js class, with r3f&apos;s <code>args</code>, props, hooks and events.
      </>
    ),
    to: '/docs/2d/your-first-2d-scene/',
    example: 'graphics',
  },
  {
    title: 'Filters and masks',
    body: (
      <>
        <code>&lt;blurFilter2D attach=&quot;filters-0&quot; /&gt;</code>, pixi-filters through <code>extend</code>,
        masks and blend modes.
      </>
    ),
    to: '/docs/2d/filters-and-masks-2d/',
    example: 'filters',
  },
  {
    title: 'Labels that follow 3D',
    body: (
      <>
        <code>&lt;anchor2D&gt;</code> inside a mesh keeps names and health bars on it, hidden behind the camera.
      </>
    ),
    to: `${GUIDE}#2d-that-follows-3d`,
    example: 'anchored-labels',
  },
  {
    title: '3D inside 2D',
    body: (
      <>
        <code>&lt;View3D&gt;</code> draws a 3D scene in a 2D card that moves, fades and masks with it.
      </>
    ),
    to: `${GUIDE}#3d-inside-2d`,
    example: 'model-cards',
  },
  {
    title: '2D filters on the 3D',
    body: (
      <>
        <code>&lt;Layer3D&gt;</code> gives the canvas&apos;s 3D a 2D node&apos;s transform and filters, for shake and
        post effects.
      </>
    ),
    to: `${GUIDE}#the-3d-layer-as-a-2d-node`,
    example: 'impact',
  },
  {
    title: '2D on a material',
    body: (
      <>
        <code>&lt;RenderTexture2D&gt;</code> draws 2D into a texture, and its buttons still take clicks.
      </>
    ),
    to: `${GUIDE}#2d-in-a-texture`,
    example: 'screen-texture',
  },
];

/** pixi.js 2D and its bridges to 3D, as cards with the pictures of their examples */
export default function TwoD(): ReactNode {
  return (
    <ul className={styles.grid}>
      {FEATURES.map(({ title, body, to, example }) => (
        <li key={title}>
          <ExampleCard
            href={to}
            title={title}
            thumbnail={{ src: `/example-pictures/2d/${example}.webp`, width: 400, height: 300 }}
            className={styles.card}
          >
            <span className={styles.body}>{body}</span>
          </ExampleCard>
        </li>
      ))}
    </ul>
  );
}
