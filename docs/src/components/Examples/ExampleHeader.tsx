import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

import type { GalleryTopic } from './types';

import styles from './styles.module.css';

/**
 * The line under an example page's title: its topic, a link to the gallery filtered by it, and its
 * source on GitHub
 * @param props - What the examples generator knows of the example
 */
export default function ExampleHeader(props: { topic: GalleryTopic; source: string }): ReactNode {
  const { topic, source } = props;

  return (
    <div className={styles.header}>
      <span className={styles.headerLabel}>Topic</span>
      <Link
        to={`/examples/?topic=${topic.id}`}
        className={styles.badge}
        aria-label={`${topic.title}: every example of the topic`}
      >
        {topic.title}
      </Link>
      <Link to={source} className={styles.source}>
        <span className="github-icon" aria-hidden="true" />
        View source
      </Link>
    </div>
  );
}
