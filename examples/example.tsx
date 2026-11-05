import { createRoot } from 'react-dom/client';
import { Canvas } from 'react-pixi-fiber';
import type { CanvasProps } from 'react-pixi-fiber';

import type { TestScene } from '../tests/harness/scene-runner';

/**
 * What every `*.example.tsx` exports as `example`: the code a guide shows, in the shape of a visual
 * scene, so tests/docs renders it as one (keyed `docs/<topic>/<name>`) and the playground and the docs
 * run it live through `runExample`. `render` returns the children of an r3f `<Canvas>`; `camera` is the
 * Canvas's `camera` prop. The canvas is 400 by 300 in the tests.
 */
export type Example = Pick<
  TestScene,
  'render' | 'camera' | 'frames' | 'act' | 'parity' | 'pixelMatch' | 'skip' | 'fails'
>;

/**
 * Runs an example live, as an app would: a `<Canvas>` that fills its host, on r3f's default frameloop
 * @param example - The example to run
 * @param host - The element the Canvas fills; the page's body when omitted
 * @param props - More props for the Canvas, such as the renderer to use
 * @returns A function that unmounts it
 */
export function runExample(
  example: Example,
  host: HTMLElement = document.body,
  props: Partial<CanvasProps> = {},
): () => void {
  const root = createRoot(host);

  root.render(
    <Canvas camera={example.camera} {...props}>
      {example.render()}
    </Canvas>,
  );

  return () => root.unmount();
}
