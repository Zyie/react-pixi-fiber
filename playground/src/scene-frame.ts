import type { Example } from '../../examples/example';
import type { RendererType, TestScene } from '../../tests/harness/scene-runner';
import { findEntry } from './scenes';

/** What a frame posts to the playground */
export type FrameMessage = { type: 'scene-result'; bitmap: ImageBitmap } | { type: 'scene-error'; message: string };

const params = new URLSearchParams(location.search);
const entry = findEntry(params.get('kind'), params.get('id'));
const renderer = (params.get('renderer') ?? 'webgl') as RendererType;
const post = (message: FrameMessage, transfer: Transferable[] = []): void =>
  window.parent.postMessage(message, '*', transfer);

try {
  if (!entry) throw new Error(`No ${params.get('kind')} named ${params.get('id')}`);

  const module = (await entry.load()) as { scene?: TestScene; example?: Example };
  const scene: TestScene = (module.scene ?? module.example)!;

  if (params.has('live')) {
    // As an app runs it: a Canvas filling the window on r3f's default frameloop.
    const { runExample } = await import('../../examples/example');

    runExample(scene, renderer);
  } else {
    // As the tests build it: the same runner, the same clock, DOM events in place of Playwright's input.
    const { mountScene } = await import('../../tests/harness/scene-runner');
    const { canvas } = await mountScene(scene, renderer);

    // The wait gives the browser the time to put the frame on screen, which a WebGPU canvas needs.
    await new Promise((resolve) => setTimeout(resolve, scene.delay ?? 100));

    const bitmap = await createImageBitmap(canvas);

    post({ type: 'scene-result', bitmap }, [bitmap]);
  }
} catch (error) {
  post({ type: 'scene-error', message: error instanceof Error ? (error.stack ?? error.message) : String(error) });
}
