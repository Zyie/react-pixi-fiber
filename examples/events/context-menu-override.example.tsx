// #region result
import { Canvas } from '@react-fiber/threejs-compat';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region box
function Box() {
  const [state, setState] = useState(false);

  return (
    <mesh
      scale={[2, 2, 2]}
      position={[1, 0, 0]}
      onContextMenu={(ev) => {
        ev.nativeEvent.preventDefault();
        setState((value) => !value);
      }}
      onPointerMissed={() => console.log('mesh.missed')}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial color={state ? 'hotpink' : 'blue'} />
    </mesh>
  );
}
// #endregion box

export function App() {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 60, position: [0, 0, 25] }}
      onPointerMissed={() => console.log('canvas.missed')}
    >
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[10, 10, 10]} intensity={Math.PI / 2} />
      <Box />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's ContextMenuOverride demo: a right click on the box toggles its colour and keeps the browser's
 * menu closed with `preventDefault()` on the native event. The box has been right-clicked once. The
 * demo's point light, which doesn't decay, is a directional light here, since pixi-3d's lights always
 * decay, and the zoom fits the box in a smaller canvas.
 */
export const example: Example = {
  title: 'Overriding the context menu',
  canvas: { orthographic: true },
  camera: { zoom: 60, position: [0, 0, 25] },
  render: () => (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[10, 10, 10]} intensity={Math.PI / 2} />
      <Box />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.contextMenu(260, 150);
    await frames();
  },
};
