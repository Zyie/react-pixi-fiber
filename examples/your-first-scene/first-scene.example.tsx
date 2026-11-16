// #region result
import { Canvas } from '@react-fiber/threejs-compat';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  return (
    <>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhongMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </>
  );
}
// #endregion result

// #region result
export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
// #endregion result

export const example: Example = {
  title: 'Your first scene',
  render: () => <Scene />,
};
