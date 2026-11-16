// #region result
import { Canvas } from '@react-fiber/threejs-compat';
// #endregion result

import type { Example } from '../example';

// #region result
const materials = [
  <meshBasicMaterial key="basic" color="#ef8354" />,
  <meshLambertMaterial key="lambert" color="#ef8354" />,
  <meshPhongMaterial key="phong" color="#ef8354" specular="#777777" shininess={50} />,
  <meshToonMaterial key="toon" color="#ef8354" />,
  <meshStandardMaterial key="standard" color="#ef8354" roughness={0.3} />,
  <meshStandardMaterial key="metal" color="#ef8354" roughness={0.3} metalness={1} />,
  <meshPhysicalMaterial key="physical" color="#ef8354" roughness={0.5} clearcoat={1} clearcoatRoughness={0.05} />,
  <meshNormalMaterial key="normal" />,
];

function Gallery() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {materials.map((material, index) => (
        <mesh key={index} position={[(index % 4) * 2.4 - 3.6, index < 4 ? 1.2 : -1.2, 0]}>
          <sphereGeometry args={[0.9, 48, 24]} />
          {material}
        </mesh>
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 9] }}>
      <Gallery />
    </Canvas>
  );
}
// #endregion result

export const example: Example = {
  title: 'Materials gallery',
  description:
    'Basic, Lambert, Phong, toon, standard, metal, physical with a clear coat, and normal, lit as three lights them.',
  camera: { position: [0, 0, 9] },
  render: () => <Gallery />,
  // pixi-3d's light loop skips a light a face turns from, where three's toon shading still reads the
  // darkest level, 0.7 of the light, so the toon sphere's unlit side is darker than three's.
  parity: { maxDiff: 0.04 },
};
