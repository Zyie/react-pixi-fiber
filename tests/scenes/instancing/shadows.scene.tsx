import { Matrix4 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

/** Three boxes from one instanced mesh, standing on a floor; `cast` turns `castShadow` on */
function Boxes({ cast, z }: { cast: boolean; z: number }) {
  const mesh = useRef<ElementRef<'instancedMesh'>>(null);

  useLayoutEffect(() => {
    const matrix = new Matrix4();

    for (let i = 0; i < 3; i++) mesh.current!.setMatrixAt(i, matrix.makeTranslation(i * 1.4 - 1.4, 0.5, z));
    mesh.current!.instanceMatrix.needsUpdate = true;
  }, [z]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 3]} castShadow={cast}>
      <boxGeometry args={[0.7, 1, 0.7]} />
      <meshStandardMaterial color={cast ? '#f0ad4e' : '#5bc0de'} />
    </instancedMesh>
  );
}

/**
 * `castShadow` on an instanced mesh, with shadows on: the back row of orange boxes casts a shadow from
 * each instance onto the floor, away from the light above and to the right; the front row of blue
 * boxes has `castShadow` off and casts none.
 */
export const scene: TestScene = {
  camera: { position: [4, 4, 6] },
  canvas: { renderer: { shadows: true } },
  render: () => (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 2]} intensity={2} castShadow />
      <Boxes cast z={-1} />
      <Boxes cast={false} z={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </>
  ),
};
