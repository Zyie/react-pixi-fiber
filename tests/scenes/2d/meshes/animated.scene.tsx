import { useFrame, useTexture } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { Point } from 'pixi.js';
import type { MeshPlane, MeshRope, PerspectiveMesh, RopeGeometry } from 'pixi.js';
import { useMemo, useRef } from 'react';

/** A rope whose points `useFrame` moves along a travelling sine wave; the rope follows them */
function Snake() {
  const texture = useTexture('/textures/quadrants.png?animated-meshes');
  const rope = useRef<MeshRope>(null);
  const options = useMemo(
    () => ({ texture, points: Array.from({ length: 20 }, (_, i) => new Point(i * 8, 0)) }),
    [texture],
  );

  useFrame((state) => {
    const { points } = rope.current!.geometry as RopeGeometry;
    for (let i = 0; i < points.length; i++) points[i].y = Math.sin(i * 0.5 + state.elapsed * 10) * 20;
  });

  return <meshRope2D ref={rope} args={[options]} x={40} y={70} />;
}

/** A plane whose vertices `useFrame` shifts sideways by row, through its geometry's position buffer */
function Flag() {
  const texture = useTexture('/textures/quadrants.png?animated-meshes');
  const plane = useRef<MeshPlane>(null);
  const options = useMemo(() => ({ texture, verticesX: 10, verticesY: 10 }), [texture]);

  useFrame((state) => {
    const buffer = plane.current!.geometry.getBuffer('aPosition');
    const positions = buffer.data;
    for (let i = 0; i < positions.length; i += 2) {
      const row = Math.floor(i / 2 / 10);
      positions[i] = ((i / 2) % 10) * (texture.width / 9) + Math.sin(row * 0.7 + state.elapsed * 6) * 6;
    }
    buffer.update();
  });

  return <meshPlane2D ref={plane} args={[options]} x={220} y={20} width={110} height={110} />;
}

/** A perspective mesh whose far corners `useFrame` swings in and out with `setCorners` */
function Card() {
  const texture = useTexture('/textures/quadrants.png?animated-meshes');
  const card = useRef<PerspectiveMesh>(null);
  const options = useMemo(() => ({ texture, verticesX: 10, verticesY: 10 }), [texture]);

  useFrame((state) => {
    const squeeze = Math.abs(Math.sin(state.elapsed * 2)) * 30;
    card.current!.setCorners(0, 0, 120, squeeze, 120, 120 - squeeze, 0, 120);
  });

  return <perspectiveMesh2D ref={card} args={[options]} x={30} y={160} />;
}

function Quad({ spread }: { spread: number }) {
  const texture = useTexture('/textures/quadrants.png?animated-meshes');
  const options = useMemo(
    () => ({
      texture,
      vertices: new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    }),
    [texture],
  );
  const vertices = useMemo(() => new Float32Array([0, 0, 100 + spread, 0, 100, 100 + spread, -spread, 100]), [spread]);

  return <meshSimple2D args={[options]} vertices={vertices} x={240} y={170} />;
}

/**
 * Meshes after twenty frames, each textured with the quadrants. A `<meshRope2D>` follows its points,
 * which `useFrame` moves along a travelling sine wave. A `<meshPlane2D>` ripples sideways row by row,
 * its position buffer written in `useFrame`. A `<perspectiveMesh2D>` narrows at its right edge, its
 * corners set by `setCorners` each frame. A `<meshSimple2D>` quad whose `vertices` prop `act` replaces,
 * pulling three corners out by 30 pixels.
 */
export const scene: TestScene = {
  frames: 20,
  render: () => (
    <>
      <Snake />
      <Flag />
      <Card />
      <Quad spread={0} />
    </>
  ),
  act: async ({ update }) => {
    await update(
      <>
        <Snake />
        <Flag />
        <Card />
        <Quad spread={30} />
      </>,
    );
  },
};
