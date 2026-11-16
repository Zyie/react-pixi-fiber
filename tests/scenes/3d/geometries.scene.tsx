import type { TestScene } from '@test-scene';
import type { ReactNode } from 'react';

/** A lit cell of the grid, `x` and `y` in grid units from the centre */
function Cell({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <mesh3D position={[x * 2.4, y * 2.2, 0]} angle={[25, 35, 0]}>
      {children}
      <phongMaterial3D baseColor="#e8a33d" shininess={40} />
    </mesh3D>
  );
}

/**
 * Every geometry `@react-fiber/3d` names, each with its options as `args`, in a 3 by 3 grid of orange
 * phong meshes, each turned the same way to the light. Top row: cube, sphere, plane (a turned square).
 * Middle: cylinder, cone, capsule. Bottom: torus, torus knot, icosahedron (faceted).
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 9] },
  render: () => (
    <>
      <ambientLight3D intensity={0.25} />
      <directionalLight3D angle={[-35, 25, 0]} intensity={2.5} />
      <Cell x={-1} y={1}>
        <cubeGeometry3D args={[{ width: 1.4, height: 1.4, depth: 1.4 }]} />
      </Cell>
      <Cell x={0} y={1}>
        <sphereGeometry3D args={[{ radius: 0.8 }]} />
      </Cell>
      <Cell x={1} y={1}>
        <planeGeometry3D args={[{ width: 1.5, height: 1.5 }]} />
      </Cell>
      <Cell x={-1} y={0}>
        <cylinderGeometry3D args={[{ radiusTop: 0.6, radiusBottom: 0.6, height: 1.4 }]} />
      </Cell>
      <Cell x={0} y={0}>
        <coneGeometry3D args={[{ radius: 0.7, height: 1.5 }]} />
      </Cell>
      <Cell x={1} y={0}>
        <capsuleGeometry3D args={[{ radius: 0.45, height: 1.6 }]} />
      </Cell>
      <Cell x={-1} y={-1}>
        <torusGeometry3D args={[{ radius: 0.6, tube: 0.25 }]} />
      </Cell>
      <Cell x={0} y={-1}>
        <torusKnotGeometry3D args={[{ radius: 0.55, tube: 0.18 }]} />
      </Cell>
      <Cell x={1} y={-1}>
        <icosahedronGeometry3D args={[{ radius: 0.8 }]} />
      </Cell>
    </>
  ),
};
