import { useLoader } from '@react-fiber/threejs-compat';
import { TextureLoader } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { Component } from 'react';
import type { ReactNode } from 'react';

/**
 * An error boundary that also listens for the window's error events: r3f reports an error a boundary
 * caught with `reportError`, which fires one, and a listener marks it handled, as an app's own error
 * reporting does
 */
class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
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

function Missing() {
  const map = useLoader(TextureLoader, '/textures/does-not-exist.png');

  return <meshBasicMaterial map={map} />;
}

/**
 * A texture that fails to load throws to the nearest error boundary, as in r3f: the box's material
 * is the boundary's red fallback, and the green box beside it was never touched
 */
export const scene: TestScene = {
  render: () => (
    <>
      <mesh position={[-1.2, 0, 0]} rotation={[0.4, 0.6, 0]}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <Boundary fallback={<meshBasicMaterial color="red" />}>
          <Missing />
        </Boundary>
      </mesh>
      <mesh position={[1.2, 0, 0]} rotation={[0.4, 0.6, 0]}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshBasicMaterial color="green" />
      </mesh>
    </>
  ),
};
