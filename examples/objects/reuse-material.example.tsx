// #region result
import { Canvas } from '@react-fiber/threejs-compat';
import { MeshBasicMaterial, SphereGeometry } from '@react-fiber/threejs-compat/three';
import { useEffect, useMemo, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const aquamarine = new MeshBasicMaterial({ color: 'aquamarine', toneMapped: false });

function ReuseMaterial({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.25, 64, 64]} />
      <primitive attach="material" object={aquamarine} />
    </mesh>
  );
}

function TestReuse() {
  const [okay, setOkay] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setOkay((value) => !value), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {okay && <ReuseMaterial position={[-1.5, 0, 0]} />}
      <ReuseMaterial position={[1.5, 0, 0]} />
    </>
  );
}

function TestMix() {
  const [size, setSize] = useState(0.1);
  const geometry = useMemo(() => new SphereGeometry(size, 64, 64), [size]);
  useEffect(() => {
    const interval = setInterval(() => setSize((s) => (s < 0.4 ? s + 0.025 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <mesh args={[geometry]} position={[0, 1, 0]}>
      <meshBasicMaterial color="hotpink" toneMapped={false} />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [2, 2, 2] }}>
      <TestReuse />
      <TestMix />
    </Canvas>
  );
}
// #endregion result

/**
 * From r3f's MultiMaterial demo: one material shared through `<primitive attach="material">` by
 * spheres that mount and unmount, and a mesh whose geometry is rebuilt from `args`
 */
export const example: Example = {
  title: 'Shared materials and rebuilt geometries',
  camera: { position: [2, 2, 2] },
  render: () => (
    <>
      <TestReuse />
      <TestMix />
    </>
  ),
};
