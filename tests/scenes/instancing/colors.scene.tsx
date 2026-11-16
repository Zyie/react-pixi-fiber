import { Color, Object3D } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

const COLUMNS = 6;
const ROWS = 4;
const COUNT = COLUMNS * ROWS;

/** A grid of boxes from one instanced mesh, each turned a little more than the last and tinted along a hue ramp */
function Grid() {
  const mesh = useRef<ElementRef<'instancedMesh'>>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();

    for (let i = 0; i < COUNT; i++) {
      const column = i % COLUMNS;
      const row = Math.floor(i / COLUMNS);

      dummy.position.set((column - (COLUMNS - 1) / 2) * 1.1, ((ROWS - 1) / 2 - row) * 1.1, 0);
      dummy.rotation.set(i * 0.12, i * 0.2, 0);
      dummy.scale.setScalar(0.5 + (i % 3) * 0.15);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      mesh.current!.setColorAt(i, color.setHSL(i / COUNT, 0.7, 0.55));
    }
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.instanceColor!.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <boxGeometry />
      <meshStandardMaterial color="#ffffff" />
    </instancedMesh>
  );
}

/**
 * The r3f instancing idiom: `<instancedMesh args={[undefined, undefined, count]}>` with the geometry
 * and material as children, and each instance placed with `setMatrixAt` from a helper `Object3D` and
 * tinted with `setColorAt`. Twenty-four lit boxes in a six by four grid, turning and growing in steps,
 * coloured from red through green and blue to magenta, left to right and top to bottom.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7] },
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Grid />
    </>
  ),
};
