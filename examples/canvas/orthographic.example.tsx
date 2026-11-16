// #region canvas
import { Canvas } from '@react-fiber/threejs-compat';
// #endregion canvas

import type { Example } from '../example';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 0, -x * 3]} rotation={[0.5, 0.7, 0]}>
          <boxGeometry />
          <meshStandardMaterial color="#5d9de0" />
        </mesh>
      ))}
    </>
  );
}

// #region canvas
export function App() {
  return (
    <Canvas orthographic camera={{ zoom: 60, position: [0, 0, 20] }}>
      <Scene />
    </Canvas>
  );
}
// #endregion canvas

/** Three boxes at different depths under an orthographic camera, all drawn the same size */
export const example: Example = {
  title: 'An orthographic camera',
  camera: { zoom: 60, position: [0, 0, 20] },
  canvas: { orthographic: true },
  render: () => <Scene />,
};
