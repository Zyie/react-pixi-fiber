import { useEffect, useState } from 'react';

import type { RendererType } from '../../tests/harness/scene-runner';
import type { FrameMessage } from './scene-frame';
import type { PlaygroundEntry } from './scenes';

/** Where a capture is: loading, drawn, skipped on its renderer, or failed with a message */
export type Capture =
  | { status: 'loading' }
  | { status: 'done'; canvas: HTMLCanvasElement }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; message: string };

/**
 * The URL of the frame that builds an entry on a renderer
 * @param entry - The scene or example
 * @param renderer - The renderer
 * @param live - Whether to run an example as an app instead of capturing it as the tests do
 */
export const frameUrl = (entry: PlaygroundEntry, renderer: RendererType, live = false): string =>
  `/scene-frame.html?kind=${entry.kind}&id=${encodeURIComponent(entry.id)}&renderer=${renderer}${live ? '&live' : ''}`;

/**
 * The frames that are building a capture, one at a time: each loads pixi-3d and r3f from source, and
 * three frames at once run the browser out of requests
 */
let queue: Promise<void> = Promise.resolve();

/** How long a frame may take before the next one starts anyway */
const FRAME_TIMEOUT = 20000;

/**
 * Builds an entry on a renderer in a hidden frame of its own, as the tests build it, and returns the
 * picture it drew. Each frame is a page of its own, so a three.js frame and a pixi-3d frame never share
 * a module. Frames are built one after another.
 * @param entry - The scene or example, or null for none
 * @param renderer - The renderer to build it on
 */
export function useCapture(entry: PlaygroundEntry | null, renderer: RendererType): Capture {
  const url = entry ? frameUrl(entry, renderer) : null;
  const [result, setResult] = useState<{ url: string; capture: Capture } | null>(null);

  useEffect(() => {
    if (!url) return undefined;

    const iframe = document.createElement('iframe');
    const abort = new AbortController();
    let finished = (): void => {};
    const turn = new Promise<void>((resolve) => {
      finished = resolve;
      setTimeout(resolve, FRAME_TIMEOUT);
    });
    const onMessage = (event: MessageEvent<FrameMessage>): void => {
      if (event.source !== iframe.contentWindow) return;

      finished();

      if (event.data.type === 'scene-error') {
        setResult({ url, capture: { status: 'error', message: event.data.message } });

        return;
      }
      if (event.data.type === 'scene-skipped') {
        setResult({ url, capture: { status: 'skipped', reason: event.data.reason } });
        iframe.remove();

        return;
      }

      const { bitmap } = event.data;
      const canvas = document.createElement('canvas');

      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      bitmap.close();
      setResult({ url, capture: { status: 'done', canvas } });
      // The picture is copied; the frame's GPU context can go.
      iframe.remove();
    };

    iframe.className = 'capture-frame';
    iframe.src = url;
    window.addEventListener('message', onMessage);
    queue = queue.then(() => {
      if (abort.signal.aborted) return undefined;
      document.body.appendChild(iframe);

      return turn;
    });

    return () => {
      abort.abort();
      finished();
      window.removeEventListener('message', onMessage);
      iframe.remove();
    };
  }, [url]);

  return result?.url === url ? result.capture : { status: 'loading' };
}
