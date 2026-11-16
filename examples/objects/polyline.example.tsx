import { Canvas } from '@react-fiber/threejs-compat';
import type { ThreeEvent } from '@react-fiber/threejs-compat';
import { BufferGeometry, Vector3 } from '@react-fiber/threejs-compat/three';
// #region result
import { useMemo, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
type Point = [number, number, number];

function PolyLine({ defaultStart, defaultEnd }: { defaultStart: Point; defaultEnd: Point }) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const geometry = useMemo(
    () => new BufferGeometry().setFromPoints([new Vector3(...start), new Vector3(...end)]),
    [start, end],
  );

  return (
    <>
      <threeLine geometry={geometry}>
        <lineBasicMaterial color="lightgray" />
      </threeLine>
      <EndPoint position={start} onDrag={setStart} />
      <EndPoint position={end} onDrag={setEnd} />
    </>
  );
}

function EndPoint({ position, onDrag }: { position: Point; onDrag: (position: Point) => void }) {
  const [active, setActive] = useState(false);
  const [hovered, setHover] = useState(false);

  return (
    <mesh
      position={position}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setActive(true);
      }}
      onPointerUp={() => setActive(false)}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        if (active) onDrag([event.unprojectedPoint.x, event.unprojectedPoint.y, 0]);
      }}
    >
      <sphereGeometry args={[10, 16, 16]} />
      <meshBasicMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

function Lines() {
  return (
    <>
      <PolyLine defaultStart={[-100, -100, 0]} defaultEnd={[0, 100, 0]} />
      <PolyLine defaultStart={[0, 100, 0]} defaultEnd={[100, -100, 0]} />
    </>
  );
}

export function App() {
  return (
    <Canvas orthographic raycaster={{ params: { Line: { threshold: 5 } } }} camera={{ position: [0, 0, 500], zoom: 1 }}>
      <Lines />
    </Canvas>
  );
}
// #endregion result

/** r3f's legacy Lines demo with a `<threeLine>` in place of drei's `Line`: drag the end points */
export const example: Example = {
  title: 'Draggable lines',
  canvas: { orthographic: true },
  camera: { position: [0, 0, 500], zoom: 1 },
  render: () => <Lines />,
  // WebGPU rasterises 1 pixel lines by its own rule, a pixel over from WebGL's and three's along much of
  // each line, and the lines are most of what this example draws; WebGL matches at 0.0%.
  parity: { maxDiff: 0.22 },
};
