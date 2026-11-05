/**
 * The site's components as the generators write them: each a function that makes an element of the
 * component from its props, which TypeScript checks against the component's own, with the module a
 * page imports it from and the Markdown it reads as in the page's Markdown for language models. A
 * component with no Markdown of its own is a wrapper: its children stand in its place.
 */
import type { PhrasingContent } from 'mdast';

import type { ApiCodeProps } from '../../src/components/Api/ApiCode.tsx';
import type { ApiEntrySummary } from '../../src/components/Api/ApiEntries.tsx';
import type { ApiFieldProps } from '../../src/components/Api/ApiField.tsx';
import type { ApiMetaProps } from '../../src/components/Api/ApiMeta.tsx';
import type { ApiUsageProps } from '../../src/components/Api/ApiUsage.tsx';
import type { ExampleProps } from '../../src/components/Example/index.tsx';
import type { GalleryExample, GalleryTopic } from '../../src/components/Examples/types.ts';
import { ROOT } from '../paths.mts';
import { readRegion } from '../typedoc/snippets.mts';
import type { Flow } from './markdown.mts';
import { code, component, inlineCode, inlineComponent, link, paragraph, text } from './markdown.mts';

const DOCS = '@site/src/components/Docs';
const API = '@site/src/components/Api';
const EXAMPLES = '@site/src/components/Examples';

/** An example's picture and code, which run live; `src/theme/MDXComponents` gives it to every page */
export const Example = component<ExampleProps>('Example', {
  from: null,
  markdown: ({ file, region }) => [
    code(readRegion(file, region ?? null, ROOT), file.endsWith('.tsx') ? 'tsx' : 'ts', `title="${file}"`),
  ],
});

/** The paragraph that opens a page */
export const Lead = component<object>('Lead', { from: DOCS });

/** A list of links as a grid of cards */
export const Cards = component<{ label: string }>('Cards', { from: DOCS });

/** The link under a snippet of an example to the page that runs all of it */
export const RunExample = component<{ to: string; file: string }>('RunExample', { from: DOCS, markdown: () => [] });

/** How an item of r3f's surface carries over, as a coloured label: `Same`, `Adapted`, `Not supported` */
export const Status = inlineComponent<{ kind: string; label: string }>('Status', {
  from: DOCS,
  markdown: ({ label }) => [{ type: 'strong', children: [text(label)] }],
});

/** Tabs that remember the reader's choice across the site, by `groupId` */
export const Tabs = component<{ groupId: string; queryString?: string }>('Tabs', {
  from: '@theme/Tabs',
  isDefault: true,
});

/** One tab */
export const TabItem = component<{ value: string; label: string }>('TabItem', {
  from: '@theme/TabItem',
  isDefault: true,
  markdown: ({ label }, children) => [paragraph({ type: 'strong', children: [text(label)] }), ...children],
});

/** A signature, highlighted, with its names linked */
export const ApiCode = component<ApiCodeProps>('ApiCode', {
  from: API,
  markdown: (props) => [code(props.code, 'ts')],
});

/** The line under a name's title: its kind, its import and its source */
export const ApiMeta = component<ApiMetaProps>('ApiMeta', {
  from: API,
  markdown: ({ kind, importLine, source, sourceLabel }) => [
    code(importLine, 'ts'),
    paragraph(`${kind}, defined in `, link(source, sourceLabel), '.'),
  ],
});

/** A list of fields, under a title when it is a part of a member */
export const ApiFields = component<{ title?: string }>('ApiFields', { from: API });

/** A parameter, a property, a return value or an exception, with its description as children */
export const ApiField = component<Omit<ApiFieldProps, 'children'>>('ApiField', {
  from: API,
  markdown: ({ name, type, value }, children) => {
    const parts: PhrasingContent[] = [];

    if (name) parts.push({ type: 'strong', children: [inlineCode(name)] });
    if (name && type) parts.push(text(': '));
    if (type) parts.push(inlineCode(type));
    if (value) parts.push(text(`${parts.length > 0 ? ' ' : ''}= `), inlineCode(value));

    return [...(parts.length > 0 ? [paragraph(...parts)] : []), ...children];
  },
});

/** The mark of a name tagged `@advanced`, or of one r3f's vendored core declares */
export const ApiBadge = inlineComponent<object>('ApiBadge', {
  from: API,
  markdown: (_, children) => [{ type: 'emphasis', children: children as PhrasingContent[] }],
});

/** Where the guides and the examples use a name */
export const ApiUsage = component<ApiUsageProps>('ApiUsage', { from: API, markdown: () => [] });

/** The entries of the package, as cards */
export const ApiEntries = component<{ entries: readonly ApiEntrySummary[] }>('ApiEntries', {
  from: API,
  markdown: () => [],
});

/** The line under an example's title: its topic and its source */
export const ExampleHeader = component<{ topic: GalleryTopic; source: string }>('ExampleHeader', {
  from: EXAMPLES,
  markdown: () => [],
});

/** Where an example's guide explains it */
export const GuideSections = component<{
  topic: GalleryTopic;
  sections: readonly { title: string; href: string }[];
}>('GuideSections', {
  from: EXAMPLES,
  markdown: ({ sections }): Flow[] =>
    sections.length > 0
      ? [
          paragraph(
            'Explained in the guide: ',
            ...sections.flatMap((section, index) => [
              ...(index > 0 ? [text(', ')] : []),
              link(section.href, section.title),
            ]),
            '.',
          ),
        ]
      : [],
});

/** The gallery of every example, with its filters */
export const Gallery = component<{ examples: readonly GalleryExample[]; topics: readonly GalleryTopic[] }>('Gallery', {
  from: EXAMPLES,
  markdown: () => [],
});
