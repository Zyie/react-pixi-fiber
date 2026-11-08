import type { TestScene } from '@test-scene';
import type { AnimatedSprite, Spritesheet } from 'pixi.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAsset } from 'react-pixi-fiber';

function Lamp({ x, on }: { x: number; on: boolean }) {
  return <graphics2D x={x} y={250} draw={(graphics) => graphics.circle(0, 0, 12).fill(on ? 0x3cb44b : 0xe6194b)} />;
}

/** A sprite that calls `play()` itself once mounted, as pixi code does, and `stop()` when asked */
function Imperative({ stopped }: { stopped: boolean }) {
  const sheet = useAsset<Spritesheet>('/sprites/walk.json');
  const sprite = useRef<AnimatedSprite>(null);

  useEffect(() => {
    if (stopped) sprite.current!.stop();
    else sprite.current!.play();
  }, [stopped]);

  return <animatedSprite2D ref={sprite} args={[sheet.animations.walk]} animationSpeed={0.3} x={300} y={40} scale={2} />;
}

function Playback({ stopped }: { stopped: boolean }) {
  const sheet = useAsset<Spritesheet>('/sprites/walk.json');
  const [completed, setCompleted] = useState(0);
  const [loops, setLoops] = useState(0);
  const autoPlaying = useMemo(
    () => ({ textures: sheet.animations.walk, autoPlay: true, animationSpeed: 0.5 }),
    [sheet],
  );

  return (
    <>
      <animatedSprite2D args={[sheet.animations.walk]} playing animationSpeed={1 / 6} x={20} y={40} scale={2} />
      <animatedSprite2D args={[sheet.animations.walk]} playing={false} x={20} y={140} scale={2} />
      <animatedSprite2D
        args={[sheet.animations.walk]}
        playing
        loop={false}
        animationSpeed={0.5}
        onComplete={() => setCompleted((count) => count + 1)}
        x={110}
        y={40}
        scale={2}
      />
      <animatedSprite2D args={[autoPlaying]} onLoop={() => setLoops((count) => count + 1)} x={110} y={140} scale={2} />
      <animatedSprite2D
        args={[sheet.animations.walk]}
        playing={!stopped}
        animationSpeed={0.3}
        x={200}
        y={40}
        scale={2}
      />
      <Imperative stopped={stopped} />
      <Lamp x={130} on={completed === 1} />
      <Lamp x={180} on={loops === 2} />
    </>
  );
}

/**
 * Animated sprites play on the root's clock: thirteen frames give twelve sixtieths of a second, then
 * `act` stops two of them and seven more frames run. Each sprite is the walk sheet at twice its size,
 * whose white bar steps down a quarter each frame.
 *
 * - Top left, `playing` at `animationSpeed` 1/6: 19 ticks make 3.2 frames, so the bar is at the bottom.
 * - Below it, `playing={false}`: still on its first frame, bar at the top.
 * - Top middle, `loop={false}` at 0.5: it ran past its last frame, stopped there (bar at the bottom) and
 *   called `onComplete` once, so the left lamp is green.
 * - Below it, `autoPlay` in memoized `args` at 0.5: 9.5 frames in, it wrapped twice (`onLoop`, right
 *   lamp green) and shows its second frame.
 * - Top right pair at 0.3: `playing` turned off by a prop after 12 ticks, and `stop()` called by an
 *   effect a tick later, both held on their last frame, bar at the bottom.
 */
export const scene: TestScene = {
  frames: 13,
  render: () => <Playback stopped={false} />,
  act: async ({ update, frames }) => {
    await update(<Playback stopped />);
    await frames(6);
  },
};
