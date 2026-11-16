import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** One package entry, as the index of the API reference lists it */
export interface ApiEntrySummary {
  /** What it's imported by: `react-pixi-fiber` */
  name: string;
  /** Its overview */
  href: string;
  /** What it's for, with inline code in backticks */
  summary: string;
  /** How many names it exports, in words */
  count: string;
}

/**
 * Text with its backtick spans as inline code
 * @param text - The text
 */
function withCode(text: string): ReactNode {
  return text.split(/`([^`]+)`/).map((part, index) => (index % 2 ? <code key={index}>{part}</code> : part));
}

/**
 * The package entries as a grid of cards, each a link to its overview
 * @param props - The entries
 */
export default function ApiEntries(props: { entries: readonly ApiEntrySummary[] }): ReactNode {
  const { entries } = props;

  return (
    <ul className={styles.entries}>
      {entries.map((entry) => (
        <li key={entry.name}>
          <Link to={entry.href} className={styles.entry}>
            <span className={styles.entryName}>{entry.name}</span>
            <span className={styles.entrySummary}>{withCode(entry.summary)}</span>
            <span className={styles.entryCount}>{entry.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
