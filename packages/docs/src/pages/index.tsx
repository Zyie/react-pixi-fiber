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
    <Layout title="react-three-fiber's API, rendered by pixi.js and pixi-3d" description={siteConfig.tagline}>
      <Hero />
      <main>
        <Section
          id="features"
          kicker="Why react-pixi-fiber"
          title="Everything r3f does in React, on pixi-3d"
          lead="The React side is react-three-fiber's own code. What changes is what it drives: pixi-3d objects under three's names."
          className={styles.tinted}
        >
          <Features />
        </Section>

        <Section
          id="two-d"
          kicker="pixi.js 2D"
          title="2D in the same tree, and across into the 3D"
          lead="pixi.js's classes are elements too, drawn over or under the 3D with the same hooks and events. Four bridges cross between them."
        >
          <TwoD />
          <div className={styles.links}>
            <Link className={styles.more} to="/docs/2d/your-first-2d-scene/">
              Your first 2D scene
            </Link>
            <Link className={styles.more} to="/docs/2d/mixing-2d-and-3d/">
              Mixing 2D and 3D
            </Link>
            <Link className={styles.more} to="/examples/?topic=2d">
              The 2D examples
            </Link>
          </div>
        </Section>

        <Section
          id="how-it-works"
          kicker="How it works"
          title="r3f's core, a thin seam, pixi-3d"
          lead="Four layers, and only one of them is new code."
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
                Install it beside React and PixiJS, and write the scene you would write for react-three-fiber, with
                pixi.js 2D beside it.
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
