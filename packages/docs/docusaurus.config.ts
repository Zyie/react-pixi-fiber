import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import type { PluginOptions as SearchOptions } from '@easyops-cn/docusaurus-search-local';

import { DISCORD, editUrl, PIXI3D_REPO, R3F_DOCS, REPO, SITE_URL } from './links/index.ts';
import { remarkExample } from './plugins/example/remark.mts';
import { llms } from './plugins/llms/index.mts';
import { installable } from './scripts/version.mts';
import { prismTheme } from './src/css/prism.ts';

/** What `static/img/ogimage.png`, the card shared links show, depicts */
const SOCIAL_CARD_ALT =
  "react-pixi-fiber: react-three-fiber's API, rendered by pixi-3d, beside a lit cube on a dark stage";

const config: Config = {
  title: 'react-pixi-fiber',
  tagline:
    "react-three-fiber's API, rendered by pixi-3d, with pixi.js 2D in the same tree. Swap the import, keep your scene.",
  favicon: 'img/favicon.png',
  url: SITE_URL,
  baseUrl: '/',
  trailingSlash: true,
  organizationName: 'pixijs',
  projectName: 'react-pixi-fiber',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },
  // Rspack's persistent cache saves no measurable time on a build of this size, and would be one folder
  // for every build that runs at once
  future: { v4: true, faster: { rspackPersistentCache: false } },
  customFields: { install: installable('npm install react-pixi-fiber react react-dom pixi.js @pixi/3d') },
  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: ({ versionDocsDirPath, docPath }) => editUrl(`docs/${versionDocsDirPath}/${docPath}`),
          remarkPlugins: [remarkExample],
        },
        pages: { remarkPlugins: [remarkExample] },
        blog: false,
        // The search page's robots tag is one the sitemap doesn't read, so it's left out by name, and
        // robots.txt disallows it
        sitemap: { ignorePatterns: ['/search/**'], changefreq: null, priority: null },
        theme: { customCss: ['./src/css/tokens.css', './src/css/custom.css', './src/css/docs-sidebar.css'] },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsDir: 'content',
        docsRouteBasePath: '/',
        indexBlog: false,
        // The stemmer stays: `removeDefaultStemmer` takes it out of the index only, and queries are still
        // stemmed, so "getting started" missed the pages that say it
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchBarShortcutHint: true,
        // Code ranks under headings and prose: without it every result was a fragment of a snippet.
        // An example's figure holds only its code, the "Run <file> live" link under a snippet
        // (`RunExample`, src/components/Docs) is no prose, and an example's page repeats its guide.
        ignoreCssSelectors: ['.theme-code-block', 'article figure', "article p[class^='run_']"],
        ignoreFiles: [/^examples\//],
      } satisfies SearchOptions,
    ],
  ],

  plugins: [llms],

  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'react-pixi-fiber',
        url: `${SITE_URL}/`,
      }),
    },
  ],

  themeConfig: {
    image: 'img/ogimage.png',
    metadata: [
      {
        name: 'keywords',
        content: 'react-three-fiber, r3f, pixi-3d, pixijs, react, 3d, webgl, webgpu, renderer',
      },
      { property: 'og:site_name', content: 'react-pixi-fiber' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image:alt', content: SOCIAL_CARD_ALT },
      { name: 'twitter:site', content: '@pixijs' },
      { name: 'twitter:image:alt', content: SOCIAL_CARD_ALT },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    docs: {
      sidebar: { hideable: true, autoCollapseCategories: true },
    },
    navbar: {
      title: 'react-pixi-fiber',
      logo: { alt: 'react-pixi-fiber', src: 'img/logo.svg', width: 32, height: 32 },
      hideOnScroll: false,
      items: [
        { type: 'docSidebar', sidebarId: 'docs', label: 'Docs', position: 'left' },
        { to: '/docs/2d/', label: '2D', position: 'left', activeBaseRegex: '^/docs/2d/' },
        { type: 'docSidebar', sidebarId: 'examples', label: 'Examples', position: 'left' },
        { type: 'docSidebar', sidebarId: 'api', label: 'API', position: 'left' },
        { type: 'search', position: 'right' },
        { href: REPO, position: 'right', className: 'navbar-icon navbar-icon--github', 'aria-label': 'GitHub' },
        { href: DISCORD, position: 'right', className: 'navbar-icon navbar-icon--discord', 'aria-label': 'Discord' },
      ],
    },
    footer: {
      style: 'dark',
      logo: { alt: 'react-pixi-fiber', src: 'img/logo.svg', href: '/', width: 40, height: 40 },
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'Docs', to: '/docs/' },
            { label: '2D', to: '/docs/2d/' },
            { label: 'Mixing 2D and 3D', to: '/docs/2d/mixing-2d-and-3d/' },
            { label: 'Examples', to: '/examples/' },
            { label: 'API', to: '/api/' },
            { label: 'Differences from r3f', to: '/docs/reference/differences/' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: REPO },
            { label: 'Discord', href: DISCORD },
          ],
        },
        {
          title: 'Built on',
          items: [
            { label: 'react-three-fiber', href: R3F_DOCS },
            { label: 'pixi-3d', href: PIXI3D_REPO },
            { label: 'PixiJS', href: 'https://pixijs.com' },
            { label: 'llms.txt', href: 'pathname:///llms.txt' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} PixiJS. MIT licensed.`,
    },
    prism: {
      theme: prismTheme,
      darkTheme: prismTheme,
      additionalLanguages: ['bash', 'diff', 'json'],
    },
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
  } satisfies Preset.ThemeConfig,
};

export default config;
