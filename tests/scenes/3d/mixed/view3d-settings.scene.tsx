import type { Fog, Hemisphere } from '@pixi/3d';
import { View3D } from '@react-fiber/core';
import type { TestScene } from '@test-scene';

const FOG: Fog = { type: 'linear', color: '#a8c0d8', near: 3, far: 12 };
const ENVIRONMENT: Hemisphere = { skyColor: '#5d9cff', groundColor: '#7a4f24' };

/** A white rough sphere and a metal one side by side, under a strong light, with a blue column far behind */
function Pair() {
  return (
    <>
      <ambientLight3D intensity={0.2} />
      <directionalLight3D angle={[-40, 30, 0]} intensity={4} />
      <mesh3D position={[-0.6, 0, 0]} scale={0.5}>
        <sphereGeometry3D />
        <material3D baseColor="#ffffff" roughness={0.6} metallic={0} />
      </mesh3D>
      <mesh3D position={[0.6, 0, 0]} scale={0.5}>
        <sphereGeometry3D />
        <material3D baseColor="#e8e8e8" roughness={0.15} metallic={1} />
      </mesh3D>
      <mesh3D position={[0, 1.2, -8]} scale={[1, 2.5, 1]}>
        <cubeGeometry3D />
        <material3D baseColor="#3d6fd8" roughness={0.7} metallic={0} />
      </mesh3D>
    </>
  );
}

/**
 * A `<View3D>` draws with the renderer's tone mapping and exposure, and with its own scene's fog and
 * environment. The renderer has the ACES curve at an exposure of 1.5, so both pairs of spheres, the
 * canvas's on the left and the view's in the grey card on the right, roll their white sphere's lit side
 * off the same way. Only the view's scene has fog and a hemisphere environment, set by `attach`: its metal
 * sphere shows blue sky over brown ground and its column fades into light blue, while the canvas's metal
 * sphere is dark but for its highlight and its column is clear.
 */
export const scene: TestScene = {
  canvas: { renderer: { toneMapping: 'aces', exposure: 1.5 } },
  render: () => (
    <>
      <container3D position={[-1.5, 0, 0]}>
        <Pair />
      </container3D>
      <container2D x={210} y={40}>
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 170, 220, 12).fill('#d0d0d0')} />
        <View3D x={10} y={10} width={150} height={200} camera={{ position: [0, 0.3, 4.5] }}>
          <primitive object={FOG} attach="fog" />
          <primitive object={ENVIRONMENT} attach="environment" />
          <Pair />
        </View3D>
      </container2D>
    </>
  ),
};
