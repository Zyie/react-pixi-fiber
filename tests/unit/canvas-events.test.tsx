import { Canvas } from '@react-fiber/threejs-compat';
import type { RootState } from '@react-fiber/threejs-compat';
import { useRef } from 'react';
import { createRoot as createDomRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

/**
 * Dispatches a press and a click on an element, at a point of the page, as Chrome sends them
 * @param target - The element the events go to
 * @param clientX - The point's x on the page
 * @param clientY - The point's y on the page
 */
function click(target: Element, clientX: number, clientY: number): void {
  const init = {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  };

  target.dispatchEvent(new PointerEvent('pointerdown', { ...init, button: 0, buttons: 1 }));
  target.dispatchEvent(new PointerEvent('pointerup', { ...init, button: 0, buttons: 0 }));
  target.dispatchEvent(new PointerEvent('click', { ...init, button: 0, buttons: 0 }));
}

// eventSource and eventPrefix are props of <Canvas> alone, which the scenes, built with createRoot, can't set.
it('listens on eventSource and sets up the ray from the eventPrefix pair', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;

  const host = document.body.appendChild(document.createElement('div'));
  const dom = createDomRoot(host);
  let state: RootState | undefined;
  let clicks = 0;
  let source: HTMLDivElement | null = null;

  host.style.cssText = 'position: fixed; left: 0; top: 0; width: 200px; height: 100px';

  function App() {
    const target = useRef<HTMLDivElement>(null);

    return (
      <div ref={(element) => void ((source = element), (target.current = element))} style={{ width: 200, height: 100 }}>
        <Canvas eventSource={target} eventPrefix="client" onCreated={(created) => void (state = created)}>
          <mesh onClick={() => clicks++}>
            <boxGeometry />
            <meshBasicMaterial />
          </mesh>
        </Canvas>
        <div id="cover" style={{ position: 'absolute', left: 95, top: 45, width: 10, height: 10 }} />
      </div>
    );
  }

  dom.render(<App />);
  await vi.waitFor(() => expect(state?.get().events.connected).toBeDefined(), { timeout: 5000 });
  expect(state!.get().events.connected).toBe(source);

  // The cover sits over the box in the middle; its own offsetX and offsetY, about 5, point at the
  // canvas's top-left corner, where nothing is. Only the client pair puts the ray through the box.
  click(document.getElementById('cover')!, 100, 50);
  await vi.waitFor(() => expect(clicks).toBe(1));

  click(source!, 5, 5);
  expect(clicks).toBe(1);

  dom.unmount();
  host.remove();
});
