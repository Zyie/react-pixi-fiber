/**
 * The examples generator on a root of its own (`DOCS_ROOT`): with no examples, and with some, as the
 * visual harness writes them, one with a reference picture and one without, one a guide shows.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { PNG } from 'pngjs';

import type { GalleryExample } from '../../../../src/components/Examples/types.ts';

/** What the generator wrote: each file's path, and the text of the JSON and MDX among them */
type Generated = Record<string, string | null>;

const SYNC = new URL('../../../sync.mts', import.meta.url).pathname;

/**
 * Runs the examples generator with a root
 * @param root - The root, with its `examples/`, `tests/snapshots/docs` and `src/**\/__docs__`
 */
function generate(root: string): Generated {
  const script = `
    const { examples } = await import(${JSON.stringify(path.join(path.dirname(SYNC), 'generators/examples.mts'))});
    const { sharedValues } = await import(${JSON.stringify(SYNC)});
    const files = await examples.generate(sharedValues());
    const out = Object.fromEntries(Object.entries(files).map(([file, data]) => [file, typeof data === 'string' ? data : null]));
    process.stdout.write(JSON.stringify(out));
  `;

  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, DOCS_ROOT: root },
      encoding: 'utf8',
    }),
  ) as Generated;
}

/**
 * A root with files
 * @param files - Each file's text or bytes, by its path from the root
 */
function rootWith(files: Record<string, string | Uint8Array>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'examples-'));

  for (const [file, data] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), data);
  }

  return root;
}

/** A 40 by 30 picture: a stage with a square in the middle */
function picture(): Uint8Array {
  const png = new PNG({ width: 40, height: 30 });

  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 40; x++) {
      const i = (y * 40 + x) * 4;
      const inside = x >= 15 && x < 25 && y >= 10 && y < 20;

      png.data.set(inside ? [255, 105, 180, 255] : [16, 16, 16, 255], i);
    }
  }

  return PNG.sync.write(png);
}

const box = `
// #region scene
import { useFrame } from 'react-pixi-fiber';
// #endregion scene

import type { Example } from '../example';

/** A pink box that turns. */
export const example: Example = { render: () => <mesh /> };
`;

const colors = `
export const example = { title: 'Three colours', description: 'Three boxes in a row.', render: () => null };
`;

await test('with no examples, the gallery is the only page and the catalogue is empty', () => {
  const root = rootWith({ 'src/index.ts': 'export {};\n' });
  const files = generate(root);

  assert.deepEqual(Object.keys(files).sort(), [
    'content/examples/index.mdx',
    'llms/examples/index.md',
    'static/example-sources/index.json',
  ]);
  assert.deepEqual(JSON.parse(files['static/example-sources/index.json']!), { topics: [], examples: [] });
  assert.match(files['content/examples/index.mdx']!, /<Gallery examples=\{\[]} topics=\{\[]} \/>/);
  fs.rmSync(root, { recursive: true });
});

await test("each example gets a page titled by its object, its guide's section, or its name, and its picture when there is one", () => {
  const root = rootWith({
    'src/__docs__/your-first-scene.md': [
      '# Your first scene',
      '',
      '## A turning box',
      '',
      'The box turns every frame:',
      '',
      '<!-- snippet: examples/your-first-scene/box.example.tsx#scene -->',
      '',
      '```tsx',
      "import { useFrame } from 'react-pixi-fiber';",
      '```',
      '',
      '![A pink square](../../tests/snapshots/docs/your-first-scene/box.webgl.png)',
      '',
      '## The result',
      '',
      '<!-- snippet: examples/your-first-scene/titled.example.tsx -->',
      '',
      '```tsx',
      "export const example = { title: 'A titled box', render: () => null };",
      '```',
    ].join('\n'),
    'examples/your-first-scene/box.example.tsx': box,
    'examples/your-first-scene/titled.example.tsx':
      "export const example = { title: 'A titled box', render: () => null };\n",
    'examples/materials/colors.example.tsx': colors,
    'examples/materials/plain-cube.example.tsx': 'export const example = { render: () => null };\n',
    'tests/snapshots/docs/your-first-scene/box.webgl.png': picture(),
  });
  const files = generate(root);
  const gallery = files['content/examples/index.mdx']!;
  const cards = JSON.parse(/<Gallery examples=\{(.*?)} topics=/.exec(gallery)![1]!) as GalleryExample[];

  assert.deepEqual(
    cards.map(({ id, title, topic, thumbnail }) => [id, title, topic, thumbnail?.src ?? null]),
    [
      ['your-first-scene/box', 'A turning box', 'your-first-scene', '/example-thumbs/your-first-scene/box.webp'],
      ['your-first-scene/titled', 'A titled box', 'your-first-scene', null],
      ['materials/colors', 'Three colours', 'materials', null],
      ['materials/plain-cube', 'Plain cube', 'materials', null],
    ],
  );
  assert.equal(cards[0]!.description, 'The box turns every frame.');
  assert.equal(cards[0]!.alt, 'A pink square');
  assert.equal(cards[2]!.description, 'Three boxes in a row.');
  assert.match(files['content/examples/materials/_category_.json']!, /"label": "Materials"/);
  assert.ok('static/example-pictures/your-first-scene/box.png' in files);
  assert.match(
    files['content/examples/your-first-scene/box.mdx']!,
    /<Example file="examples\/your-first-scene\/box.example.tsx" title="box.example.tsx" alt="A pink square" \/>/,
  );
  fs.rmSync(root, { recursive: true });
});
