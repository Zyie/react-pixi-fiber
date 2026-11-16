import { Environment } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

/** Six walls round the origin, facing in: red +X, cyan -X, white ceiling, brown floor, teal +Z, violet -Z */
const WALLS: { position: [number, number, number]; rotation: [number, number, number]; color: string }[] = [
  { position: [10, 0, 0], rotation: [0, -Math.PI / 2, 0], color: '#e63946' },
  { position: [-10, 0, 0], rotation: [0, Math.PI / 2, 0], color: '#48cae4' },
  { position: [0, 10, 0], rotation: [Math.PI / 2, 0, 0], color: '#f1faee' },
  { position: [0, -10, 0], rotation: [-Math.PI / 2, 0, 0], color: '#6b4f3a' },
  { position: [0, 0, 10], rotation: [0, Math.PI, 0], color: '#2a9d8f' },
  { position: [0, 0, -10], rotation: [0, 0, 0], color: '#c77dff' },
];

function Room() {
  return (
    <>
      {WALLS.map(({ position, rotation, color }) => (
        <mesh key={color} position={position} rotation={rotation}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <mesh position={[3, -9, 6]}>
        <boxGeometry args={[4, 2, 4]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
    </>
  );
}

/**
 * `<Environment>` with children: a room of coloured walls filmed once by a cube camera into a cube
 * target, which lights the spheres and is drawn behind them. Looking along -Z and a little to the right,
 * the violet wall is ahead, the red one at the right edge and the cyan one at the left; the mirror sphere
 * shows the teal wall behind the camera and the yellow block on the floor, as three's does.
 */
export const scene: TestScene = {
  camera: { position: [-1, 0.5, 4], fov: 70 },
  render: () => (
    <>
      <Environment background resolution={64}>
        <Room />
      </Environment>
      <mesh position={[-0.8, 0, 0]}>
        <sphereGeometry args={[0.7, 48, 24]} />
        <meshStandardMaterial metalness={1} roughness={0.02} />
      </mesh>
      <mesh position={[0.8, 0, 0]}>
        <sphereGeometry args={[0.7, 48, 24]} />
        <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.8} />
      </mesh>
    </>
  ),
};
