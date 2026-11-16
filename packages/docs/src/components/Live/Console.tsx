import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { ChevronIcon, ClearIcon } from './Icons';
import type { ConsoleEntry } from './types';

import styles from './Console.module.css';

/** The props of `<Console>` */
export interface ConsoleProps {
  readonly entries: readonly ConsoleEntry[];
  /** Whether the list shows under a header that toggles it; without `onToggle`, the list always shows */
  readonly open?: boolean;
  /** Called by the header's toggle; without it, the console is a pane whose list fills its box */
  readonly onToggle?: () => void;
  readonly onClear?: () => void;
  readonly className?: string;
  /** Controls at the end of the header, such as a renderer switch */
  readonly children?: ReactNode;
}

/**
 * What a program wrote to its console, newest last, which follows the end of the list as it grows
 * @param props - The entries and the panel's state
 */
export default function Console(props: ConsoleProps): ReactNode {
  const { entries, onToggle, onClear, className, children } = props;
  const open = !onToggle || props.open;
  const list = useRef<HTMLOListElement>(null);
  const problems = entries.filter((entry) => entry.level === 'error' || entry.level === 'warn').length;
  const count = entries.length > 0 && (
    <span className={clsx(styles.count, problems > 0 && styles.problems)}>{entries.length}</span>
  );

  useEffect(() => {
    const element = list.current;

    if (element) element.scrollTop = element.scrollHeight;
  }, [entries, open]);

  return (
    <section className={clsx(styles.console, !onToggle && styles.pane, className)} aria-label="Console">
      <div className={styles.header}>
        {onToggle ? (
          <button type="button" className={styles.toggle} aria-expanded={open} onClick={onToggle}>
            <span className={clsx(styles.chevron, open && styles.open)}>
              <ChevronIcon />
            </span>
            Console
            {count}
          </button>
        ) : (
          <span className={styles.toggle}>
            Console
            {count}
          </span>
        )}
        {onClear && entries.length > 0 && (
          <button type="button" className={styles.clear} onClick={onClear} aria-label="Clear the console" title="Clear">
            <ClearIcon />
          </button>
        )}
        {children && <div className={styles.end}>{children}</div>}
      </div>
      {open && (
        <ol ref={list} className={styles.list} aria-live="polite">
          {entries.length === 0 && (
            <li className={styles.empty}>
              Nothing logged yet. <code>console.log</code> in your code shows here.
            </li>
          )}
          {entries.map((entry, i) => (
            <li key={i} className={clsx(styles.entry, styles[entry.level])}>
              {entry.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
