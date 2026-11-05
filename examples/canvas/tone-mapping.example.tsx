// #region canvas
import { Canvas } from 'react-pixi-fiber';
import { AgXToneMapping } from 'react-pixi-fiber/three';
// #endregion canvas

import type { Example } from '../example';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 5]} intensity={5} />
      {['#ffffff', '#ff6b6b', '#ffd166', '#06d6a0'].map((color, index) => (
        <mesh key={color} position={[(index - 1.5) * 1.4, 0, 0]}>
          <sphereGeometry args={[0.6, 48, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

// #region canvas
export function App() {
  return (
    <Canvas renderer={{ toneMapping: AgXToneMapping, toneMappingExposure: 1.2 }}>
      <Scene />
    </Canvas>
  );
}
// #endregion canvas

/** Brightly lit balls under three's AgX tone curve, which desaturates colours toward white as they run past full brightness */
export const example: Example = {
  title: 'Tone mapping through the renderer prop',
  canvas: { renderer: { toneMapping: AgXToneMapping, toneMappingExposure: 1.2 } },
  render: () => <Scene />,
};
