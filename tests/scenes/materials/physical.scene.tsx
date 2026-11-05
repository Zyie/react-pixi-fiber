import type { TestScene } from '@test-scene';
import type { ReactNode } from 'react';

const MATERIALS: ReactNode[] = [
  <meshPhysicalMaterial key="base" color="#c0392b" roughness={0.6} />,
  <meshPhysicalMaterial key="clearcoat" color="#c0392b" roughness={0.6} clearcoat={1} clearcoatRoughness={0.05} />,
  <meshPhysicalMaterial
    key="sheen"
    color="#2c3e50"
    roughness={0.8}
    sheen={1}
    sheenColor="#ff9ff3"
    sheenRoughness={0.4}
  />,
  <meshPhysicalMaterial
    key="specular"
    color="#7f8c8d"
    roughness={0.3}
    specularIntensity={1}
    specularColor="#ffd32a"
    ior={2}
  />,
  <meshPhysicalMaterial key="iridescence" color="#ecf0f1" roughness={0.25} iridescence={1} iridescenceIOR={1.6} />,
  <meshPhysicalMaterial key="anisotropy" color="#bdc3c7" metalness={1} roughness={0.4} anisotropy={0.8} />,
];

/**
 * `<meshPhysicalMaterial>` features on spheres under one directional and one ambient light: none,
 * clear coat, sheen, a tinted specular with a high `ior`, iridescence and anisotropy. Each pixi-3d
 * feature turns on from its prop, set before the first frame.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {MATERIALS.map((material, index) => (
        <mesh key={index} position={[((index % 3) - 1) * 2.2, index < 3 ? 1.1 : -1.1, 0]}>
          <sphereGeometry args={[0.9, 48, 24]} />
          {material}
        </mesh>
      ))}
    </>
  ),
  // The base, clear coat, specular and iridescence spheres match three.js. pixi-3d's sheen lobe has no
  // ambient (indirect) sheen, so the sheen sphere's rim is dimmer on its unlit side, and its
  // anisotropy lobe derives its tangent frame differently, so the brushed highlight falls elsewhere.
  parity: { maxDiff: 0.1 },
};
