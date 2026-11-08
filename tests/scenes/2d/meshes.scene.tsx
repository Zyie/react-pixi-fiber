import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { MeshGeometry, Point } from 'pixi.js';
import { useMemo } from 'react';
import { useTexture } from 'react-pixi-fiber';

function Meshes() {
  const texture = useTexture('/textures/quadrants.png?meshes');
  const rope = useMemo(() => Array.from({ length: 10 }, (_, i) => new Point(i * 16, Math.sin(i * 0.8) * 16)), []);
  const triangle = useMemo(
    () =>
      new MeshGeometry({
        positions: new Float32Array([0, 0, 1, 0, 0.5, 1]),
        uvs: new Float32Array([0, 0, 1, 0, 0.5, 1]),
        indices: new Uint32Array([0, 1, 2]),
      }),
    [],
  );

  return (
    <>
      <meshPlane2D args={[{ texture, verticesX: 4, verticesY: 4 }]} position={[20, 20]} width={110} height={110} />
      <meshRope2D args={[{ texture, points: rope }]} position={[150, 70]} />
      <meshSimple2D
        args={[
          {
            texture,
            vertices: new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]),
            uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
            indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
          },
        ]}
        position={[290, 20]}
      />
      <perspectiveMesh2D
        args={[
          { texture, verticesX: 10, verticesY: 10, x0: 30, y0: 0, x1: 130, y1: 20, x2: 140, y2: 120, x3: 0, y3: 110 },
        ]}
        position={[20, 160]}
      />
      <mesh2D args={[{ geometry: triangle, texture }]} position={[220, 160]} scale={110} />
    </>
  );
}

/**
 * The mesh elements, each showing the quadrants texture: a `<meshPlane2D>` square, a `<meshRope2D>`
 * waving along ten points, a `<meshSimple2D>` quad from its own vertices, a `<perspectiveMesh2D>`
 * skewed by its four corners, and a `<mesh2D>` drawing a triangle `MeshGeometry` passed in `args`.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Meshes />,
};
