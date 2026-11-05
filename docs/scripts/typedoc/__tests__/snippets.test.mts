import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { readRegion, syncSnippets } from '../snippets.mts';

const root = path.join(import.meta.dirname, 'fixtures');

await test('a region joins every segment of its name, dedented, without nested markers', () => {
  assert.equal(
    readRegion('regions.ts', 'shown', root),
    "import path from 'node:path';\n\nconst name = path.join('a', 'b');\n\nreturn name;",
  );
  assert.equal(readRegion('regions.ts', 'inner', root), 'return name;');
});

await test('a file with no region is the whole file without markers', () => {
  assert.doesNotMatch(readRegion('regions.ts', null, root), /#(end)?region/);
});

await test('a marked block is set to its source, and the rest of the doc is kept', () => {
  const doc = ['# Title', '', '<!-- snippet: regions.ts#inner -->', '```ts', 'stale', '```', '', 'Prose.'].join('\n');
  const { text, problems } = syncSnippets(doc, 'doc.md', root);

  assert.deepEqual(problems, []);
  assert.equal(text, doc.replace('stale', 'return name;'));
});

await test("a block with no marker is the guide's own; a marker without a block and a missing region are problems", () => {
  const doc = [
    '```tsx',
    '<mesh />',
    '```',
    '<!-- snippet: regions.ts -->',
    'text',
    '<!-- snippet: regions.ts#none -->',
    '```ts',
    '```',
  ];
  const { problems } = syncSnippets(doc.join('\n'), 'doc.md', root);

  assert.deepEqual(
    problems.map(({ line, message }) => `${line} ${message}`),
    ['4 snippet marker with no code block after it', '6 regions.ts has no region none'],
  );
});
