// #region result
import { Canvas } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      {/* #region declare */}
      <mesh visible userData={{ hello: 'world' }} position={[0, 0.2, 0]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="hotpink" roughness={0.4} />
      </mesh>
      {/* #endregion declare */}
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
// #endregion result

export const example: Example = {
  title: 'Declaring objects',
  render: () => <Scene />,
};
