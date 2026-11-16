// #region result
import { Canvas } from '@react-fiber/threejs-compat';
import { Vector2 } from '@react-fiber/threejs-compat/three';
// #endregion result

import type { Example } from '../example';

// #region result
const profile = [new Vector2(0.05, -0.7), new Vector2(0.55, -0.5), new Vector2(0.3, 0.1), new Vector2(0.45, 0.6)];

const geometries = [
  <boxGeometry key="box" args={[1.1, 1.1, 1.1]} />,
  <sphereGeometry key="sphere" args={[0.7, 32, 16]} />,
  <cylinderGeometry key="cylinder" args={[0.5, 0.6, 1.2, 24]} />,
  <coneGeometry key="cone" args={[0.65, 1.3, 24]} />,
  <capsuleGeometry key="capsule" args={[0.4, 0.6, 6, 16]} />,
  <torusGeometry key="torus" args={[0.5, 0.2, 16, 48]} />,
  <torusKnotGeometry key="knot" args={[0.45, 0.15, 96, 12]} />,
  <icosahedronGeometry key="icosahedron" args={[0.75]} />,
  <dodecahedronGeometry key="dodecahedron" args={[0.75]} />,
  <ringGeometry key="ring" args={[0.3, 0.7, 32]} />,
  <latheGeometry key="lathe" args={[profile, 24]} />,
  <sphereGeometry key="slice" args={[0.7, 32, 16, 0, Math.PI * 1.5]} />,
];

function Gallery() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {geometries.map((geometry, index) => (
        <mesh
          key={index}
          position={[(index % 4) * 2.6 - 3.9, 2 - Math.floor(index / 4) * 2, 0]}
          rotation={[0.4, 0.5, 0]}
        >
          {geometry}
          <meshStandardMaterial color="#7fb3d5" side={2} />
        </mesh>
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <Gallery />
    </Canvas>
  );
}
// #endregion result

export const example: Example = {
  title: 'Geometry gallery',
  description: "three's geometries, each with three's arguments, built by three's own generators.",
  camera: { position: [0, 0, 10] },
  render: () => <Gallery />,
};
