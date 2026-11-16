import { Canvas, useFrame, useThree } from '@react-fiber/threejs-compat';
import type { ThreeEvent } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
// #region result
import { useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Object({ scale = 1, z = 0, opacity = 1 }) {
  const viewport = useThree((state) => state.viewport);
  const [hovered, hover] = useState(false);
  const [position, set] = useState<[number, number, number]>([0, 0, z]);
  const drag = useRef<{ x: number; y: number; from: [number, number, number] } | null>(null);
  const mesh = useRef<Mesh>(null!);

  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y += 0.01;
  });

  // #region drag
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    drag.current = { x: e.offsetX, y: e.offsetY, from: position };
  };
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    e.stopPropagation();
    const { x, y, from } = drag.current;
    const factor = viewport.getCurrentViewport().factor;
    set([from[0] + (e.offsetX - x) / factor, from[1] - (e.offsetY - y) / factor, z]);
  };
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.target.releasePointerCapture(e.pointerId);
    drag.current = null;
  };
  // #endregion drag

  return (
    <mesh
      ref={mesh}
      position={position}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        hover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        hover(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        console.log('clicked', { z });
      }}
      scale={scale}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial transparent={opacity < 1} opacity={opacity} color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5 * Math.PI} />
      <directionalLight position={[10, 10, 10]} intensity={Math.PI} />
      <directionalLight position={[-10, -10, -10]} intensity={Math.PI / 2} />
      <Object z={-1} scale={0.5} />
      <Object opacity={0.8} />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's Gestures demo, with the drag written on r3f's own pointer events in place of
 * `@use-gesture/react`: pointerdown captures the pointer, so the object keeps getting moves while the
 * pointer is outside it, and the offset in pixels becomes world units through the viewport's
 * `factor`. The front object has been dragged up and to the right, uncovering the small one behind
 * it, and turns pink under the pointer. The demo's spot and point lights, which don't decay, are
 * directional lights: pixi-3d's lights always decay.
 */
export const example: Example = {
  title: 'Dragging with pointer capture',
  frames: 20,
  render: () => (
    <>
      <ambientLight intensity={0.5 * Math.PI} />
      <directionalLight position={[10, 10, 10]} intensity={Math.PI} />
      <directionalLight position={[-10, -10, -10]} intensity={Math.PI / 2} />
      <Object z={-1} scale={0.5} />
      <Object opacity={0.8} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    await mouse.down();
    await mouse.move(260, 110);
    await mouse.move(300, 90);
    await mouse.up();
    await frames();
  },
};
