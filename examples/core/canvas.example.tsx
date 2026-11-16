// #region result
import { Canvas, useThree } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
// #endregion result

import type { Example } from '../example';

// #region result
// #region state
function Readout() {
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);

  return (
    <text2D
      text={`${size.width} by ${size.height} px, camera at z = ${camera.position.z}`}
      x={12}
      y={12}
      style={{ fill: 'white', fontSize: 16, fontFamily: 'Arial' }}
    />
  );
}
// #endregion state

function Scene() {
  return (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      {['#e76f51', '#2a9d8f', '#e9c46a'].map((color, i) => (
        <mesh3D key={color} position={[(i - 1) * 1.6, 0, -i * 1.5]} angle={[20, 30, 0]}>
          <cubeGeometry3D />
          <phongMaterial3D baseColor={color} />
        </mesh3D>
      ))}
      <Readout />
    </>
  );
}

// #region canvas
export function App() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 40 }} renderer={{ preference: 'webgpu' }} dpr={[1, 2]}>
      <Scene />
    </Canvas>
  );
}
// #endregion canvas
// #endregion result

/** Three cubes going back from left to right, seen by a camera set through the Canvas, with the canvas's size and the camera's place read through `useThree` */
export const example: Example = {
  title: 'A Canvas and its root',
  camera: { position: [0, 2, 6], fov: 40 },
  render: () => <Scene />,
};
