// #region result
import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Loader } from '@react-fiber/threejs-compat/three';
import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
/** Takes a while to load, standing in for a slow asset */
class SlowLoader extends Loader<string> {
  public override load(url: string, onLoad?: (value: string) => void): void {
    setTimeout(() => onLoad?.(url), 500);
  }
}

// Suspends the scene for half a second, simulating loading an async asset
function AsyncComponent({ cacheKey }: { cacheKey: string }) {
  useLoader(SlowLoader, cacheKey);

  return null;
}

// Loads a file that does not exist
function SimulateError() {
  useLoader(GLTFLoader, '/doesnotexist.glb');

  return null;
}

// Catches the error and turns the box red, where the demo lets it reach outside the Canvas
class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  public override state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public override componentDidMount(): void {
    window.addEventListener('error', this._handled);
  }

  public override componentWillUnmount(): void {
    window.removeEventListener('error', this._handled);
  }

  public override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }

  private readonly _handled = (event: ErrorEvent): void => event.preventDefault();
}

function Scene() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoad(true), 800);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <ambientLight intensity={Math.PI} />
      <pointLight position={[10, 10, 5]} intensity={200} />
      <mesh>
        <boxGeometry />
        <ErrorBoundary fallback={<meshStandardMaterial color="red" />}>
          <meshStandardMaterial color="orange" />
          {load && <SimulateError />}
        </ErrorBoundary>
      </mesh>
      <AsyncComponent cacheKey="1" />
    </>
  );
}

export function App() {
  return (
    <Canvas orthographic camera={{ position: [10, 10, 10], zoom: 100 }}>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's SuspenseAndErrors demo: the scene waits on a slow load, then a component loads a file that
 * isn't there. The error reaches the nearest error boundary, which turns the orange box red; the
 * demo has none, so its error reaches the page. Its waits are shorter, and the picture is taken after
 * them.
 */
export const example: Example = {
  title: 'Suspense and load errors',
  camera: { position: [10, 10, 10], zoom: 100 },
  canvas: { orthographic: true },
  render: () => <Scene />,
  act: async ({ frames }) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await frames(2);
  },
};
