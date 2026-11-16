import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { ROOT } from '../../../paths.mts';
import { classesOf, FEASIBILITY, qualifiersOf, readParity } from '../parity.mts';

await test('a cell of the Class column names its classes in the order it writes them', () => {
  assert.deepEqual(classesOf('adapter (vendor) ✓; r3f-core-change to upstream'), ['adapter', 'r3f-core-change']);
  assert.deepEqual(classesOf('as-is at runtime; r3f-core-change for types'), ['as-is', 'r3f-core-change']);
  assert.deepEqual(classesOf('not-feasible'), ['not-feasible']);
  assert.deepEqual(classesOf('unknown'), []);
});

await test('a cell of the Class column qualifies each class with what it writes after it', () => {
  assert.deepEqual(qualifiersOf('adapter ✓ but tube/extrude/shape'), ['but tube/extrude/shape']);
  assert.deepEqual(qualifiersOf('adapter ✓; pixi3d-change for per-slot bits'), ['', 'for per-slot bits']);
  assert.deepEqual(qualifiersOf('adapter (flipY ✓); pixi3d-change (colorSpace)'), ['(flipY)', '(colorSpace)']);
  assert.deepEqual(qualifiersOf('as-is ✓'), ['']);
});

await test('the findings give the levels, every group of the matrix with a class per row, and the major blockers', () => {
  const parity = readParity(ROOT);

  assert.equal(parity.levels.children.length, 4);
  assert.ok(parity.groups.length >= 5);
  for (const group of parity.groups) {
    assert.ok(group.rows.length > 0, `${group.title} has rows`);
    for (const row of group.rows) assert.ok(row.classes.length > 0);
  }
  assert.ok(parity.blockers.some(({ id }) => id === 'B1'));
});

await test('findings without a column the page reads fail with what is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
  const table = '| Level | Achievable |\n| --- | --- |\n| L1 | High |';

  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(
    path.join(root, FEASIBILITY),
    `## 1. Verdict\n\n${table}\n\n## 4. Parity matrix\n\n### Seam\n\n| Item | Effort |\n| --- | --- |\n| A | S |\n`,
  );
  assert.throws(() => readParity(root), /"Seam" has no Class, Level, Notes column/);
  fs.rmSync(root, { recursive: true });
});
