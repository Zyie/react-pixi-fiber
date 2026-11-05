// #region result
import { useLayoutEffect, useRef } from 'react';
import { Canvas } from 'react-pixi-fiber';
import type { ThreeEvent } from 'react-pixi-fiber';
import { Color, Object3D } from 'react-pixi-fiber/three';
import type { InstancedMesh } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
const SIDE = 8;
const COUNT = SIDE * SIDE;
const temp = new Object3D();
const color = new Color();

function Grid() {
  const mesh = useRef<InstancedMesh>(null!);
  const hovered = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      temp.position.set((i % SIDE) - (SIDE - 1) / 2, Math.floor(i / SIDE) - (SIDE - 1) / 2, 0).multiplyScalar(0.5);
      temp.updateMatrix();
      mesh.current.setMatrixAt(i, temp.matrix);
      mesh.current.setColorAt(i, color.setHSL(0.6, 0.5, 0.35));
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor!.needsUpdate = true;
  }, []);

  // #region hover
  const paint = (id: number | undefined, lightness: number) => {
    if (id === undefined) return;
    mesh.current.setColorAt(id, color.setHSL(0.6, 0.5, lightness));
    mesh.current.instanceColor!.needsUpdate = true;
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === hovered.current) return;
    paint(hovered.current, 0.35);
    paint((hovered.current = e.instanceId), 0.75);
  };

  const onPointerOut = () => {
    paint(hovered.current, 0.35);
    hovered.current = undefined;
  };
  // #endregion hover

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
    >
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Grid />
    </Canvas>
  );
}
// #endregion result

/**
 * Hover on instances: sixty-four boxes in one instanced mesh, and the one under the pointer lights
 * up, found by the event's `instanceId` and recoloured with `setColorAt`. The pointer rests a little
 * up and to the right of the middle.
 */
export const example: Example = {
  title: 'Hovering instances',
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Grid />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(150, 150);
    await mouse.move(245, 102);
    await frames();
  },
};
