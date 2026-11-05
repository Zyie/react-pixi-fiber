import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toProgram } from '../program.mts';

const source = [
  '// #region scene',
  "import { useFrame } from 'react-pixi-fiber';",
  '// #endregion scene',
  "import theme from './theme.css?raw';",
  "import type { Example } from '../example';",
  "import { helper } from '../example';",
  '',
  '// #region scene',
  'function Box() {',
  '  return <mesh />;',
  '}',
  '// #endregion scene',
  '',
  '/**',
  ' * A pink box',
  ' * that turns.',
  ' * @see somewhere',
  ' */',
  "export const example: Example = { title: 'Box', render: () => <Box /> };",
].join('\n');

await test('the program is the file without region markers, with the lines of each region', () => {
  const program = toProgram(source, 'examples/start/box.example.tsx');

  assert.doesNotMatch(program.code, /#(end)?region/);
  assert.deepEqual(program.regions, {
    scene: [
      [1, 1],
      [6, 8],
    ],
  });
  assert.equal(program.code.split('\n')[5], 'function Box() {');
});

await test('a run needs the files it imports by value, not the harness or a type', () => {
  const program = toProgram(source, 'examples/start/box.example.tsx');

  assert.deepEqual(program.relativeImports, ['./theme.css?raw']);
  assert.deepEqual(program.packageImports, [{ from: 'react-pixi-fiber', names: ['useFrame'] }]);
});

await test("an example's title and description come from its object, else its JSDoc", () => {
  const program = toProgram(source, 'examples/start/box.example.tsx');

  assert.equal(program.title, 'Box');
  assert.equal(program.description, 'A pink box that turns.');
  assert.equal(toProgram('export const example = {};', 'a.example.ts').description, null);
});

await test("the reader is shown a file's regions, or, with none, the file less the harness", () => {
  assert.equal(
    toProgram(source, 'examples/start/box.example.tsx').shown,
    ["import { useFrame } from 'react-pixi-fiber';", '', 'function Box() {', '  return <mesh />;', '}', ''].join('\n'),
  );
  assert.equal(
    toProgram(
      [
        "import type { Example } from '../example';",
        "import { Canvas } from 'react-pixi-fiber';",
        '',
        'export const App = () => <Canvas />;',
        '',
        '/** An empty canvas */',
        'export const example: Example = { render: () => null };',
      ].join('\n'),
      'examples/start/empty.example.tsx',
    ).shown,
    ["import { Canvas } from 'react-pixi-fiber';", '', 'export const App = () => <Canvas />;', ''].join('\n'),
  );
});
