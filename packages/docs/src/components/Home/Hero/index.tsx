import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import type { ReactNode } from 'react';

import Install from '../Install';
import Swap from '../Swap';

import styles from './styles.module.css';

/** The top of the home page: what the library is, how to start, and the scene whose import it swaps */
export default function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.version}>r3f v10</span>
            React renderer for pixi.js 2D and pixi-3d
          </p>
          <Heading as="h1" className={styles.title}>
            <span className={styles.nowrap}>react-three-fiber&apos;s</span> API, rendered by{' '}
            <span className={styles.brand}>pixi-3d</span>
          </Heading>
          <p className={styles.lead}>
            Write the scene as you would for react-three-fiber: <code>&lt;Canvas&gt;</code>, <code>&lt;mesh&gt;</code>,{' '}
            <code>useFrame</code>, events and Suspense. r3f&apos;s own core runs it, pixi-3d draws it, and pixi.js 2D
            draws over, under and inside it.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/getting-started/your-first-scene/">
              Your first scene
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/reference/differences/">
              What differs from r3f
            </Link>
          </div>
          <Install className={styles.install} />
          <ul className={styles.facts}>
            <li>WebGL and WebGPU</li>
            <li>2D and 3D in one tree</li>
            <li>React 19</li>
            <li>MIT licensed</li>
          </ul>
        </div>
        <div className={styles.demo}>
          <Swap />
        </div>
      </div>
    </header>
  );
}
