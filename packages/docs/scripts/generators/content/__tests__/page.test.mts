import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Cards, Status, TabItem, Tabs } from '../../components.mts';
import type { Page } from '../../markdown.mts';
import { code, heading, link, list, paragraph, writePage } from '../../markdown.mts';

/**
 * The MDX and the Markdown of a page with some content
 * @param children - The content
 */
function written(children: Page['children']): { mdx: string; markdown: string } {
  const files = writePage({
    output: 'content/docs/reference/differences.mdx',
    route: '/docs/reference/differences/',
    fields: { title: 'Differences', description: 'What differs.', custom_edit_url: null },
    children,
  });

  return {
    mdx: String(files['content/docs/reference/differences.mdx']),
    markdown: String(files['llms/docs/reference/differences.md']),
  };
}

await test('a page is its front matter, the imports of the components in it, its content and the link to its Markdown', () => {
  const { mdx } = written([
    heading(1, 'Differences'),
    Cards({ label: 'More' }, [list([[paragraph(link('/api/', 'API'), ' Every export.')]])]),
    paragraph(Status({ kind: 'as-is', label: 'Same' }), ' as r3f, {braces} <and> all'),
  ]);

  assert.equal(
    mdx,
    [
      '---',
      'title: "Differences"',
      'description: "What differs."',
      'custom_edit_url: null',
      '---',
      '',
      "import { Cards, Status } from '@site/src/components/Docs';",
      '',
      '# Differences',
      '',
      '<Cards label="More">',
      '  - [API](/api/) Every export.',
      '</Cards>',
      '',
      '<Status kind="as-is" label="Same" /> as r3f, \\{braces} \\<and> all',
      '',
      '<head>',
      '  <link rel="alternate" type="text/markdown" href="/docs/reference/differences.md" />',
      '</head>',
      '',
    ].join('\n'),
  );
});

await test("a page's Markdown names its URL, reads each component as what it shows and makes every link absolute", () => {
  const { markdown } = written([
    heading(1, 'Differences'),
    paragraph(Status({ kind: 'adapter', label: 'Adapted' }), ' through ', link('/api/', 'the API'), '.'),
    Tabs({ groupId: 'package-manager' }, [TabItem({ value: 'npm', label: 'npm' }, [code('npm install x', 'sh')])]),
  ]);

  assert.equal(
    markdown,
    [
      '# Differences',
      '',
      'Source: https://react-pixi-fiber.pixijs.io/docs/reference/differences/',
      '',
      '**Adapted** through [the API](https://react-pixi-fiber.pixijs.io/api/).',
      '',
      '**npm**',
      '',
      '```sh',
      'npm install x',
      '```',
      '',
    ].join('\n'),
  );
});
