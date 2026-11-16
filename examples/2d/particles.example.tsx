// #region result
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import { Texture } from 'pixi.js';
import type { ParticleContainer } from 'pixi.js';
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const PALETTE = [0xffd166, 0xef476f, 0x06d6a0, 0x118ab2, 0xffffff];

const STARS = Array.from({ length: 600 }, (_, i) => {
  const arm = i % 3;
  const distance = 10 + (i / 600) * 130;
  return {
    angle: arm * ((Math.PI * 2) / 3) + distance * 0.035 + Math.sin(i * 12.9898) * 0.35,
    distance,
    size: 2 + ((i * 7) % 5) * 0.6,
    tint: PALETTE[i % PALETTE.length],
  };
});

// #region galaxy
function Galaxy() {
  const container = useRef<ParticleContainer>(null);

  useFrame((state) => {
    const particles = container.current!.particleChildren;
    for (let i = 0; i < particles.length; i++) {
      const star = STARS[i];
      const angle = star.angle + state.elapsed * (40 / star.distance);
      particles[i].x = Math.cos(angle) * star.distance;
      particles[i].y = Math.sin(angle) * star.distance * 0.6;
    }
  });

  return (
    <particleContainer2D ref={container} x={200} y={150}>
      {STARS.map((star, i) => (
        <particle2D
          key={i}
          texture={Texture.WHITE}
          scaleX={star.size}
          scaleY={star.size}
          anchorX={0.5}
          anchorY={0.5}
          tint={star.tint}
        />
      ))}
    </particleContainer2D>
  );
}
// #endregion galaxy

export function App() {
  return (
    <Canvas>
      <Galaxy />
    </Canvas>
  );
}
// #endregion result

/** A spiral galaxy of 600 particles, each turning at its own speed in useFrame */
export const example: Example = {
  title: 'A galaxy of particles',
  frames: 30,
  render: () => <Galaxy />,
};
