import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Features from '@site/src/components/Home/Features';
import Hero from '@site/src/components/Home/Hero';
import Install from '@site/src/components/Home/Install';
import Layers from '@site/src/components/Home/Layers';
import Section from '@site/src/components/Home/Section';
import TwoD from '@site/src/components/Home/TwoD';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

import styles from './index.module.css';

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title="react-three-fiber's API, rendered by pixi.js and @pixi/3d" description={siteConfig.tagline}>
      <Hero />
      <main>
        <Section
          id="packages"
          kicker="The packages"
          title="Pick the packages for what you draw"
          lead="core is react-three-fiber's API on pixi.js. 2d and 3d add pixi's own classes as elements, and threejs-compat gives @pixi/3d three's names for an r3f app."
          className={styles.tinted}
        >
          <Features />
        </Section>

        <Section
          id="two-d"
          kicker="2D and 3D"
          title="2D in the same tree, and across into the 3D"
          lead="pixi.js's classes are elements beside @pixi/3d's, drawn over or under the 3D with the same hooks and events. Four bridges cross between them."
        >
          <TwoD />
          <div className={styles.links}>
            <Link className={styles.more} to="/docs/2d/your-first-2d-scene/">
              Your first 2D scene
            </Link>
            <Link className={styles.more} to="/docs/core/mixing-2d-and-3d/">
              Mixing 2D and 3D
            </Link>
            <Link className={styles.more} to="/examples/?topic=2d">
              The 2D examples
            </Link>
            <Link className={styles.more} to="/examples/?topic=core">
              The 2D and 3D examples
            </Link>
          </div>
        </Section>

        <Section
          id="how-it-works"
          kicker="How it works"
          title="r3f's core, the packages, PixiJS"
          lead="react-three-fiber's core asks its renderer through eight hooks; core answers them for pixi, and each package for its own objects."
          className={styles.tinted}
        >
          <Layers />
          <Link className={styles.more} to="/docs/#how-does-it-work">
            More on how it works
          </Link>
        </Section>

        <section className={styles.cta} aria-labelledby="start-title">
          <div className="container">
            <div className={styles.ctaInner}>
              <Heading as="h2" id="start-title" className={styles.ctaTitle}>
                Render your first scene
              </Heading>
              <p className={styles.ctaLead}>
                Install the packages beside React and PixiJS, and write 2D and 3D in one tree with
                react-three-fiber&apos;s API.
              </p>
              <Install />
              <div className={styles.ctaActions}>
                <Link className="button button--primary button--lg" to="/docs/">
                  Read the docs
                </Link>
                <Link className="button button--secondary button--lg" to="/examples/">
                  Browse the examples
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
