/**
 * The pieces the generated Docs pages are set in, besides `<Example>`: each wraps Markdown the page
 * writes, so the page's Markdown for language models keeps the text and drops only the wrapper.
 */
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * The paragraph that opens a page, set larger than the prose under it
 * @param props - The paragraph, as Markdown
 */
export function Lead(props: { children: ReactNode }): ReactNode {
  return <div className={styles.lead}>{props.children}</div>;
}

/**
 * The link under a code block of part of an example, to the page that runs all of it
 * @param props - The example's page and its file name
 */
export function RunExample(props: { to: string; file: string }): ReactNode {
  return (
    <p className={styles.run}>
      <Link to={props.to}>
        Run <code>{props.file}</code> live <span aria-hidden="true">→</span>
      </Link>
    </p>
  );
}

/**
 * A Markdown list as a grid of cards: an item's first link is its title and covers the card, and the
 * text after it says what is there
 * @param props - The list, and what the cards are for the reader of a screen reader
 */
export function Cards(props: { label: string; children: ReactNode }): ReactNode {
  return (
    <nav className={styles.cards} aria-label={props.label}>
      {props.children}
    </nav>
  );
}

/**
 * How an item of react-three-fiber's surface carries over to pixi-3d, as a coloured label
 * @param props - The kind, which picks the colour (`as-is`, `adapter`, `pixi3d-change`, `r3f-core-change`,
 *   `not-feasible`), and the label
 */
export function Status(props: { kind: string; label: string }): ReactNode {
  return (
    <span className={clsx(styles.status, styles[`status--${props.kind}`])} data-status={props.kind}>
      {props.label}
    </span>
  );
}
