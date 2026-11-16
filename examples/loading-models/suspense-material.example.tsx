import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { Loader } from '@react-fiber/threejs-compat/three';
// #region result
import { Suspense, useReducer } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
/** Takes a second to load anything, standing in for a slow file */
class SlowLoader extends Loader<number> {
  public override load(url: string, onLoad?: (value: number) => void): void {
    setTimeout(() => onLoad?.(url.length), 1000);
  }
}

function SlowMaterial({ arg = 0 }) {
  useLoader(SlowLoader, `/slow/${arg}`);

  return <meshStandardMaterial color="salmon" />;
}

function FallbackMaterial() {
  return <meshStandardMaterial color="white" />;
}

function Sphere() {
  const [arg, inc] = useReducer((x: number) => x + 1, 0);

  return (
    <mesh onClick={inc}>
      <sphereGeometry args={[1, 64, 32]} />
      <Suspense fallback={<FallbackMaterial />}>
        <SlowMaterial arg={arg} />
      </Suspense>
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[0, 0, 5]} />
      <Sphere />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's SuspenseMaterial demo: the sphere is white while its material loads, and salmon a second
 * later; a click loads it again. It suspends on a loader where the demo suspends on a timer, and the
 * picture is taken once the second is up.
 */
export const example: Example = {
  title: 'A fallback material while one loads',
  render: () => (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[0, 0, 5]} />
      <Sphere />
    </>
  ),
  act: async ({ frames }) => {
    await new Promise((resolve) => setTimeout(resolve, 1300));
    await frames(2);
  },
};
