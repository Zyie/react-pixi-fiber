import { Matrix4, RenderPassBit } from '@pixi/3d';
import type { BatchedMesh3D } from '@pixi/3d';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useLayoutEffect, useRef } from 'react';

const SLOTS = [0, 1, 2];

/** Three cubes of one batch in a column: the geometry and material fill every slot as they attach */
function Batch() {
  const batch = useRef<BatchedMesh3D>(null);

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    for (const slot of SLOTS) {
      batch.current!.setMatrixAt(slot, matrix.makeTranslation(0, (slot - 1) * 0.9, 0));
      batch.current!.setPassesAt(slot, RenderPassBit.OPAQUE);
    }
  }, []);

  return (
    <batchedMesh3D ref={batch} args={[{ size: SLOTS.length }]} position={[2.2, 0, 0]} angle={[20, 30, 0]}>
      <cubeGeometry3D
        args={[{ width: 0.6, height: 0.6, depth: 0.6 }]}
        attach={(parent, geometry) => {
          for (const slot of SLOTS) (parent as BatchedMesh3D).setGeometryAt(slot, geometry);
          return () => {};
        }}
      />
      <phongMaterial3D
        baseColor="#e04a8a"
        attach={(parent, material) => {
          for (const slot of SLOTS) (parent as BatchedMesh3D).setMaterialAt(slot, material);
          return () => {};
        }}
      />
    </batchedMesh3D>
  );
}

/**
 * The node kinds `@react-fiber/3d` names: on the left, a `<container3D>` turned 45 degrees around z,
 * holding two green `<mesh3D>` cubes side by side, so they sit on a diagonal; in the middle, a
 * `<sprite3D>` of a white texture tinted yellow, a square facing the camera; on the right, a
 * `<batchedMesh3D>` drawing three pink cubes in a column.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7] },
  render: () => (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-30, 30, 0]} intensity={2.5} />
      <container3D position={[-2.2, 0, 0]} angle={[0, 0, 45]}>
        {[-0.6, 0.6].map((x) => (
          <mesh3D key={x} position={[x, 0, 0]} angle={[20, 30, 0]}>
            <cubeGeometry3D args={[{ width: 0.8, height: 0.8, depth: 0.8 }]} />
            <phongMaterial3D baseColor="#46b96b" />
          </mesh3D>
        ))}
      </container3D>
      <sprite3D args={[{ texture: Texture.WHITE }]} tint="#f4d03f" width={1.2} height={1.2} />
      <Batch />
    </>
  ),
};
