import { Canvas, useFrame, useTexture } from '@react-fiber/core';
// #region result
import { Point } from 'pixi.js';
import type { MeshPlane, MeshRope, RopeGeometry } from 'pixi.js';
import { Suspense, useMemo, useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region rope
function Snake() {
  const texture = useTexture('/textures/quadrants.png');
  const rope = useRef<MeshRope>(null);
  const options = useMemo(
    () => ({ texture, points: Array.from({ length: 24 }, (_, i) => new Point(i * 12, 0)) }),
    [texture],
  );

  useFrame((state) => {
    const { points } = rope.current!.geometry as RopeGeometry;
    for (let i = 0; i < points.length; i++) points[i].y = Math.sin(i * 0.45 + state.elapsed * 5) * 24;
  });

  return <meshRope2D ref={rope} args={[options]} x={50} y={70} scale={0.6} />;
}
// #endregion rope

// #region plane
function Flag() {
  const texture = useTexture('/textures/bricks.png?flag');
  const plane = useRef<MeshPlane>(null);
  const options = useMemo(() => ({ texture, verticesX: 12, verticesY: 6 }), [texture]);

  useFrame((state) => {
    const buffer = plane.current!.geometry.getBuffer('aPosition');
    const positions = buffer.data;
    for (let i = 0; i < positions.length; i += 2) {
      const column = (i / 2) % 12;
      const row = Math.floor(i / 2 / 12);
      positions[i + 1] = (row / 5) * texture.height + Math.sin(column * 0.6 - state.elapsed * 6) * column * 0.5;
    }
    buffer.update();
  });

  return <meshPlane2D ref={plane} args={[options]} x={110} y={170} width={220} height={90} />;
}
// #endregion plane

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Snake />
        <Flag />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** A rope that slithers along its points and a brick flag waving, both moved in useFrame */
export const example: Example = {
  title: 'A rope and a waving plane',
  frames: 20,
  render: () => (
    <>
      <Snake />
      <Flag />
    </>
  ),
};
