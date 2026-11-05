import { describe, expect, inject, test } from 'vitest';
import { server } from 'vitest/browser';

import type { FiberFamily } from '../../scripts/test/aliases.mts';
import { markForCapture } from './capture';
import { expectFailure, failsOn, skipReason, titleNote } from './expectations';
import { playwrightPointers } from './playwright-input';
import { DEFAULT_PARITY_MAX_DIFF, DEFAULT_PIXEL_MATCH } from './scene-constants';
import { mountScene, PIXI_RENDERERS } from './scene-runner';
import type { MountedScene, RendererType, TestScene } from './scene-runner';

export * from './capture';
export * from './expectations';
export * from './playwright-input';
export * from './scene-constants';
export * from './scene-input';
export * from './scene-runner';

declare module 'vitest' {
  export interface ProvidedContext {
    /** Which renderer family `react-pixi-fiber` resolves to in this vitest project */
    fiber: FiberFamily;
  }
}

/** The renderers the scenes of this vitest project run on: three.js in the `three` project, pixi-3d's otherwise */
export const projectRenderers = (): readonly RendererType[] =>
  inject('fiber') === 'three' ? ['three'] : PIXI_RENDERERS;

/**
 * The kind of context a canvas has. Asking for a WebGPU context of a canvas that has a WebGL one
 * returns null and changes nothing.
 * @param canvas - A canvas a renderer drew to
 */
const contextOf = (canvas: HTMLCanvasElement): 'webgpu' | 'webgl' => (canvas.getContext('webgpu') ? 'webgpu' : 'webgl');

/**
 * Builds a scene with real input for the length of a callback, and leaves the page as it found it,
 * pass or fail: the root is unmounted and the real mouse is put away. Test files share a page and
 * Playwright's mouse stays where the last scene left it, so without that a scene's picture would depend
 * on the scene that ran before it.
 * @param scene - The scene to build
 * @param renderer - The renderer to build it on
 * @param body - What to do with the built and driven scene
 */
export async function withScene(
  scene: TestScene,
  renderer: RendererType,
  body: (mounted: MountedScene) => Promise<void> | void,
): Promise<void> {
  let mounted: MountedScene | undefined;

  await server.commands.resetPointers();

  try {
    mounted = await mountScene(scene, renderer, playwrightPointers);
    expect(contextOf(mounted.canvas), 'the renderer the scene actually got').toBe(
      renderer === 'webgpu' ? 'webgpu' : 'webgl',
    );
    await body(mounted);
  } finally {
    mounted?.destroy();
    await server.commands.resetPointers();
  }
}

/**
 * Holds a rendered scene against its reference image, `tests/snapshots/<key>.<renderer>.png`, which a
 * run that may write references writes when it is missing. On a pixi-3d renderer it then measures the
 * picture against three.js's, `tests/snapshots/<key>.three.png`, and fails when the scene's
 * more pixels differ than the scene's `parity.maxDiff` allows, 2% unless it sets one.
 * @param canvas - The scene's canvas, as `mountScene` left it
 * @param key - The scene's key, such as `core/use-frame`
 * @param scene - The scene
 * @param renderer - The renderer it was built on
 */
async function checkSceneReferences(
  canvas: HTMLCanvasElement,
  key: string,
  scene: TestScene,
  renderer: RendererType,
): Promise<void> {
  const pixelMatch = scene.pixelMatch ?? DEFAULT_PIXEL_MATCH;
  const name = `${key}.${renderer}`;

  // The wait gives the browser the time to put the frame on screen, which a WebGPU canvas needs.
  await new Promise((resolve) => setTimeout(resolve, scene.delay ?? 10));

  const result = await server.commands.compareScreenshot(markForCapture(canvas), key, renderer, pixelMatch, {
    parity: scene.parity === false ? false : { maxDiff: DEFAULT_PARITY_MAX_DIFF, ...scene.parity },
  });

  if (!result.passed) {
    expect.fail(
      `${result.diff} pixels that differ from tests/snapshots/${name}.png; see .pr_uploads/visual/${name}.png. ` +
        `The scene's pixelMatch is ${pixelMatch}.`,
    );
  }

  const { parity } = result;

  if (parity && !parity.passed) {
    expect.fail(
      `${(parity.share * 100).toFixed(1)}% of drawn pixels differ from three.js (tests/snapshots/${key}.three.png), ` +
        `over the scene's parity.maxDiff of ${((parity.maxDiff ?? 0) * 100).toFixed(1)}%; see .temp/parity/${key}.png.`,
    );
  }
}

/**
 * Registers one test per renderer of this vitest project for a scene. Each builds the scene and drives
 * it when it has an `act`, as `withScene` describes, then holds it to its references, as
 * `checkSceneReferences` describes.
 *
 * Every `*.scene.tsx` and `*.example.tsx` has a generated wrapper that calls this once, so each scene is
 * its own test file and vitest runs them in parallel.
 * @param key - The scene's path under `tests/scenes` without `.scene.tsx`, such as `core/use-frame`, or
 * `docs/<topic>/<name>` for an example
 * @param scene - The scene the file exports
 */
export function defineSceneTests(key: string, scene: TestScene): void {
  describe('Visual Tests', () => {
    for (const renderer of projectRenderers()) {
      const skip = skipReason(scene, renderer);
      const fails = failsOn(scene, renderer);
      const run = skip === null ? test : test.skip;

      run(`${key} - ${renderer}${titleNote(skip, fails)}`, { timeout: 30000 }, () =>
        expectFailure(fails, () =>
          withScene(scene, renderer, ({ canvas }) => checkSceneReferences(canvas, key, scene, renderer)),
        ),
      );
    }
  });
}
