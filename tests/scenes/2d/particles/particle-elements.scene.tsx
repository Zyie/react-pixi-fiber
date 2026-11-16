import { useFrame } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import type { ParticleContainer } from 'pixi.js';
import { useRef } from 'react';

const COLORS = [0xe6194b, 0x3cb44b, 0xffe119, 0x4363d8, 0xf58231, 0x911eb4, 0x46f0f0, 0xf032e6];

/** Colours change through React, so the container uploads them every frame */
const DYNAMIC_COLOR = { dynamicProperties: { color: true } };

/** A row of particles made from props alone, keyed by colour, whose tints the act changes */
function Row({ keys, tinted }: { keys: number[]; tinted: boolean }) {
  return (
    <particleContainer2D args={[DYNAMIC_COLOR]} x={30} y={40}>
      {keys.map((color, i) => (
        <particle2D
          key={color}
          texture={Texture.WHITE}
          x={i * 45}
          scaleX={30}
          scaleY={30}
          tint={tinted && i % 2 === 0 ? 0xffffff : color}
        />
      ))}
    </particleContainer2D>
  );
}

/** A ring of particles that `useFrame` turns through the container's `particleChildren` */
function Ring() {
  const container = useRef<ParticleContainer>(null);
  const angle = useRef(0);

  useFrame((_, delta) => {
    angle.current += delta;
    const particles = container.current!.particleChildren;
    for (let i = 0; i < particles.length; i++) {
      const a = angle.current + (i / particles.length) * Math.PI * 2;
      particles[i].x = Math.cos(a) * 70;
      particles[i].y = Math.sin(a) * 70;
    }
  });

  return (
    <particleContainer2D ref={container} x={200} y={190}>
      {COLORS.map((tint) => (
        <particle2D
          key={tint}
          texture={Texture.WHITE}
          scaleX={14}
          scaleY={14}
          anchorX={0.5}
          anchorY={0.5}
          tint={tint}
        />
      ))}
    </particleContainer2D>
  );
}

/**
 * Particles as elements: `<particle2D>` children of `<particleContainer2D>`, built from props. The top
 * row starts as eight coloured squares; `act` removes the yellow and purple ones, moves the cyan one to
 * the front, and turns every other square white, which shows because the container's
 * `dynamicProperties` make colour dynamic. Below, a ring of eight squares that `useFrame` has turned
 * by a third of a radian through `particleChildren`, after twenty frames.
 */
export const scene: TestScene = {
  frames: 20,
  render: () => (
    <>
      <Row keys={COLORS} tinted={false} />
      <Ring />
    </>
  ),
  act: async ({ update }) => {
    await update(
      <>
        <Row keys={[0x46f0f0, 0xe6194b, 0x3cb44b, 0x4363d8, 0xf58231, 0xf032e6]} tinted />
        <Ring />
      </>,
    );
  },
};
