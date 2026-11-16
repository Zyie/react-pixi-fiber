import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { RootState } from '@react-fiber/threejs-compat';
import { useRef } from 'react';
import type { ElementRef } from 'react';
import { createRoot as createDomRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

// The scenes drive their own frames; this is the one place the real requestAnimationFrame loop runs,
// outside act(), as an app runs: the loop and Canvas's own measuring commit on their own.
it('mounts through <Canvas> from react-dom, sized by its parent, with its background, and runs useFrame on the default frameloop', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;

  const host = document.body.appendChild(document.createElement('div'));
  const dom = createDomRoot(host);
  let frames = 0;
  let state: RootState | undefined;

  host.style.cssText = 'width: 64px; height: 48px';

  function Spin() {
    const mesh = useRef<ElementRef<'mesh'>>(null);

    useFrame((_, delta) => {
      mesh.current!.rotation.y += delta;
      frames++;
    });

    return (
      <mesh ref={mesh}>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    );
  }

  dom.render(
    <Canvas onCreated={(created) => void (state = created)} background="#336699">
      <Spin />
    </Canvas>,
  );
  await vi.waitFor(() => expect(frames).toBeGreaterThan(3), { timeout: 5000 });

  expect(state!.size.width).toBe(64);
  expect(state!.size.height).toBe(48);
  expect(host.querySelector('canvas')).toBe(state!.gl.domElement);
  expect(state!.scene.background).toBe('#336699');

  dom.unmount();
  host.remove();
});
