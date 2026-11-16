import Head from '@docusaurus/Head';
import type { ReactNode } from 'react';

/** The bundler's `require`, which gives a font file's hashed URL, the one tokens.css's faces load */
declare function require(request: string): { default: string };

/**
 * The Latin faces of Inter, the text, and Outfit, the headings and the navbar's title, which every page
 * shows in its first screen. Preloaded, they arrive with the stylesheet instead of after it, so on a
 * slow phone they swap in before the first paint rather than reflowing the text after it.
 */
const FONTS = [
  require('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2').default,
  require('@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2').default,
];

/**
 * Every page: the font preloads, then the app
 * @param props - The app
 */
export default function Root(props: { children: ReactNode }): ReactNode {
  return (
    <>
      <Head>
        {FONTS.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </Head>
      {props.children}
    </>
  );
}
