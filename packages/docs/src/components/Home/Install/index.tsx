import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { CheckIcon, CopyIcon } from '@site/src/components/Live/Icons';
import { useCopy } from '@site/src/components/Live/useCopy';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * The install command, with a button that copies it
 * @param props - A class for the box
 */
export default function Install(props: { className?: string }): ReactNode {
  const install = String(useDocusaurusContext().siteConfig.customFields?.install);
  const [copied, copy] = useCopy();

  return (
    <div className={clsx(styles.install, props.className)}>
      <code className={styles.command}>
        <span className={styles.prompt} aria-hidden="true">
          $
        </span>
        {install}
      </code>
      <button
        type="button"
        className={styles.copy}
        onClick={() => void copy(install)}
        aria-label={copied ? 'Copied' : 'Copy the command'}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Copied to the clipboard' : ''}
      </span>
    </div>
  );
}
