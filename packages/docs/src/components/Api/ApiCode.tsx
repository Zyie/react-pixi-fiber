import Link from '@docusaurus/Link';
import { usePrismTheme } from '@docusaurus/theme-common';
import CodeBlockContainer from '@theme/CodeBlock/Container';
import { Highlight } from 'prism-react-renderer';
import { Fragment, memo } from 'react';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** The props the API generator writes */
export interface ApiCodeProps {
  /** TypeScript: a signature, or a type */
  code: string;
  /** The page of each name the code mentions that has one */
  links?: Readonly<Record<string, string>>;
  /** Whether it sits in a line of text, as the type of a field does */
  inline?: boolean;
}

/**
 * The text of a token with each name that has a page made a link to it
 * @param text - The token's text
 * @param links - The page of each name
 */
function linked(text: string, links: Readonly<Record<string, string>>): ReactNode {
  const parts = text.split(/([A-Za-z_$][\w$]*)/);

  return parts.length === 1
    ? text
    : parts.map((part, index) => {
        const to = index % 2 && Object.hasOwn(links, part) ? links[part] : undefined;

        return to ? (
          <Link key={index} to={to} className={styles.ref}>
            {part}
          </Link>
        ) : (
          part
        );
      });
}

/**
 * TypeScript of the API reference, highlighted as the site's code blocks are, with the names that have
 * a page linked to it. It is memoised, as a filter re-renders every field of a long list on each key.
 * @param props - The code and its links
 */
function ApiCode(props: ApiCodeProps): ReactNode {
  const { code, links, inline = false } = props;
  const theme = usePrismTheme();

  return (
    <Highlight theme={theme} code={code} language="typescript">
      {({ tokens, getTokenProps }) => {
        const content = tokens.map((line, row) => (
          <Fragment key={row}>
            {row > 0 && '\n'}
            {line.map((token, column) => {
              const { children, style, ...rest } = getTokenProps({ token });
              const literal = token.types.includes('string') || token.types.includes('comment');
              const unbroken = inline && !/\s/.test(children) ? { ...style, whiteSpace: 'nowrap' as const } : style;

              return (
                <span key={column} style={unbroken} {...rest}>
                  {links && !literal ? linked(children, links) : children}
                </span>
              );
            })}
          </Fragment>
        ));

        return inline ? (
          <code className={styles.type}>{content}</code>
        ) : (
          <CodeBlockContainer as="div" className={styles.signature}>
            <pre className={styles.pre} tabIndex={0}>
              <code>{content}</code>
            </pre>
          </CodeBlockContainer>
        );
      }}
    </Highlight>
  );
}

export default memo(ApiCode);
