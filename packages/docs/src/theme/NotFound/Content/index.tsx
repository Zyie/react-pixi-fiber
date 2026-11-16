import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import type { Props } from '@theme/NotFound/Content';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** Where a lost reader most likely wanted to go */
const WAYS = [
  { to: '/docs/', title: 'Docs', body: 'The packages, a first scene and every guide' },
  { to: '/examples/', title: 'Examples', body: 'Every example, drawn by its visual test' },
  { to: '/api/', title: 'API', body: 'Every export, from its JSDoc' },
  { to: '/docs/threejs-compat/differences/', title: 'Differences', body: 'What differs from react-three-fiber' },
];

/**
 * The 404 page: a row of cubes with one missing from the scene, and the ways back
 * @param props - A class from the page
 */
export default function NotFoundContent(props: Props): ReactNode {
  return (
    <main className={clsx(styles.page, props.className)}>
      <div className={styles.art} aria-hidden="true">
        <span />
        <span />
        <span className={styles.missing} />
        <span />
      </div>
      <p className={styles.code}>404</p>
      <Heading as="h1" className={styles.title}>
        This page never made it into the scene
      </Heading>
      <p className={styles.lead}>
        The link may be old, or the page may have moved. Search from the bar above, or start from one of these.
      </p>
      <ul className={styles.ways}>
        {WAYS.map(({ to, title, body }) => (
          <li key={to}>
            <Link to={to} className={styles.way}>
              <span className={styles.wayTitle}>{title}</span>
              <span className={styles.wayBody}>{body}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/" className={styles.home}>
        Back to the home page
      </Link>
    </main>
  );
}
