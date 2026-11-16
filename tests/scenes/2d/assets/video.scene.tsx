import { useAsset } from '@react-fiber/2d';
import type { TestScene } from '@test-scene';
import { Assets } from 'pixi.js';
import type { Texture, VideoSource } from 'pixi.js';

Assets.add([
  { alias: 'steps-first', src: '/video/steps.webm?first', data: { autoPlay: false, muted: true } },
  { alias: 'steps-seeked', src: '/video/steps.webm?seeked', data: { autoPlay: false, muted: true } },
]);

function Videos() {
  const [first, seeked] = useAsset<Texture>(['steps-first', 'steps-seeked']);

  return (
    <>
      <sprite2D texture={first} x={40} y={80} width={140} height={140} />
      <sprite2D texture={seeked} x={220} y={80} width={140} height={140} />
    </>
  );
}

/**
 * Video textures through `useAsset`, which suspends until pixi's `Assets` has loaded them. Each alias
 * is added with `Assets.add` so its data can stop it playing on its own. Left: the video's first frame,
 * red with a white bar at the top. Right: the same video, which `act` seeks to its third frame, blue
 * with the bar below the middle, then uploads with `source.update()`.
 */
export const scene: TestScene = {
  render: () => <Videos />,
  act: async ({ frames }) => {
    const source = Assets.get<Texture>('steps-seeked').source as VideoSource;
    const video = source.resource;
    await new Promise((resolve) => {
      video.addEventListener('seeked', resolve, { once: true });
      video.currentTime = 0.6;
    });
    source.update();
    await frames();
  },
};
