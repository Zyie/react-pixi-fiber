import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

import type { GalleryTopic } from './types';

import styles from './styles.module.css';

/**
 * Where an example's guide explains it, a link to each section that shows its code, and the rest of
 * the topic's examples
 * @param props - The topic and the sections
 */
export default function GuideSections(props: {
  topic: GalleryTopic;
  sections: readonly { title: string; href: string }[];
}): ReactNode {
  const { topic, sections } = props;

  return (
    <aside className={styles.guide} aria-labelledby="in-the-guide">
      <p id="in-the-guide" className={styles.guideTitle}>
        {topic.guide ? (
          <>
            Explained in <Link to={topic.guide}>{topic.title}</Link>
          </>
        ) : (
          topic.title
        )}
      </p>
      {sections.length > 0 && (
        <ul className={styles.guideList}>
          {sections.map((section) => (
            <li key={section.href}>
              <Link to={section.href} className={styles.guideLink}>
                <span>{section.title}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/examples/?topic=${topic.id}`} className={styles.guideMore}>
        More examples in {topic.title}
      </Link>
    </aside>
  );
}
