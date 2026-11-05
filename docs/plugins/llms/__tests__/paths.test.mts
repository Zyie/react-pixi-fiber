import assert from 'node:assert/strict';
import { test } from 'node:test';

import { markdownFile, markdownRoute } from '../paths.mts';

await test('the Markdown of a page is served beside its folder, and that of the root as index.md', () => {
  assert.equal(markdownRoute('/docs/guides/flow/'), '/docs/guides/flow.md');
  assert.equal(markdownRoute('/docs/'), '/docs.md');
  assert.equal(markdownRoute('/'), '/index.md');
});

await test('a generator writes the Markdown of a page under llms/, at the path of its MDX under content/', () => {
  assert.equal(markdownFile('content/docs/guides/flow.mdx'), 'llms/docs/guides/flow.md');
  assert.equal(markdownFile('content/api/index.mdx'), 'llms/api/index.md');
});
