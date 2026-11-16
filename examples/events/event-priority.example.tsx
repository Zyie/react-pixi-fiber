// #region result
import { Canvas, createPortal } from '@react-fiber/threejs-compat';
import { useState } from 'react';
import type { ElementRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region portal
function Hud() {
  const [layer, setLayer] = useState<ElementRef<'group'> | null>(null);
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <group ref={setLayer} />
      {layer &&
        createPortal(
          <mesh
            position={[0.6, 0.4, -2]}
            onClick={(e) => {
              e.stopPropagation();
              setClicks((count) => count + 1);
            }}
          >
            <boxGeometry args={[2.2, 2.2, 0.1]} />
            <meshBasicMaterial color={clicks % 2 ? 'royalblue' : 'midnightblue'} />
          </mesh>,
          layer,
          { events: { priority: 2 } },
        )}
    </>
  );
}
// #endregion portal

function Box() {
  const [active, setActive] = useState(false);

  return (
    <mesh
      name="box"
      onClick={(e) => {
        e.stopPropagation();
        setActive(!active);
      }}
    >
      <boxGeometry />
      <meshBasicMaterial color={active ? 'white' : 'red'} />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <Hud />
      <Box />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's EventPriority demo, cut to its core: a plate behind a box, rendered through a portal whose
 * event layer has priority 2, takes a click where the two overlap, though it is farther away, and
 * stops it there; the red box in front never hears of it. The plate has been clicked once and is
 * royal blue. The demo's drei `Hud`, glTF duck, orbit controls and view cubes are left out.
 */
export const example: Example = {
  title: 'Event priority',
  render: () => (
    <>
      <Hud />
      <Box />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(215, 135);
    await frames();
  },
};
