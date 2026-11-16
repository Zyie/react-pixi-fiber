import type { ParticleContainer3D } from '@pixi/3d';
import { useThree } from '@react-fiber/core';
import type { RootCamera, RootState } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';

const TRIANGLE = {
  positions: new Float32Array([0, 0.9, 0, -0.9, -0.7, 0, 0.9, -0.7, 0]),
  normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
};

/** Twelve particles in a ring, written into the container's slots once */
function Ring() {
  const particles = useRef<ParticleContainer3D>(null);

  useLayoutEffect(() => {
    const container = particles.current!;
    for (let i = 0; i < 12; i++) {
      const turn = (i / 12) * Math.PI * 2;
      container.setParticleAt(i, Math.cos(turn) * 0.9, Math.sin(turn) * 0.9, 0, 0.3, 0, i % 2 ? 0x46f0f0 : 0xf032e6);
    }
    container.upload();
  }, []);

  return <particleContainer3D ref={particles} args={[{ capacity: 12, space: 'local' }]} position={[1.3, 0, 0]} />;
}

/**
 * A `<camera3D>` element made the root's camera, as drei's `makeDefault` does. The repo's type check sees
 * threejs-compat's `Register`, which types `state.camera` as three's, hence the cast.
 */
function DefaultCamera() {
  const camera = useRef<RootCamera>(null);
  const set = useThree((state) => state.set);

  useLayoutEffect(() => set({ camera: camera.current! } as unknown as Partial<RootState>), [set]);

  return <camera3D ref={camera} args={[{ fov: 30 }]} position={[0, 0.5, 7]} />;
}

/**
 * The element kinds the other scenes don't draw. The canvas is drawn from a `<camera3D>` with a `fov`
 * of 30 at (0, 0.5, 7), looking straight down -z, which a layout effect makes the root's camera with
 * `set({ camera })`: everything is larger than through the default camera, and sits below the middle of
 * the canvas. Left: a `<geometry3D>` triangle built from its positions and normals in `args`, in an
 * unlit orange. Right: a `<particleContainer3D>` of twelve particles in a ring, magenta and cyan in
 * turn, each a square of @pixi/3d's default white texture, tinted and facing the camera.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <DefaultCamera />
      <mesh3D position={[-1.3, 0, 0]}>
        <geometry3D args={[TRIANGLE]} />
        <flatMaterial3D baseColor="#f58231" />
      </mesh3D>
      <Ring />
    </>
  ),
};
