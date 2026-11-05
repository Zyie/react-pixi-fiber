// #region result
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, createPortal, useFrame, useRenderTarget, useThree } from 'react-pixi-fiber';
import type { ComputeFunction, ThreeElements } from 'react-pixi-fiber';
import { PerspectiveCamera, Scene } from 'react-pixi-fiber/three';
import type { Mesh } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Lights({ background }: { background: string }) {
  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
    </>
  );
}

function Bottle(props: ThreeElements['group']) {
  const [hovered, setHovered] = useState(false);
  return (
    <group {...props}>
      <mesh
        onPointerOver={(event) => (event.stopPropagation(), setHovered(true))}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.6, 1.4, 0.6]} />
        <meshStandardMaterial color={hovered ? '#e63946' : '#2a9d8f'} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.25, 24, 12]} />
        <meshStandardMaterial color="#f4a261" />
      </mesh>
    </group>
  );
}

// #region portal
function Portal({
  children,
  scale,
  ...props
}: { children: ReactNode; scale: [number, number, number] } & ThreeElements['mesh']) {
  const ref = useRef<Mesh>(null!);
  const fbo = useRenderTarget();
  const events = useThree((state) => state.events);
  const scene = useMemo(() => new Scene(), []);
  const [width, height] = scale;
  const camera = useMemo(() => new PerspectiveCamera(50, width / height, 0.1, 1000), [width, height]);

  useFrame((state) => {
    camera.position.copy(state.camera.position);
    camera.rotation.copy(state.camera.rotation);
    state.renderer.setRenderTarget(fbo);
    state.renderer.render(scene, camera);
    state.renderer.setRenderTarget(null);
  });

  const compute = useCallback<ComputeFunction>(
    (event, state, previous) => {
      if (!previous) return;
      if (!previous.raycaster.camera) previous.events.compute!(event, previous, previous.previousRoot?.getState());
      const [intersection] = previous.raycaster.intersectObject(ref.current);
      if (!intersection) return;
      const uv = intersection.uv!;
      state.raycaster.setFromCamera(state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1), camera);
    },
    [camera],
  );

  return (
    <>
      <mesh ref={ref} scale={scale} {...props}>
        <planeGeometry />
        <meshBasicMaterial map={fbo.texture} />
      </mesh>
      {/* oxlint-disable-next-line react/refs -- compute reads the ref on pointer events, after render */}
      {createPortal(children, scene, { camera, events: { compute, priority: events.priority - 1 } })}
    </>
  );
}
// #endregion portal

function Portals() {
  return (
    <group position={[0, -1, 0]}>
      <Lights background="#f0f0f0" />
      <Portal scale={[4, 3, 1]} position={[0, 2, 0]}>
        <Lights background="#bde0fe" />
        <Bottle scale={1.5} position={[1.5, -1, -1.5]} />
        <Portal scale={[3, 2, 1]} position={[-1, 0.2, -4]}>
          <Lights background="#ffc8dd" />
          <Bottle scale={2} position={[0, -1, -1.5]} />
        </Portal>
      </Portal>
      <Bottle position={[-2.4, 0.2, 2]} />
    </group>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 2, 7] }}>
      <Portals />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's Portals demo: each portal draws a scene of its own into a render target from a copy of the
 * default camera, and shows it on a plane. Its events raycast through the plane's `uv` into its scene,
 * so the bottle seen inside the first portal turns red under the pointer, while the one outside stays
 * teal. A second portal sits inside the first.
 */
export const example: Example = {
  title: 'Portals into scenes of their own',
  camera: { position: [0, 2, 7] },
  frames: 2,
  render: () => <Portals />,
  act: async ({ mouse, frames }) => {
    await mouse.move(225, 112);
    await frames(2);
  },
};
