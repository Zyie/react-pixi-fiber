// #region result
import { Canvas } from '@react-fiber/threejs-compat';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region sphere
function Sphere() {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh onPointerOver={(e) => (e.stopPropagation(), setHovered(true))} onPointerOut={() => setHovered(false)}>
      <sphereGeometry args={[0.5, 64, 64]} />
      <meshBasicMaterial color={hovered ? 'hotpink' : 'indianred'} />
    </mesh>
  );
}
// #endregion sphere

function Circle() {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh onPointerOver={(e) => (e.stopPropagation(), setHovered(true))} onPointerOut={() => setHovered(false)}>
      <circleGeometry args={[1, 64]} />
      <meshBasicMaterial color={hovered ? 'lightgreen' : 'grey'} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <group
        position={[-1.25, 0, 0]}
        onPointerOver={() => console.log('group1 over')}
        onPointerOut={() => console.log('group1 out')}
      >
        <group
          onPointerOver={() => console.log('      group2 over')}
          onPointerOut={() => console.log('      group2 out')}
        >
          <mesh
            onPointerOver={() => console.log('      white mesh over')}
            onPointerOut={() => console.log('      white mesh out')}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="white" transparent opacity={0.2} />
          </mesh>
          <mesh
            onPointerOver={() => console.log('        black mesh over')}
            onPointerOut={() => console.log('        black mesh out')}
          >
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshBasicMaterial color="black" transparent opacity={0.2} />
          </mesh>
        </group>
      </group>
      <group position={[1.25, 0, 0]}>
        <Circle />
        <Sphere />
      </group>
    </>
  );
}

export function App() {
  return (
    <Canvas orthographic camera={{ position: [0, 0, 20], zoom: 75 }} style={{ background: '#272730' }}>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's Selection demo: on the left, nested groups around two see-through spheres log over and out
 * as the pointer crosses them, every ancestor in turn; on the right, a sphere in front of a card, each
 * stopping propagation, so only the nearest lights up. The pointer rests on the right sphere, which
 * turns pink while the circle behind stays grey. The demo's `renderOrder` is left out, and the zoom
 * fits a smaller canvas. The outer see-through sphere writes depth, as three's transparent materials
 * do, so it hides the inner one, drawn after it.
 */
export const example: Example = {
  title: 'Selection',
  canvas: { orthographic: true },
  camera: { position: [0, 0, 20], zoom: 75 },
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await mouse.move(294, 150);
    await frames();
  },
};
