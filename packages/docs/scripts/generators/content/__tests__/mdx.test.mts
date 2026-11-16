import assert from 'node:assert/strict';
import { test } from 'node:test';

import { writeMdx } from '../../markdown.mts';
import type { DocContext } from '../mdx.mts';
import { docNodes } from '../mdx.mts';

/**
 * How the guide `packages/threejs-compat/src/__docs__/your-first-scene.md` becomes its page
 * @param names - The names the page may link
 */
function firstScene(names: Record<string, string> = {}): DocContext {
  return {
    source: 'packages/threejs-compat/src/__docs__/your-first-scene.md',
    output: 'content/docs/threejs-compat/your-first-scene.mdx',
    names: new Map(Object.entries(names)),
  };
}

/**
 * A doc as the MDX of its page
 * @param markdown - The doc
 * @param context - Where it comes from and goes
 */
const toMdx = (markdown: string, context: DocContext = firstScene()): string => writeMdx(docNodes(markdown, context));

const fence = '```';

await test('a snippet followed by the picture of its example becomes one <Example>', () => {
  const markdown = [
    '<!-- snippet: examples/start/box.example.tsx#scene -->',
    '',
    `${fence}tsx`,
    '<mesh />',
    fence,
    '',
    '![A pink box](../../../../tests/snapshots/docs/start/box.webgl.png)',
    '',
    'After.',
  ].join('\n');

  assert.equal(
    toMdx(markdown),
    ['<Example file="examples/start/box.example.tsx" region="scene" alt="A pink box" />', '', 'After.'].join('\n'),
  );
});

await test("a snippet with no picture after it stays a code block, titled with its file's name and linking its example", () => {
  const markdown = [
    '<!-- snippet: examples/start/box.example.tsx#scene -->',
    '',
    `${fence}tsx`,
    '<mesh />',
    fence,
  ].join('\n');

  assert.equal(
    toMdx(markdown),
    [
      `${fence}tsx title="box.example.tsx"`,
      '<mesh />',
      fence,
      '',
      '<RunExample to="/examples/start/box/" file="box.example.tsx" />',
    ].join('\n'),
  );
});

await test("a link to another guide goes to its page, read as its title where its text is the guide's file name", () => {
  assert.equal(
    toMdx(
      'See [installation.md](../../../core/src/__docs__/installation.md) and [the events](events-and-interaction.md#the-event-object).',
    ),
    'See [Installation](/docs/getting-started/installation/) and [the events](/docs/threejs-compat/events-and-interaction/#the-event-object).',
  );
});

await test('a picture alone is the file in the repo, from the page in the site', () => {
  assert.equal(
    toMdx('![A cube](../../../../tests/snapshots/docs/3d/props.webgl.png)'),
    '![A cube](../../../../../tests/snapshots/docs/3d/props.webgl.png)',
  );
});

await test('a link to another file of the repo goes to GitHub', () => {
  assert.equal(
    toMdx('The [findings](../../../../docs/feasibility.md).'),
    'The [findings](https://github.com/pixijs/react-pixi-fiber/blob/main/docs/feasibility.md).',
  );
});

await test('a GitHub alert becomes an admonition', () => {
  assert.equal(toMdx('> [!NOTE]\n> The canvas fills its parent.'), ':::note\nThe canvas fills its parent.\n:::');
});

await test("the first mention of a public name in each section links its reference, a call's too", () => {
  const names = { useFrame: '/api/react-pixi-fiber/functions/useFrame/' };

  assert.equal(
    toMdx('Call `useFrame()`, then `useFrame` again.\n\n## Next\n\n`useFrame`', firstScene(names)),
    [
      'Call [`useFrame()`](/api/react-pixi-fiber/functions/useFrame/), then `useFrame` again.',
      '',
      '## Next',
      '',
      '[`useFrame`](/api/react-pixi-fiber/functions/useFrame/)',
    ].join('\n'),
  );
});
