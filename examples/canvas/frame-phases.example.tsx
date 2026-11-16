// #region phases
import { useFrame } from '@react-fiber/threejs-compat';
import { MathUtils } from '@react-fiber/threejs-compat/three';
import type { Group } from '@react-fiber/threejs-compat/three';
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
// #endregion phases

import type { Example } from '../example';

const ORBIT_RADIUS = 4.5;
const ORBIT_SPEED = 2.4;
const CAMERA_DISTANCE = 3.8;
const CAMERA_HEIGHT = 2.2;

function place(target: Group, angle: number) {
  target.position.set(Math.cos(angle) * ORBIT_RADIUS, 0.35, Math.sin(angle) * ORBIT_RADIUS);
  target.rotation.y = -angle;
}

// #region phases
function useFollowCamera(target: RefObject<Group>) {
  const physics = useRef({ previous: 0, current: 0 });
  const { scheduler } = useFrame();

  useLayoutEffect(() => {
    if (!scheduler.hasPhase('camera')) scheduler.addPhase('camera', { after: 'update', before: 'render' });
    scheduler.setPhaseTimestep('physics', 1 / 15);
    return () => scheduler.setPhaseTimestep('physics', 1 / 60);
  }, [scheduler]);

  useFrame(
    ({ elapsed }) => {
      physics.current.previous = physics.current.current;
      physics.current.current = elapsed * ORBIT_SPEED;
      place(target.current, physics.current.current);
    },
    { phase: 'physics' },
  );

  useFrame(
    ({ overstep }) => {
      const { previous, current } = physics.current;
      place(target.current, MathUtils.lerp(previous, current, overstep));
    },
    { phase: 'update' },
  );

  useFrame(
    ({ camera }) => {
      const { x, z } = target.current.position;
      const angle = -target.current.rotation.y;
      camera.position.set(x + Math.sin(angle) * CAMERA_DISTANCE, CAMERA_HEIGHT, z - Math.cos(angle) * CAMERA_DISTANCE);
      camera.lookAt(x, 0.35, z);
    },
    { phase: 'camera' },
  );
}
// #endregion phases

function FollowCamera() {
  const target = useRef<Group>(null!);
  useFollowCamera(target);

  return (
    <>
      <group ref={target} position={[ORBIT_RADIUS, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.58, 0.34, 0.9]} />
          <meshStandardMaterial color="hotpink" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.55]}>
          <boxGeometry args={[0.3, 0.2, 0.2]} />
          <meshStandardMaterial color="peachpuff" />
        </mesh>
      </group>
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        const radius = index % 2 ? 5.45 : 3.55;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, 0.18, Math.sin(angle) * radius]}>
            <boxGeometry args={[0.09, 0.36, 0.09]} />
            <meshBasicMaterial color={index % 2 ? 'lightblue' : 'lightpink'} />
          </mesh>
        );
      })}
      <mesh receiveShadow position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f3f0f7" roughness={1} />
      </mesh>
    </>
  );
}

/**
 * r3f's UseFramePhases demo: a car orbits a track, stepped at 15 Hz in the `physics` phase and smoothed
 * in `update`, and a follow camera in a `camera` phase of its own runs after the smoothing, so it trails
 * the car without stutter
 */
export const example: Example = {
  title: 'A follow camera in a phase of its own',
  frames: 40,
  camera: { position: [ORBIT_RADIUS, CAMERA_HEIGHT, -CAMERA_DISTANCE], fov: 50 },
  canvas: { renderer: { shadows: true } },
  render: () => (
    <>
      <color attach="background" args={['#f3f0f7']} />
      <fog attach="fog" args={['#f3f0f7', 8, 18]} />
      <ambientLight intensity={Math.PI * 0.65} />
      <directionalLight castShadow position={[4, 8, 2]} intensity={Math.PI} />
      <FollowCamera />
    </>
  ),
};
