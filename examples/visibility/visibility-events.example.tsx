// #region events
import { useFrame } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
import { useRef, useState } from 'react';
// #endregion events

import type { Example } from '../example';

// #region events
function OrbitingSphere({ onFramed }: { onFramed: (inView: boolean) => void }) {
  const mesh = useRef<Mesh>(null!);

  useFrame(({ elapsed }) => {
    const angle = elapsed * 0.5;
    mesh.current.position.set(Math.cos(angle) * 10, Math.sin(angle) * 3, Math.sin(angle) * 10);
  });

  return (
    <mesh ref={mesh} onFramed={onFramed}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#38bdf8" />
    </mesh>
  );
}

function BlinkingCube({ onVisible }: { onVisible: (visible: boolean) => void }) {
  const [show, setShow] = useState(true);

  useFrame(({ elapsed }) => {
    const next = Math.floor(elapsed / 2.5) % 2 === 0;
    if (next !== show) setShow(next);
  });

  return (
    <mesh position={[2, -1, 0]} rotation={[0.4, 0.6, 0]} visible={show} onVisible={onVisible}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#fb7185" />
    </mesh>
  );
}
// #endregion events

/** A row of status lights: one per object, bright while it's in view or visible, dim while not */
function Status({ framed, visible }: { framed: boolean | null; visible: boolean | null }) {
  return (
    <>
      {[
        { on: framed, color: '#38bdf8', x: -0.4 },
        { on: visible, color: '#fb7185', x: 0.4 },
      ].map(({ on, color, x }) => (
        <mesh key={x} position={[x, 2.2, 0]}>
          <sphereGeometry args={[0.18, 24, 12]} />
          <meshBasicMaterial color={color} transparent opacity={on ? 1 : 0.2} />
        </mesh>
      ))}
    </>
  );
}

function Scene() {
  const [framed, setFramed] = useState<boolean | null>(null);
  const [visible, setVisible] = useState<boolean | null>(null);

  return (
    <>
      <ambientLight intensity={Math.PI * 0.5} />
      <directionalLight position={[0.32, 0.39, 0.7]} intensity={1} />
      <OrbitingSphere onFramed={setFramed} />
      <BlinkingCube onVisible={setVisible} />
      <Status framed={framed} visible={visible} />
    </>
  );
}

/**
 * r3f's VisibilityEvents demo without its occlusion half: a ball orbits in and out of view and reports
 * `onFramed`, a cube blinks and reports `onVisible`, and two status lights at the top show the latest
 * of each. pixi-3d has no occlusion queries, so the demo's `onOccluded` model is left out.
 */
export const example: Example = {
  title: 'Visibility events',
  frames: 20,
  camera: { position: [0, 0, 7], fov: 50, near: 0.01, far: 100 },
  render: () => (
    <>
      <color attach="background" args={['#0f172a']} />
      <Scene />
    </>
  ),
};
