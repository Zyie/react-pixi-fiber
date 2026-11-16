import Link from '@docusaurus/Link';
import { useCopy } from '@site/src/components/Live/useCopy';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import ApiCode from './ApiCode';

import styles from './styles.module.css';

/** The props the API generator writes */
export interface ApiMetaProps {
  /** What the name is: `Function`, `Interface`, `Added to React` */
  kind: string;
  /** Whether it's tagged `@advanced`: for integrations and tuning, not typical code */
  advanced?: boolean;
  /** Whether r3f's vendored core declares it, so it works as react-three-fiber documents it */
  vendored?: boolean;
  /** The import that brings it in */
  importLine: string;
  /** Its declaration on GitHub */
  source: string;
  /** The file and line of the declaration */
  sourceLabel: string;
}

/**
 * A small label, such as the tier of a name
 * @param props - The label
 */
export function ApiBadge(props: { children: ReactNode }): ReactNode {
  return <span className={clsx(styles.badge, styles.advanced)}>{props.children}</span>;
}

/**
 * The line under a name's title: its kind and tier, the import that brings it in, which copies on a
 * click, and its source
 * @param props - What the generator knows of the name
 */
export default function ApiMeta(props: ApiMetaProps): ReactNode {
  const { kind, advanced, vendored, importLine, source, sourceLabel } = props;
  const [copied, copy] = useCopy();

  return (
    <div className={styles.meta}>
      <div className={styles.badges}>
        <span className={styles.badge}>{kind}</span>
        {advanced && (
          <span
            className={clsx(styles.badge, styles.advanced)}
            title="For integrations and tuning; typical code doesn't need it"
          >
            Advanced
          </span>
        )}
        {vendored && (
          <span
            className={clsx(styles.badge, styles.vendored)}
            title="Declared by react-three-fiber's core, which react-pixi-fiber runs unchanged"
          >
            From react-three-fiber
          </span>
        )}
      </div>
      <Link to={source} className={styles.source}>
        <span className="github-icon" aria-hidden="true" />
        <span className={styles.sourceLabel}>{sourceLabel}</span>
      </Link>
      <button
        type="button"
        className={styles.import}
        onClick={() => void copy(importLine)}
        aria-label={`Copy ${importLine}`}
      >
        <ApiCode code={importLine} inline />
        <span className={styles.copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
    </div>
  );
}
