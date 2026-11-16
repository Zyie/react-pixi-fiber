import type { Fog, Hemisphere } from '@pixi/3d';

/** A light blue haze from 5 units in front of the camera, solid by 22 */
export const FOG: Fog = { type: 'linear', color: '#a8c0d8', near: 5, far: 22 };

/** A blue sky over brown ground */
export const ENVIRONMENT: Hemisphere = { skyColor: '#5d9cff', groundColor: '#7a4f24' };

const COLUMNS = [
  [-3, -4],
  [2.5, -8],
  [-1.2, -13],
  [8, -19],
] as const;

/**
 * A grey floor running far back under a strong directional light that casts shadows: in front, a white
 * rough sphere on the left whose lit side runs past full brightness, a mirror-smooth metal sphere in
 * the middle, which shows only what it reflects, and an orange cube on the right casting a shadow to its
 * left; behind them, four blue columns going back from 4 to 19 units
 */
export function Stage() {
  return (
    <>
      <ambientLight3D intensity={0.2} />
      <directionalLight3D angle={[-55, 35, 0]} intensity={4} castShadow />
      <mesh3D angle={[-90, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry3D args={[{ width: 40, height: 40 }]} />
        <material3D baseColor="#8a8a8a" roughness={0.9} metallic={0} />
      </mesh3D>
      <mesh3D position={[-2.2, -0.2, 0]} scale={0.8} castShadow>
        <sphereGeometry3D />
        <material3D baseColor="#ffffff" roughness={0.6} metallic={0} />
      </mesh3D>
      <mesh3D position={[0, -0.2, 0.5]} scale={0.8} castShadow>
        <sphereGeometry3D />
        <material3D baseColor="#e8e8e8" roughness={0.15} metallic={1} />
      </mesh3D>
      <mesh3D position={[2.2, -0.3, 0]} angle={[0, 30, 0]} scale={1.4} castShadow>
        <cubeGeometry3D />
        <material3D baseColor="#ff8a30" roughness={0.7} metallic={0} />
      </mesh3D>
      {COLUMNS.map(([x, z]) => (
        <mesh3D key={z} position={[x, 0.5, z]} scale={[1, 3, 1]} castShadow>
          <cubeGeometry3D />
          <material3D baseColor="#3d6fd8" roughness={0.7} metallic={0} />
        </mesh3D>
      ))}
    </>
  );
}
