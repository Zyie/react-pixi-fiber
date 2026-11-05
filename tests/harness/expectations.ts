import { expect } from 'vitest';

import type { RendererType, TestScene } from './scene-runner';

/**
 * Why a scene is skipped on a renderer, or `null` when it runs there
 * @param scene - The scene
 * @param renderer - The renderer about to run
 */
export function skipReason(scene: TestScene, renderer: RendererType): string | null {
  const { skip } = scene;

  if (!skip || (skip.renderers && !skip.renderers.includes(renderer))) return null;

  return skip.reason;
}

/**
 * The `fails` mark of a scene on a renderer, if it has one there
 * @param scene - The scene
 * @param renderer - The renderer about to run
 */
export function failsOn(scene: TestScene, renderer: RendererType): string | undefined {
  return typeof scene.fails === 'string' ? scene.fails : scene.fails?.[renderer];
}

/**
 * Runs a test that is marked as unable to pass yet: it has to fail, with a message that holds the mark
 * @param fails - The mark; a test without one just runs
 * @param body - The test
 */
export async function expectFailure(fails: string | undefined, body: () => Promise<void> | void): Promise<void> {
  if (fails === undefined) {
    await body();

    return;
  }

  let message: string | null = null;

  try {
    await body();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  expect(message, 'the test is marked `fails` and passed: delete the mark').not.toBe(null);
  expect(message, 'the test is marked `fails` and failed another way').toContain(fails);
}

/**
 * What ends the title of a test, so a report shows which tests are skipped or expected failures, and why
 * @param skip - Why the test is skipped, if it is
 * @param fails - The `fails` mark, if there is one
 */
export const titleNote = (skip: string | null, fails: string | undefined): string =>
  (skip === null ? '' : ` (skipped: ${skip})`) + (fails === undefined ? '' : ` (expected failure: ${fails})`);
