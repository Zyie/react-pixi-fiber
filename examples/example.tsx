import { Canvas } from '@react-fiber/threejs-compat';
import { createRoot } from 'react-dom/client';
import '@react-fiber/2d';

import { canvasProps } from '../tests/harness/scene-runner';
import type { RendererType, TestScene } from '../tests/harness/scene-runner';

/**
 * What every `*.example.tsx` exports as `example`: the code a guide shows, in the shape of a visual
 * scene, so tests/docs renders it as one (keyed `docs/<topic>/<name>`) and the playground and the docs
 * run it live through `runExample`. `render` returns the children of an r3f `<Canvas>`; `camera` is the
 * Canvas's `camera` prop and `canvas` more of its props. The canvas is 400 by 300 in the tests.
 * `title` and `description` name and describe it in the docs' gallery, as string literals the docs read.
 */
export type Example = Pick<
  TestScene,
  'render' | 'camera' | 'canvas' | 'frames' | 'act' | 'parity' | 'pixelMatch' | 'skip' | 'fails'
> & {
  /** Its title in the docs, ahead of the heading of the guide section that shows it */
  title?: string;
  /** What it shows, when no guide's prose brings it in */
  description?: string;
};

/**
 * Runs an example live, as an app would: a `<Canvas>` that fills its host, on r3f's default frameloop
 * @param example - The example to run
 * @param renderer - The renderer to run it on; `three` needs `react-pixi-fiber` resolved to r3f's own entry
 * @param host - The element the Canvas fills; the page's body when omitted
 * @returns A function that unmounts it
 */
export function runExample(example: Example, renderer: RendererType, host: HTMLElement = document.body): () => void {
  const root = createRoot(host);

  root.render(
    <Canvas camera={example.camera} {...canvasProps(renderer, example.canvas)}>
      {example.render()}
    </Canvas>,
  );

  return () => root.unmount();
}
