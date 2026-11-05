import type { TestScene } from '@test-scene';
import type { ReactNode } from 'react';

const MATERIALS: ReactNode[] = [
  <meshBasicMaterial key="basic" color="#e05a47" />,
  <meshLambertMaterial key="lambert" color="#e05a47" />,
  <meshPhongMaterial key="phong" color="#e05a47" specular="#666666" shininess={40} />,
  <meshStandardMaterial key="standard" color="#e05a47" roughness={0.35} />,
  <meshStandardMaterial key="metal" color="#e05a47" roughness={0.35} metalness={1} />,
  <meshToonMaterial key="toon" color="#e05a47" />,
  <meshNormalMaterial key="normal" />,
  <meshMatcapMaterial key="matcap" color="#e05a47" />,
];

/**
 * One torus knot per material, in the order above, under the same ambient and directional light:
 * basic, Lambert, Phong, standard, metal standard, toon, normal and matcap
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 10] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {MATERIALS.map((material, index) => (
        <mesh key={index} position={[((index % 4) - 1.5) * 2.9, index < 4 ? 1.4 : -1.4, 0]} rotation={[0.3, 0.4, 0]}>
          <torusKnotGeometry args={[0.7, 0.25, 128, 16]} />
          {material}
        </mesh>
      ))}
    </>
  ),
};
