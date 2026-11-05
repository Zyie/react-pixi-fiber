import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type { ExamplePicture } from '@site/plugins/example/types';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/** What a card shows for an example whose visual test hasn't drawn a picture yet */
const NO_THUMBNAIL: ExamplePicture = { src: '/img/no-picture.svg', width: 400, height: 300 };

/**
 * An example as a card: its thumbnail over its title, a link to its page
 * @param props - The example's page, title and thumbnail, whether the card is the small one of a list
 * beside other things, a class for the link, and what goes under the title
 */
export default function ExampleCard(props: {
  href: string;
  title: string;
  thumbnail: ExamplePicture | null;
  small?: boolean;
  className?: string;
  children?: ReactNode;
}): ReactNode {
  const { href, title, small, className, children } = props;
  const thumbnail = props.thumbnail ?? NO_THUMBNAIL;
  const src = useBaseUrl(thumbnail.src);

  return (
    <Link to={href} className={clsx(styles.card, small && styles.cardSmall, className)}>
      <span className={styles.thumb}>
        <img src={src} width={thumbnail.width} height={thumbnail.height} alt="" loading="lazy" decoding="async" />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>{title}</span>
        {children}
      </span>
    </Link>
  );
}
