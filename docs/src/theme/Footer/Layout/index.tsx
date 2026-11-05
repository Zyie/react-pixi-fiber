import Link from '@docusaurus/Link';
import { ThemeClassNames } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { Props } from '@theme/Footer/Layout';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * The footer: the wordmark and tagline beside the link columns of the config, then the copyright and
 * the logo of the config's `footer.logo`
 * @param props - The parts Docusaurus renders from `themeConfig.footer`
 */
export default function FooterLayout(props: Props): ReactNode {
  const { links, logo, copyright } = props;
  const { siteConfig } = useDocusaurusContext();

  return (
    <footer className={clsx(ThemeClassNames.layout.footer.container, 'footer', styles.footer)}>
      <div className="container container-fluid">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.wordmark} aria-label="react-pixi-fiber home">
              <img src={useBaseUrl('/img/logo.svg')} alt="" width={40} height={40} loading="lazy" />
              <span>react-pixi-fiber</span>
            </Link>
            <p className={styles.tagline}>{siteConfig.tagline}</p>
          </div>
          <div className={styles.links}>{links}</div>
        </div>
        <div className={styles.bottom}>
          {copyright}
          {logo && <div className={styles.logo}>{logo}</div>}
        </div>
      </div>
    </footer>
  );
}
