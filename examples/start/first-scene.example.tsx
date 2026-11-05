// #region canvas
import { Canvas } from 'react-pixi-fiber';
// #endregion canvas

import type { Example } from '../example';

// #region scene
function Scene() {
  return (
    <>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </>
  );
}
// #endregion scene

// #region canvas
export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
// #endregion canvas

export const example: Example = {
  render: () => <Scene />,
};
