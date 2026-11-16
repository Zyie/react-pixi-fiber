// #region result
import type { Fog, Hemisphere } from '@pixi/3d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/3d';
// #endregion result

import type { Example } from '../example';

// #region result
// #region settings
const fog: Fog = { type: 'linear', color: '#a8c0d8', near: 5, far: 22 };
const sky: Hemisphere = { skyColor: '#5d9cff', groundColor: '#7a4f24' };
// #endregion settings

// #region runtime
function Haze() {
  useFrame(({ renderer, elapsed }) => {
    renderer.exposure = 1.4 + 0.2 * Math.sin(elapsed);
    fog.far = 22 + 8 * Math.sin(elapsed / 2);
  });
  return null;
}
// #endregion runtime

function Stage() {
  return (
    <>
      <ambientLight3D intensity={0.2} />
      <directionalLight3D angle={[-55, 35, 0]} intensity={4} castShadow />
      <mesh3D angle={[-90, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry3D args={[{ width: 40, height: 40 }]} />
        <material3D baseColor="#8a8a8a" roughness={0.9} metallic={0} />
      </mesh3D>
      <mesh3D position={[-1.2, -0.2, 0]} scale={0.8} castShadow>
        <sphereGeometry3D />
        <material3D baseColor="#ffffff" roughness={0.6} metallic={0} />
      </mesh3D>
      <mesh3D position={[1.2, -0.2, 0.5]} scale={0.8} castShadow>
        <sphereGeometry3D />
        <material3D baseColor="#e8e8e8" roughness={0.15} metallic={1} />
      </mesh3D>
      {[
        [-2.6, -4],
        [2.6, -9],
        [-0.6, -14],
        [6, -19],
      ].map(([x, z]) => (
        <mesh3D key={z} position={[x, 0.5, z]} scale={[1, 3, 1]} castShadow>
          <cubeGeometry3D />
          <material3D baseColor="#3d6fd8" roughness={0.7} metallic={0} />
        </mesh3D>
      ))}
      <Haze />
    </>
  );
}

// #region canvas
export function App() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 7] }}
      renderer={{ toneMapping: 'aces', exposure: 1.4 }}
      scene={{ fog, environment: sky }}
    >
      <Stage />
    </Canvas>
  );
}
// #endregion canvas
// #endregion result

/**
 * A white sphere and a metal one on a floor running far back, with blue columns going back into a light
 * blue haze: the ACES curve rolls the white sphere's lit side off, the sky and ground of a hemisphere
 * environment light the scene and fill the metal sphere, and linear fog fades the far columns away
 */
export const example: Example = {
  title: 'Tone mapping, fog and environment',
  camera: { position: [0, 1.5, 7] },
  canvas: { renderer: { toneMapping: 'aces', exposure: 1.4 }, scene: { fog, environment: sky } },
  render: () => <Stage />,
};
