import assert from 'node:assert/strict';
import { test } from 'node:test';

import { statusAfter } from '../status.ts';

const error = { name: 'Error', message: 'boom' };
const running = { state: 'running', renderer: 'webgl' } as const;

await test('a run that threw stays an error when its frame then draws or finishes', () => {
  const failed = statusAfter(null, { type: 'error', error });

  assert.deepEqual(failed, { state: 'error', error });
  assert.equal(statusAfter(failed, { type: 'rendered', renderer: 'webgl' }), null);
  assert.equal(statusAfter(failed, { type: 'evaluated' }), null);
});

await test('an error takes over from a run that drew or ran, and a later error from an earlier one', () => {
  const later = { name: 'TypeError', message: 'later' };

  assert.deepEqual(statusAfter(running, { type: 'error', error }), { state: 'error', error });
  assert.deepEqual(statusAfter({ state: 'ran' }, { type: 'error', error }), { state: 'error', error });
  assert.deepEqual(statusAfter({ state: 'error', error }, { type: 'error', error: later }), {
    state: 'error',
    error: later,
  });
});

await test('a run is running once it draws, and ran when it finishes without drawing', () => {
  assert.deepEqual(statusAfter(null, { type: 'rendered', renderer: 'webgl' }), running);
  assert.deepEqual(statusAfter({ state: 'ran' }, { type: 'rendered', renderer: 'webgl' }), running);
  assert.deepEqual(statusAfter(null, { type: 'evaluated' }), { state: 'ran' });
  assert.equal(statusAfter(running, { type: 'evaluated' }), null);
});
