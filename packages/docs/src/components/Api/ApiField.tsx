import useBrokenLinks from '@docusaurus/useBrokenLinks';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import ApiCode from './ApiCode';

import styles from './styles.module.css';

/** The props the API generator writes */
export interface ApiFieldProps {
  /** The anchor of a property, which links name it */
  id?: string;
  /** The name of a parameter or a property; none for a return value or an exception */
  name?: string;
  /** Its type as TypeScript */
  type?: string;
  /** The page of each name the type mentions that has one */
  links?: Readonly<Record<string, string>>;
  optional?: boolean;
  readonly?: boolean;
  /** The value it starts with, or its default */
  value?: string;
  /** Its description */
  children?: ReactNode;
}

/**
 * One row of a list of parameters or properties: the name and type on a line, the description under them
 * @param props - The field
 */
export default function ApiField(props: ApiFieldProps): ReactNode {
  const { id, name, type, links, optional, readonly, value, children } = props;

  const mark = optional && (
    <abbr className={styles.optional} title="Optional">
      ?
    </abbr>
  );

  useBrokenLinks().collectAnchor(id);

  return (
    <div id={id} className={clsx(styles.field, id && styles.anchored)}>
      <div className={styles.fieldHead}>
        {name &&
          (id ? (
            <a href={`#${id}`} className={styles.fieldName}>
              {name}
              {mark}
            </a>
          ) : (
            <span className={styles.fieldName}>
              {name}
              {mark}
            </span>
          ))}
        {readonly && <span className={styles.flag}>readonly</span>}
        {type && <ApiCode code={type} links={links} inline />}
        {value && (
          <span className={styles.value}>
            = <code>{value}</code>
          </span>
        )}
      </div>
      {children && <div className={styles.fieldBody}>{children}</div>}
    </div>
  );
}

/**
 * A list of fields, with a label when it sits inside a member's section
 * @param props - The fields, and the label
 */
export function ApiFields(props: { title?: string; children?: ReactNode }): ReactNode {
  const { title, children } = props;

  return (
    <div className={styles.fields}>
      {title && <div className={styles.fieldsTitle}>{title}</div>}
      {children}
    </div>
  );
}
