import { describe, expect, test } from 'vitest';
import { server } from 'vitest/browser';

import { markForCapture } from '../capture';
import { failsOn, skipReason } from '../expectations';
import { DEFAULT_PIXEL_MATCH } from '../scene-constants';
import { syntheticPointers } from '../scene-input';
import { mountScene, PIXI_RENDERERS } from '../scene-runner';
import type { TestScene } from '../scene-runner';

const scenes = import.meta.glob<{ scene: TestScene }>('../../scenes/**/*.scene.tsx', { eager: true });

// The playground drives a scene's `act` with DOM events dispatched on the canvas, the tests with
// Playwright's real mouse. Each scene with an `act` has to draw its reference both ways, or the
// playground shows something the tests never checked.
describe("the playground's synthetic input", () => {
  for (const [file, { scene }] of Object.entries(scenes)) {
    if (!scene.act) continue;

    const key = file.slice('../../scenes/'.length).replace(/\.scene\.tsx$/, '');

    for (const renderer of PIXI_RENDERERS) {
      const skip = skipReason(scene, renderer) !== null || failsOn(scene, renderer) !== undefined;

      test.skipIf(skip)(`draws the reference of ${key} on ${renderer}`, async () => {
        const { canvas, destroy } = await mountScene(scene, renderer, syntheticPointers);

        try {
          await new Promise((resolve) => setTimeout(resolve, scene.delay ?? 10));

          const pixelMatch = scene.pixelMatch ?? DEFAULT_PIXEL_MATCH;
          const { diff } = await server.commands.compareScreenshot(markForCapture(canvas), key, renderer, pixelMatch, {
            parity: false,
            synthetic: true,
          });

          expect(
            diff,
            `pixels that differ; see .pr_uploads/visual/synthetic/${key}.${renderer}.png`,
          ).toBeLessThanOrEqual(pixelMatch);
        } finally {
          destroy();
        }
      });
    }
  }
});
