// #region result
import { Canvas, Environment } from '@react-fiber/threejs-compat';
// #endregion result

import type { Example } from '../example';

// #region result
const WALLS: { position: [number, number, number]; rotation: [number, number, number]; color: string }[] = [
  { position: [0, 8, 0], rotation: [Math.PI / 2, 0, 0], color: '#fff1d0' },
  { position: [0, -4, 0], rotation: [-Math.PI / 2, 0, 0], color: '#3d405b' },
  { position: [-10, 0, 0], rotation: [0, Math.PI / 2, 0], color: '#e07a5f' },
  { position: [10, 0, 0], rotation: [0, -Math.PI / 2, 0], color: '#81b29a' },
  { position: [0, 0, -10], rotation: [0, 0, 0], color: '#f4f1de' },
  { position: [0, 0, 10], rotation: [0, Math.PI, 0], color: '#a8dadc' },
];

function Room() {
  return (
    <>
      {WALLS.map(({ position, rotation, color }) => (
        <mesh key={color} position={position} rotation={rotation}>
          <planeGeometry args={[30, 30]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

function Scene() {
  return (
    <>
      {/* #region environment */}
      <Environment resolution={128} background>
        <Room />
      </Environment>
      {/* #endregion environment */}
      <mesh position={[-1.1, 0, 0]}>
        <sphereGeometry args={[0.9, 64, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <sphereGeometry args={[0.9, 64, 32]} />
        <meshStandardMaterial color="#f2cc8f" roughness={0.6} />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/**
 * `<Environment>` with children: a room of coloured walls, filmed once by a cube camera, lights a
 * metal ball and a matte one and is drawn behind them. The warm ceiling lights them from above, the
 * red and green walls from the sides, and the metal ball mirrors the pale blue wall behind the camera.
 */
export const example: Example = {
  title: 'An environment made from a scene',
  render: () => <Scene />,
};
