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
            React renderers for pixi.js 2D and @pixi/3d
          </p>
          <Heading as="h1" className={styles.title}>
            <span className={styles.nowrap}>react-three-fiber&apos;s</span> API, rendered by{' '}
            <span className={styles.brand}>PixiJS</span>
          </Heading>
          <p className={styles.lead}>
            <code>&lt;Canvas&gt;</code>, <code>useFrame</code>, events and Suspense, with pixi.js&apos;s 2D and
            @pixi/3d&apos;s 3D as elements of one tree. r3f&apos;s own core runs it, and an r3f app swaps its imports to
            run on it.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/">
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/threejs-compat/swap-imports/">
              Swap your three.js imports
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
