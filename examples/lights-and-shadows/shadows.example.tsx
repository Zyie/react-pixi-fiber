// #region canvas
import { Canvas } from 'react-pixi-fiber';
// #endregion canvas

import type { Example } from '../example';

// #region scene
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[3, 6, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color="#f0ad4e" />
      </mesh>
      <mesh position={[-1.6, 0.5, 1]} castShadow>
        <sphereGeometry args={[0.5, 48, 24]} />
        <meshStandardMaterial color="#5d9de0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#d8d8d8" />
      </mesh>
    </>
  );
}
// #endregion scene

// #region canvas
export function App() {
  return (
    <Canvas renderer={{ shadows: true }} camera={{ position: [4, 4, 6] }}>
      <Scene />
    </Canvas>
  );
}
// #endregion canvas

/** A box and a ball casting shadows from a directional light onto a floor */
export const example: Example = {
  title: 'Shadows from a directional light',
  camera: { position: [4, 4, 6] },
  canvas: { renderer: { shadows: true } },
  render: () => <Scene />,
};
