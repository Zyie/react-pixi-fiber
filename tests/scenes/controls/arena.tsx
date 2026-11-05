import { extend } from 'react-pixi-fiber';
import type { ThreeElement } from 'react-pixi-fiber';
import { MapControls, OrbitControls } from 'react-pixi-fiber/addons';

extend({ OrbitControls, MapControls });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
    mapControls: ThreeElement<typeof MapControls>;
  }
}

/**
 * What the controls scenes orbit round: a grey floor with a red box at +X, a green one at -Z and a blue
 * one at -X, so a change of view shows as the boxes trading places
 */
export function Arena() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#9a9a9a" />
      </mesh>
      <mesh position={[1.5, 0.5, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#e63946" />
      </mesh>
      <mesh position={[0, 0.5, -1.5]}>
        <boxGeometry />
        <meshStandardMaterial color="#2a9d8f" />
      </mesh>
      <mesh position={[-1.5, 0.5, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#457b9d" />
      </mesh>
      <mesh position={[0, 0.25, 1.2]}>
        <sphereGeometry args={[0.25, 24, 12]} />
        <meshStandardMaterial color="#f4a261" />
      </mesh>
    </>
  );
}
