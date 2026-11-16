import { useFrame } from '@react-fiber/threejs-compat';
import { MathUtils } from '@react-fiber/threejs-compat/three';
import type { Mesh } from '@react-fiber/threejs-compat/three';
// #region simulation
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
// #endregion simulation

import type { Example } from '../example';

const GRAVITY = -9.8;
const RADIUS = 0.16;
const HALF_WIDTH = 1.6;
const COLORS = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff'];

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const initialBodies = (): Body[] =>
  COLORS.map((_, i) => ({ x: -1.2 + i * 0.6, y: 0.5 + i * 0.35, vx: 2.4 - i * 1.1, vy: 1 + i * 0.6 }));

function step(bodies: Body[], dt: number) {
  for (const body of bodies) {
    body.vy += GRAVITY * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    const wall = HALF_WIDTH - RADIUS;
    if (Math.abs(body.x) > wall) {
      body.x = Math.sign(body.x) * wall;
      body.vx = -body.vx;
    }
    if (body.y < RADIUS) {
      body.y = RADIUS;
      body.vy = Math.abs(body.vy);
    }
  }
}

// #region simulation
function useSimulation(raw: RefObject<(Mesh | null)[]>, smooth: RefObject<(Mesh | null)[]>) {
  const sim = useRef({ previous: initialBodies(), current: initialBodies() });
  const { scheduler } = useFrame();

  useLayoutEffect(() => {
    scheduler.setPhaseTimestep('physics', 1 / 10);
    return () => scheduler.setPhaseTimestep('physics', 1 / 60);
  }, [scheduler]);

  useFrame(
    (_, dt) => {
      sim.current.previous = sim.current.current.map((body) => ({ ...body }));
      step(sim.current.current, dt);
    },
    { phase: 'physics' },
  );

  useFrame(
    ({ overstep }) => {
      sim.current.current.forEach((body, i) => {
        const previous = sim.current.previous[i];
        raw.current[i]?.position.set(body.x, body.y, 0);
        smooth.current[i]?.position.set(
          MathUtils.lerp(previous.x, body.x, overstep),
          MathUtils.lerp(previous.y, body.y, overstep),
          0,
        );
      });
    },
    { phase: 'update' },
  );
}
// #endregion simulation

function Simulation() {
  const raw = useRef<(Mesh | null)[]>([]);
  const smooth = useRef<(Mesh | null)[]>([]);
  useSimulation(raw, smooth);

  return (
    <>
      {[
        { offset: -2.1, refs: raw },
        { offset: 2.1, refs: smooth },
      ].map(({ offset, refs }) => (
        <group key={offset} position={[offset, -1.5, 0]}>
          <mesh position={[0, 1.5, -RADIUS]}>
            <planeGeometry args={[HALF_WIDTH * 2, 3]} />
            <meshStandardMaterial color="#20232b" />
          </mesh>
          {COLORS.map((color, i) => (
            <mesh key={color} ref={(mesh) => void (refs.current[i] = mesh)}>
              <sphereGeometry args={[RADIUS, 24, 16]} />
              <meshStandardMaterial color={color} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/**
 * r3f's FixedTimestep demo: one simulation stepped at 10 Hz in the `physics` phase, drawn twice. The
 * left box shows each ball where the last step left it; the right box lerps between the last two steps
 * by `state.overstep`, so its balls are smooth at any display rate.
 */
export const example: Example = {
  title: 'A fixed timestep with interpolation',
  frames: 50,
  camera: { position: [0, 0, 7], fov: 50 },
  render: () => (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 5]} intensity={2.5} />
      <Simulation />
    </>
  ),
};
