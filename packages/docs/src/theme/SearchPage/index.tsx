import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {
  fetchIndexesByWorker,
  searchByWorker,
} from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker';
import { getStemmedPositions } from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/getStemmedPositions';
import { highlight } from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/highlight';
import { highlightStemmed } from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/highlightStemmed';
import { SearchDocumentType } from '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces';
import type { SearchResult } from '@easyops-cn/docusaurus-search-local/dist/client/shared/interfaces';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import styles from './styles.module.css';

/** The most results a search lists */
const LIMIT = 100;

/** How much of a result's text shows around its match, in characters */
const CONTEXT = 100;

/** The pages a reader who hasn't typed yet is offered */
const START_HERE: readonly { readonly label: string; readonly to: string; readonly about: string }[] = [
  { label: 'Introduction', to: '/docs/', about: "The packages, and react-three-fiber's API on pixi.js" },
  {
    label: 'Installation',
    to: '/docs/getting-started/installation/',
    about: 'Add the packages beside React and PixiJS',
  },
  { label: 'Your first 2D scene', to: '/docs/2d/your-first-2d-scene/', about: 'Sprites, graphics and text' },
  { label: 'Your first 3D scene', to: '/docs/3d/your-first-3d-scene/', about: "@pixi/3d's elements, lit" },
  { label: 'Swap your three.js imports', to: '/docs/threejs-compat/swap-imports/', about: 'Run an r3f app' },
  { label: 'Renderer hooks', to: '/docs/r3f/renderer-hooks/', about: "The r3f fork's interface" },
  { label: 'API reference', to: '/api/', about: 'Every name react-pixi-fiber exports' },
];

/**
 * One result: the heading or page that matched, as a link that marks the query's words on the page it
 * opens, then where it is in the sidebar and, for a match in text, the text around it
 * @param props - The result
 */
function Result(props: { result: SearchResult }): ReactNode {
  const { document, type, page, tokens, metadata } = props.result;
  const inText = type === SearchDocumentType.Content || type === SearchDocumentType.Description;
  const underTitle = inText || type === SearchDocumentType.Keywords;
  const inSection = type === SearchDocumentType.Heading || type === SearchDocumentType.Content;
  const path = [...((page || document).b ?? []), ...(page && inSection ? [page.t] : [])];
  const marks = new URLSearchParams(tokens.map((token) => ['_highlight', token]));
  const matched = (text: string): string => highlightStemmed(text, getStemmedPositions(metadata, 't'), tokens, CONTEXT);

  return (
    <article className={styles.result}>
      <h2>
        <Link
          to={`${document.u}${tokens.length ? `?${marks}` : ''}${document.h ?? ''}`}
          dangerouslySetInnerHTML={{ __html: underTitle ? highlight(document.s ?? '', tokens) : matched(document.t) }}
        />
      </h2>
      {path.length > 0 && <p className={styles.path}>{path.join(' › ')}</p>}
      {inText && <p className={styles.summary} dangerouslySetInnerHTML={{ __html: matched(document.t) }} />}
    </article>
  );
}

/**
 * The search page, `/search/`: the layout of @easyops-cn/docusaurus-search-local's own page, on its
 * search worker, with a placeholder in the box and, before anything is typed, the pages most readers
 * start from. The query is the URL's `q`, which follows the box as the reader types; `version` names the
 * docs version to search, as the search bar's "See all results" link writes it.
 */
export default function SearchPage(): ReactNode {
  const { baseUrl } = useDocusaurusContext().siteConfig;
  const browser = useIsBrowser();
  const history = useHistory();
  const { search } = useLocation();
  const params = new URLSearchParams(browser ? search : '');
  const linked = params.get('q') ?? '';
  const versionUrl = `${baseUrl}${params.get('version') ?? ''}`;
  const [query, setQuery] = useState(linked);
  const [read, setRead] = useState(linked);
  const [results, setResults] = useState<readonly SearchResult[] | null>(null);
  const [indexed, setIndexed] = useState(false);
  const title = query ? `Search results for "${query}"` : 'Search the documentation';

  // The URL's query: a link's as the page opens, and the search bar's while it's open
  if (linked !== read) {
    setRead(linked);
    setQuery(linked);
  }

  useEffect(() => {
    void fetchIndexesByWorker(versionUrl, '').then(() => setIndexed(true));
  }, [versionUrl]);

  useEffect(() => {
    let stale = false;

    void (query ? searchByWorker(versionUrl, '', query, LIMIT) : Promise.resolve(null)).then((found) => {
      if (!stale) setResults(found);
    });

    return () => {
      stale = true;
    };
  }, [query, versionUrl]);

  const type = (text: string): void => {
    const next = new URLSearchParams(history.location.search);

    if (text) next.set('q', text);
    else next.delete('q');
    setQuery(text);
    history.replace({ search: next.toString() });
  };

  return (
    <Layout>
      <Head>
        <meta property="robots" content="noindex, follow" />
        <title>{title}</title>
      </Head>
      <div className="container margin-vert--lg">
        <h1>{title}</h1>
        <input
          type="search"
          name="q"
          className={styles.input}
          aria-label="Search"
          placeholder="Search the guides and the API"
          value={query}
          onChange={(event) => type(event.target.value)}
          autoComplete="off"
          autoFocus
        />
        {query && !indexed && <p role="status">Loading the search index…</p>}
        {results && (
          <p>
            {results.length === 0
              ? 'No documents were found'
              : `${results.length} document${results.length === 1 ? '' : 's'} found`}
          </p>
        )}
        <section>
          {results?.map((result) => (
            <Result key={result.document.i} result={result} />
          ))}
        </section>
        {!query && (
          <nav className={styles.start} aria-labelledby="search-start-here">
            <h2 id="search-start-here" className={styles.title}>
              Start here
            </h2>
            <ul className={styles.links}>
              {START_HERE.map(({ label, to, about }) => (
                <li key={to}>
                  <Link to={to} className={styles.link}>
                    <span className={styles.label}>{label}</span>
                    <span className={styles.about}>{about}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </Layout>
  );
}
