import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { SearchIcon } from '@site/src/components/Live/Icons';
import type { ReactNode } from 'react';
import { useLayoutEffect, useMemo, useState } from 'react';

import ExampleCard from './ExampleCard';
import type { GalleryExample, GalleryTopic } from './types';

import styles from './styles.module.css';

/** "example" or "examples", for a count */
const plural = (count: number): string => (count === 1 ? 'example' : 'examples');

/**
 * What the gallery shows, kept in the page's query so a filtered gallery can be shared. The gallery
 * writes the query past the router, so typing re-renders nothing else, and reads it after hydration and
 * on a navigation, such as a topic badge's link.
 */
interface Filters {
  readonly topic: string | null;
  readonly query: string;
}

const NONE: Filters = { topic: null, query: '' };

/** The `<style>` that hides what a linked query filters out until React has read the query */
const PREFILTER_ID = 'gallery-prefilter';

/**
 * The script that runs as the page's HTML is parsed, before the cards: it hides the cards and groups the
 * query filters out, so a link to a filtered gallery doesn't paint every card and then jump when React
 * filters them. It matches as `matches` does, on the cards' `data-*` attributes.
 * @param topics - The topics there are, so an unknown one filters nothing, as `readFilters` reads it
 */
function prefilterScript(topics: readonly GalleryTopic[]): string {
  return `(function(){try{
var p=new URLSearchParams(location.search),t=p.get('topic'),q=(p.get('q')||'').trim().toLowerCase(),s='[data-card]';
if(${JSON.stringify(topics.map((topic) => topic.id))}.indexOf(t)>=0)s+='[data-topic="'+CSS.escape(t)+'"]';
q.split(/\\s+/).forEach(function(w){if(w)s+='[data-text*="'+CSS.escape(w)+'"]'});
if(s==='[data-card]')return;
var e=document.createElement('style');e.id=${JSON.stringify(PREFILTER_ID)};
e.textContent='[data-gallery] [data-card]:not('+s+'){display:none}[data-gallery] [data-group]:not(:has('+s+')){display:none}';
document.head.appendChild(e);
}catch(e){}})()`;
}

/**
 * The filters a query string holds
 * @param search - `location.search`
 * @param topics - The topics there are
 */
function readFilters(search: string, topics: readonly GalleryTopic[]): Filters {
  const params = new URLSearchParams(search);
  const topic = params.get('topic');

  return {
    topic: topics.some((candidate) => candidate.id === topic) ? topic : null,
    query: params.get('q') ?? '',
  };
}

/**
 * The query string of some filters
 * @param filters - The filters
 */
function writeFilters(filters: Filters): string {
  const { topic, query } = filters;
  const params = new URLSearchParams();

  if (topic) params.set('topic', topic);
  if (query.trim()) params.set('q', query.trim());

  const search = params.toString();

  return search ? `?${search}` : '';
}

/**
 * The text a search matches an example on, lower-cased
 * @param example - The example
 * @param topicTitle - The title of its topic
 */
function searchText(example: GalleryExample, topicTitle: string): string {
  const { title, description, alt } = example;

  return `${title} ${description} ${alt} ${topicTitle}`.toLowerCase();
}

/**
 * Whether an example passes the filters
 * @param example - The example
 * @param filters - The filters, its query lower-cased
 * @param text - Its `searchText`
 */
function matches(example: GalleryExample, filters: Filters, text: string): boolean {
  if (filters.topic && example.topic !== filters.topic) return false;

  return filters.query
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

/**
 * One example's card: its picture, title and what it shows. Its `data-*` attributes are what the
 * prefilter script matches.
 * @param props - The example and its `searchText`
 */
function Card(props: { example: GalleryExample; text: string }): ReactNode {
  const { example, text } = props;

  return (
    <li className={styles.cardItem} data-card="" data-topic={example.topic} data-text={text}>
      <ExampleCard href={example.href} title={example.title} thumbnail={example.thumbnail}>
        <span className={styles.cardDescription}>{example.description}</span>
      </ExampleCard>
    </li>
  );
}

/**
 * The gallery of every example, by topic, filtered by text and topic from one row of controls that
 * stays in view as the cards scroll. With no examples yet, it says so and points at the guides.
 * @param props - Every example and topic, from the examples generator
 */
export default function Gallery(props: {
  examples: readonly GalleryExample[];
  topics: readonly GalleryTopic[];
}): ReactNode {
  const { examples, topics } = props;
  const location = useLocation();
  const [filters, setFilters] = useState<Filters>(NONE);
  const titles = useMemo(() => new Map(topics.map((topic) => [topic.id, topic.title])), [topics]);
  const texts = useMemo(
    () => new Map(examples.map((example) => [example.id, searchText(example, titles.get(example.topic) ?? '')])),
    [examples, titles],
  );

  const browser = useIsBrowser();
  const search = browser ? location.search : '';
  const [read, setRead] = useState('');

  if (search !== read) {
    setRead(search);
    setFilters(readFilters(search, topics));
  }

  // The render that read the query has filtered the cards itself, before this paint
  useLayoutEffect(() => {
    if (browser) document.getElementById(PREFILTER_ID)?.remove();
  }, [browser]);

  const update = (next: Partial<Filters>): void => {
    const merged = { ...filters, ...next };

    setFilters(merged);
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${writeFilters(merged)}${location.hash}`,
    );
  };

  const lowered = { ...filters, query: filters.query.trim().toLowerCase() };
  const shown = examples.filter((example) => matches(example, lowered, texts.get(example.id)!));
  const groups = topics
    .map((topic) => ({ topic, members: shown.filter((example) => example.topic === topic.id) }))
    .filter((group) => group.members.length);
  const filtered = filters.topic !== null || filters.query.trim() !== '';

  if (examples.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          No examples yet. Each one is a file in <code>examples/</code> that the visual tests draw; they show up here as
          they land.
        </p>
        <Link className="button button--secondary" to="/docs/getting-started/your-first-scene/">
          Start with your first scene
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.gallery} data-gallery="">
      {!browser && <script dangerouslySetInnerHTML={{ __html: prefilterScript(topics) }} />}
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">Search the examples</span>
          <SearchIcon />
          <input
            type="search"
            placeholder="Search examples"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
          />
        </label>
        <label className={styles.topic}>
          <span className="sr-only">Topic</span>
          <select value={filters.topic ?? ''} onChange={(event) => update({ topic: event.target.value || null })}>
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title} ({examples.filter((example) => example.topic === topic.id).length})
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className={styles.summary} aria-live="polite">
        {filtered
          ? `${shown.length} of ${examples.length} ${plural(examples.length)}`
          : `${examples.length} ${plural(examples.length)}`}
        {filtered && (
          <button type="button" className={styles.clear} onClick={() => update(NONE)}>
            Clear filters
          </button>
        )}
      </p>

      {groups.map(({ topic, members }) => (
        <section key={topic.id} className={styles.group} aria-labelledby={`topic-${topic.id}`} data-group="">
          <div className={styles.groupHeader}>
            <h2 id={`topic-${topic.id}`} className={styles.groupTitle}>
              {topic.title}
            </h2>
            {topic.guide && (
              <Link to={topic.guide} className={styles.groupLink}>
                Read the guide <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
          <ul className={styles.grid}>
            {members.map((example) => (
              <Card key={example.id} example={example} text={texts.get(example.id)!} />
            ))}
          </ul>
        </section>
      ))}

      {!groups.length && (
        <div className={styles.empty}>
          <p>No example matches those filters.</p>
          <button type="button" className="button button--secondary" onClick={() => update(NONE)}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
