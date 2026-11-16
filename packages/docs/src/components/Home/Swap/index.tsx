import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** The two packages the panel swaps between, and what draws the scene with each */
const RENDERERS = {
  pixi: {
    from: '@react-fiber/threejs-compat',
    label: '@react-fiber/threejs-compat',
    drawn: 'pixi-3d',
    picture: '/img/hero-pixi.png',
  },
  three: { from: '@react-three/fiber', label: '@react-three/fiber', drawn: 'three.js', picture: '/img/hero-three.png' },
} as const;

type Choice = keyof typeof RENDERERS;

/** The scene, line by line, after its import: react-three-fiber's first scene */
const SCENE = [
  '',
  'export const App = () => (',
  '  <Canvas>',
  '    <ambientLight intensity={0.6} />',
  '    <directionalLight position={[2, 3, 5]} intensity={2.4} />',
  '    <mesh rotation={[0.5, 0.6, 0]}>',
  '      <boxGeometry args={[2, 2, 2]} />',
  '      <meshStandardMaterial color="hotpink" />',
  '    </mesh>',
  '  </Canvas>',
  ');',
];

/**
 * The hero's picture of the idea: one scene, whose import a reader swaps between react-three-fiber and
 * `@react-fiber/threejs-compat`, and the cube each draws: pixi-3d's through it, three.js's through r3f.
 * Only the import line changes.
 */
export default function Swap(): ReactNode {
  const [choice, setChoice] = useState<Choice>('pixi');
  const name = useId();
  const pixi = useBaseUrl(RENDERERS.pixi.picture);
  const three = useBaseUrl(RENDERERS.three.picture);
  const { from, drawn } = RENDERERS[choice];

  return (
    <figure className={styles.panel}>
      <div className={styles.bar}>
        <span className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className={styles.file}>App.tsx</span>
        <fieldset className={clsx('segmented', 'segmented--small', styles.switch)}>
          <legend className="sr-only">Import from</legend>
          {(Object.keys(RENDERERS) as Choice[]).map((each) => (
            <label key={each}>
              <input type="radio" name={name} value={each} checked={choice === each} onChange={() => setChoice(each)} />
              <span>{RENDERERS[each].label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className={styles.body}>
        <pre className={styles.code} aria-label="The scene">
          <code>
            <span className={styles.changed}>
              <span className={styles.keyword}>import</span> {'{ '}
              <span className={styles.name}>Canvas</span>
              {' } '}
              <span className={styles.keyword}>from</span>{' '}
              <span className={styles.string} key={from}>
                &apos;{from}&apos;
              </span>
              ;
            </span>
            {SCENE.map((line, index) => (
              <span key={index} className={styles.line}>
                {line}
              </span>
            ))}
          </code>
        </pre>
        <div className={styles.stage}>
          {(['pixi', 'three'] as const).map((each) => (
            <img
              key={each}
              className={clsx(each !== choice && styles.hidden)}
              src={each === 'pixi' ? pixi : three}
              width={480}
              height={360}
              alt={`A hot pink cube drawn by ${RENDERERS[each].drawn}, lit from the upper right, turned to show three faces`}
              decoding="async"
            />
          ))}
          <span className={styles.caption}>Drawn by {drawn}</span>
        </div>
      </div>
      <figcaption className={styles.note}>
        Swap the import; the scene stays as written. The visual tests hold every scene to three.js&apos;s picture of it,
        and <Link to="/docs/reference/differences/">the reference</Link> tracks what still differs.
      </figcaption>
    </figure>
  );
}
