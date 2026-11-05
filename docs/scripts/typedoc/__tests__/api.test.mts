import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { collectEntry, undocumented } from '../api.mts';
import type { ApiSymbol } from '../api.mts';
import { isVendored } from '../entries.mts';
import type { Entry } from '../entries.mts';

const fixture: Entry = { name: 'fixture', subpath: '.', file: 'index' };
const api = collectEntry(fixture, path.join(import.meta.dirname, 'fixtures/api'));

/**
 * A symbol of the fixture's API by name
 * @param name - Its name
 */
function symbol(name: string): ApiSymbol {
  const found = api.symbols.find((each) => each.name === name);

  assert.ok(found, `${name} is collected`);

  return found;
}

await test('the entry is src/index.tsx, followed through export * into vendored files and tsconfig paths', () => {
  assert.equal(symbol('Canvas').kind, 'function');
  assert.equal(symbol('useFrame').source, 'src/r3f/core/hooks.ts:1');
  assert.equal(symbol('RootState').kind, 'interface');
  assert.equal(symbol('RootState').typeOnly, true);
  assert.deepEqual(
    symbol('RootState').members.map(({ name }) => name),
    ['size', 'missing'],
  );
});

await test('a const whose type is a function, here or imported, is called like one', () => {
  assert.equal(symbol('useClock').calls, true);
  assert.deepEqual(symbol('useClock').callable, {
    parameters: [{ name: 'scale', type: 'number', optional: true }],
    returns: 'number',
  });
  assert.equal(symbol('advance').calls, true);
  assert.deepEqual(symbol('advance').callable?.parameters, [{ name: 'timestamp', type: 'number', optional: false }]);
  assert.equal(symbol('undocumentedValue').calls, false);
});

await test('a module exported as a namespace is a type, with its JSDoc and the types it exports as members', () => {
  assert.equal(symbol('Types').kind, 'type');
  assert.equal(symbol('Types').signature, 'namespace Types');
  assert.equal(symbol('Types').doc?.description, "The types of a namespace, as r3f's `ReactThreeFiber`");
  assert.deepEqual(
    symbol('Types').members.map(({ name, field }) => [name, field?.type]),
    [
      ['Position', '[x: number, y: number]'],
      ['State', 'RootState'],
    ],
  );
});

await test('a path into another package and a name starting with _ are not followed', () => {
  assert.ok(api.unresolved.includes('Scene'));
  assert.ok(!api.symbols.some(({ name }) => name === '_internal'));
});

await test("the docs check skips what vendored files declare and export, and nothing of the repo's own", () => {
  assert.deepEqual(undocumented(api), [
    'fixture: undocumentedValue',
    "fixture: Scene is exported but can't be followed to its declaration",
    'fixture: RootState.missing',
  ]);
});

await test('a file is vendored when a folder on its path is r3f, vendor or vendored', () => {
  assert.ok(isVendored('src/r3f/core/index.tsx'));
  assert.ok(isVendored('vendor/three.ts'));
  assert.ok(!isVendored('src/support/pixi3d.ts'));
  assert.ok(!isVendored('src/r3fCompat.ts'));
});
