import Link from '@docusaurus/Link';
import type { ExamplePicture } from '@site/plugins/example/types';
import ExampleCard from '@site/src/components/Examples/ExampleCard';
import catalogue from '@site/static/example-sources/index.json';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** The title of every example, by id, as the gallery and its page show it */
const TITLES = new Map(catalogue.examples.map(({ id, title }) => [id, title]));

/** A page of the Docs section that uses a name, with the sections that link its reference */
export interface ApiGuideUse {
  readonly title: string;
  readonly href: string;
  /** The `##` sections that link it; empty when only the page's opening does, or for a whole guide */
  readonly sections: readonly { readonly title: string; readonly href: string }[];
}

/** An example that imports a name or an entry */
export interface ApiExampleUse {
  /** `<topic>/<name>`, its page under `/examples/` */
  readonly id: string;
  /** Its picture cropped to what it draws, as the gallery's cards show it; null when it has none */
  readonly thumbnail: ExamplePicture | null;
}

/** The props the API generator writes */
export interface ApiUsageProps {
  guides: readonly ApiGuideUse[];
  examples: readonly ApiExampleUse[];
  /** The gallery of every example that uses it, when the list shows only some */
  more?: { readonly count: number; readonly href: string } | null;
}

/** How many sections the guides may list in all before each guide folds its list away */
const OPEN_SECTIONS = 10;

/**
 * A guide, with the sections of it that link the reference, open or folded under their count
 * @param props - The guide, and whether its sections fold
 */
function GuideRow(props: { guide: ApiGuideUse; folded: boolean }): ReactNode {
  const { guide, folded } = props;
  const count = guide.sections.length;
  const sections = count > 0 && (
    <ul className={styles.usageSections}>
      {guide.sections.map((section) => (
        <li key={section.href}>
          <Link to={section.href} className={styles.usageSection}>
            {section.title}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <li>
      <Link to={guide.href} className={styles.usageGuide}>
        {guide.title}
      </Link>
      {sections &&
        (folded ? (
          <details className={styles.usageFold}>
            <summary>
              {count} section{count === 1 ? '' : 's'}
            </summary>
            {sections}
          </details>
        ) : (
          sections
        ))}
    </li>
  );
}

/**
 * Where the Docs section and the examples use a name or an entry: the guide sections that link its
 * reference, and the examples that import it, each a link to read or run it. Guides listed without
 * sections sit on a line; when the sections run long, each guide folds its own away.
 * @param props - The guides and the examples
 */
export default function ApiUsage(props: ApiUsageProps): ReactNode {
  const { guides, examples, more } = props;
  const sections = guides.reduce((total, guide) => total + guide.sections.length, 0);
  const folded = sections > OPEN_SECTIONS;

  return (
    <div className={styles.usage}>
      {guides.length > 0 && (
        <section className={styles.usageGroup} aria-label="Guides">
          <div className={styles.fieldsTitle}>Guides</div>
          <ul
            className={clsx(
              styles.usageGuides,
              sections === 0 && styles.usageGuidesInline,
              folded && styles.usageGuidesFolded,
            )}
          >
            {guides.map((guide) => (
              <GuideRow key={guide.href} guide={guide} folded={folded} />
            ))}
          </ul>
        </section>
      )}
      {examples.length > 0 && (
        <section className={styles.usageGroup} aria-label="Examples">
          <div className={styles.fieldsTitle}>Examples</div>
          <ul className={styles.usageExamples}>
            {examples.map(({ id, thumbnail }) => (
              <li key={id}>
                <ExampleCard
                  small
                  className={styles.usageExample}
                  href={`/examples/${id}/`}
                  title={TITLES.get(id) ?? id}
                  thumbnail={thumbnail}
                />
              </li>
            ))}
          </ul>
          {more && (
            <Link to={more.href} className={styles.usageMore}>
              See all {more.count} examples in the gallery
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
