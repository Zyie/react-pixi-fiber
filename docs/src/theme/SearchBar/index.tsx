import { useActivePlugin, useActiveVersion } from '@docusaurus/plugin-content-docs/client';
import { useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import type { Autocomplete } from '@easyops-cn/autocomplete.js';
import LoadingRing from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/LoadingRing/LoadingRing';
import { EmptyTemplate } from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/EmptyTemplate';
import { SuggestionTemplate } from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/SuggestionTemplate';
import {
  fetchIndexesByWorker,
  searchByWorker,
} from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker';
import {
  getKeymapHints,
  matchesKeymap,
  parseKeymap,
} from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/keymap';
import { isMacPlatform } from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/platform';
import {
  Mark,
  searchBarShortcut,
  searchBarShortcutHint,
  searchBarShortcutKeymap,
} from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGenerated';
import { searchResultLimits } from '@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGeneratedConstants';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import styles from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/SearchBar.module.css';

/** The query parameter that names the words to mark on the page a result opens */
const HIGHLIGHT = '_highlight';

/** Below this width the box folds to its icon until it's focused */
const NARROW = '(max-width: 576px)';

/**
 * The navbar's search box: the box and dropdown of @easyops-cn/docusaurus-search-local, with its
 * styles, its result rows and its search worker, for the options this site sets. The index and the
 * dropdown load when a pointer or the focus first reaches the box. Building the dropdown moves the
 * input, which drops its focus, so the box takes the focus back, but only while the reader is still in
 * it: one who has tabbed or tapped elsewhere while the index loaded stays where they went.
 */
export default function SearchBar(): ReactNode {
  const browser = useIsBrowser();
  const { baseUrl } = useDocusaurusContext().siteConfig;
  const version = useActiveVersion(useActivePlugin()?.pluginId);
  /** The docs version searched: the archive from its own pages, else the latest */
  const versionUrl = version && !version.isLast ? `${version.path}/` : baseUrl;
  const history = useHistory();
  const location = useLocation();
  const input = useRef<HTMLInputElement>(null);
  const search = useRef<Autocomplete | null>(null);
  const indexed = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState(false);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  /** Puts the caret after the text of a box that has just unfolded, where a tap would leave it anywhere */
  const caretToEnd = (): void => {
    const element = input.current;

    if (element && window.matchMedia(NARROW).matches) {
      element.setSelectionRange(element.value.length, element.value.length);
    }
  };

  const loadIndex = useCallback(async () => {
    if (indexed.current === versionUrl) return;
    indexed.current = versionUrl;
    search.current?.autocomplete.destroy();
    setLoading(true);

    const [{ default: autocomplete }] = await Promise.all([
      import('@easyops-cn/autocomplete.js'),
      fetchIndexesByWorker(versionUrl, ''),
    ]);
    const element = input.current!;
    const inBox = document.activeElement === element;

    /**
     * The link under the results to all of them, on the search page
     * @param query - What was typed
     */
    const seeAll = (query: string): Element => {
      const params = new URLSearchParams({ q: query });
      const link = document.createElement('a');
      const footer = document.createElement('div');

      if (versionUrl !== baseUrl) params.set('version', versionUrl.slice(baseUrl.length));
      link.href = `${baseUrl}search/?${params}`;
      link.textContent = 'See all results';
      link.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        search.current?.autocomplete.close();
        history.push(`${baseUrl}search/?${params}`);
      });
      footer.className = clsx(styles.hitFooter, 'navbar__search-footer');
      footer.appendChild(link);

      return footer;
    };

    autocomplete.noConflict?.();
    search.current = autocomplete(
      element,
      {
        hint: false,
        autoselect: true,
        openOnFocus: true,
        cssClasses: {
          root: styles.searchBar,
          noPrefix: true,
          dropdownMenu: styles.dropdownMenu,
          input: styles.input,
          hint: styles.hint,
          suggestions: styles.suggestions,
          suggestion: styles.suggestion,
          cursor: styles.cursor,
          dataset: styles.dataset,
          empty: styles.empty,
        },
      },
      [
        {
          source: (query, callback) => {
            void searchByWorker(versionUrl, '', query, searchResultLimits).then(callback);
          },
          templates: {
            suggestion: SuggestionTemplate,
            empty: EmptyTemplate,
            footer: ({ query, isEmpty }) => (isEmpty ? undefined : seeAll(query)),
          },
        },
      ],
    )
      .on('autocomplete:selected', (_event, { document: { u, h }, tokens }) => {
        const marks = new URLSearchParams(tokens.map((token) => [HIGHLIGHT, token]));

        element.blur();
        history.push(`${u}${Mark && tokens.length ? `?${marks}` : ''}${h ?? ''}`);
      })
      .on('autocomplete:closed', () => element.blur());
    setLoading(false);
    if (!inBox) return;
    if (element.value) search.current.autocomplete.open();
    element.focus();
    caretToEnd();
  }, [versionUrl, baseUrl, history]);

  const enter = useCallback(() => {
    void loadIndex();
    setFocused(true);
    setTimeout(caretToEnd);
  }, [loadIndex]);

  // What the reader typed, or focused, before the page hydrated
  const adopt = useEffectEvent(() => {
    const element = input.current!;

    if (element.value) setValue(element.value);
    if (document.activeElement === element) enter();
  });

  useEffect(() => adopt(), []);

  // The words a result's link names, marked on the page it opened; after the page's code blocks have drawn
  useEffect(() => {
    if (!Mark) return undefined;

    const Marker = Mark;
    const words = browser ? new URLSearchParams(location.search).getAll(HIGHLIGHT) : [];
    const timer = setTimeout(() => {
      const article = document.querySelector('article');

      if (!article) return;

      const mark = new Marker(article);

      mark.unmark();
      if (words.length) mark.mark(words, { exclude: ['.theme-doc-toc-mobile > button'] });
      setValue(words.join(' '));
      search.current?.autocomplete.setVal(words.join(' '));
    });

    return () => clearTimeout(timer);
  }, [browser, location.search, location.pathname]);

  useEffect(() => {
    if (!searchBarShortcut || !searchBarShortcutKeymap) return undefined;

    const keymap = parseKeymap(searchBarShortcutKeymap);
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!matchesKeymap(event, keymap)) return;
      event.preventDefault();
      input.current?.focus();
      enter();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enter]);

  const clear = (): void => {
    const params = new URLSearchParams(location.search);

    if (params.has(HIGHLIGHT)) {
      params.delete(HIGHLIGHT);
      history.push({ ...location, search: params.toString() });
    }
    setValue('');
    search.current?.autocomplete.setVal('');
  };

  return (
    <div
      className={clsx(
        'navbar__search',
        styles.searchBarContainer,
        loading && typed && styles.searchIndexLoading,
        focused && styles.focused,
      )}
      dir="ltr"
    >
      <svg aria-hidden="true" className={styles.searchIcon} focusable="false" viewBox="0 0 16 16">
        <path
          fill="currentColor"
          d="M6.02945 10.20327a4.17382 4.17382 0 1 1 4.17382-4.17382 4.15609 4.15609 0 0 1-4.17382 4.17382Zm9.69195 4.2199-4.8225-4.82338A5.88021 5.88021 0 0 0 12.058 6.02856 6.00467 6.00467 0 1 0 9.59979 10.8989l4.82338 4.82338a.89729.89729 0 0 0 1.29912 0 .89749.89749 0 0 0-.00087-1.29909Z"
        />
      </svg>
      <input
        ref={input}
        placeholder="Search"
        aria-label="Search"
        className={clsx('navbar__search-input', styles.searchInput)}
        value={value}
        onMouseEnter={() => void loadIndex()}
        onFocus={enter}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          setValue(event.target.value);
          if (event.target.value) setTyped(true);
        }}
      />
      <LoadingRing className={styles.searchBarLoadingRing} />
      {searchBarShortcut &&
        searchBarShortcutHint &&
        (value ? (
          <button type="button" className={styles.searchClearButton} aria-label="Clear the search" onClick={clear}>
            ✕
          </button>
        ) : (
          browser && (
            <div className={clsx(styles.searchHintContainer, 'navbar__search-hints')}>
              {getKeymapHints(searchBarShortcutKeymap, isMacPlatform()).map((hint) => (
                <kbd key={hint} className={styles.searchHint}>
                  {hint}
                </kbd>
              ))}
            </div>
          )
        ))}
    </div>
  );
}
