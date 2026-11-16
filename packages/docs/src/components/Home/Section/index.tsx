import Heading from '@theme/Heading';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** The props of a section of the home page */
export interface SectionProps {
  /** Its anchor, and the id its heading is labelled by */
  id: string;
  /** The small line above the title */
  kicker: string;
  title: ReactNode;
  /** The paragraph under the title */
  lead?: ReactNode;
  /** Centres the header, for a section whose content is centred too */
  centered?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A section of the home page: a kicker, a title and a lead, then its content
 * @param props - The section
 */
export default function Section(props: SectionProps): ReactNode {
  const { id, kicker, title, lead, centered, className, children } = props;

  return (
    <section id={id} className={clsx(styles.section, className)} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className={clsx(styles.header, centered && styles.centered)}>
          <p className={styles.kicker}>{kicker}</p>
          <Heading as="h2" id={`${id}-title`} className={styles.title}>
            {title}
          </Heading>
          {lead && <p className={styles.lead}>{lead}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
