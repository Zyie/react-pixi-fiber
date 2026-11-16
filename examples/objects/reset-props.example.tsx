// #region result
import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { Group } from '@react-fiber/threejs-compat/three';
import { useEffect, useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  const group = useRef<Group>(null!);
  const [showCube, setShowCube] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setShowCube((value) => !value), 1000);
    return () => clearInterval(interval);
  }, []);

  useFrame(({ elapsed }) => group.current?.rotation.set(Math.sin(elapsed), 0, 0));

  return (
    <>
      <ambientLight intensity={0.5 * Math.PI} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <directionalLight position={[-10, -10, -10]} color="red" intensity={4} />
      <mesh scale={hovered ? 1.25 : 1} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={showCube ? 'white' : 'red'} />
      </mesh>
      <group ref={group}>
        {showCube ? (
          <mesh position={[1.5, 0, 0]}>
            <boxGeometry args={[1, 1]} />
            <meshNormalMaterial transparent opacity={0.5} />
          </mesh>
        ) : (
          <mesh>
            <icosahedronGeometry args={[1]} />
            <meshStandardMaterial color="orange" transparent opacity={0.5} />
          </mesh>
        )}
        <mesh position={[-2, -2, 0]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshPhongMaterial>
            {showCube ? <color attach="color" args={[0, 0, 1]} /> : <color attach="color" args={[1, 0, 0]} />}
          </meshPhongMaterial>
        </mesh>
      </group>
    </>
  );
}

export function App() {
  return (
    <Canvas frameloop="always">
      <Scene />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's ResetProps demo, without drei's OrbitControls and the adaptive pixel ratio: objects swap
 * every second, and a swapped prop or attached `<color>` goes back to its default when it unmounts
 */
export const example: Example = {
  title: 'Resetting props',
  render: () => <Scene />,
};
