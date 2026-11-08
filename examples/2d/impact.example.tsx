// #region result
import { Texture } from 'pixi.js';
import type { BlurFilter, Container, DisplacementFilter, Sprite } from 'pixi.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, Layer3D, useFrame, useThree } from 'react-pixi-fiber';
import type { ThreeEvent2D } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
/** A displacement map: neutral grey with a ring that pushes pixels out on one side and in on the other */
function ringTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const ring = context.createRadialGradient(128, 128, 40, 128, 128, 126);
  ring.addColorStop(0, 'rgb(128, 128, 128)');
  ring.addColorStop(0.55, 'rgb(255, 255, 128)');
  ring.addColorStop(0.8, 'rgb(0, 0, 128)');
  ring.addColorStop(1, 'rgb(128, 128, 128)');
  context.fillStyle = ring;
  context.fillRect(0, 0, 256, 256);
  return Texture.from(canvas);
}

function Boxes() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      {[-1.6, 0, 1.6].map((x, i) => (
        <mesh key={x} position={[x, 0.3, 0]} rotation={[0.5, 0.6 + i, 0]}>
          <boxGeometry />
          <meshStandardMaterial color={['#e76f51', '#2a9d8f', '#e9c46a'][i]} />
        </mesh>
      ))}
    </>
  );
}

// #region impact
function Impact() {
  const { width, height } = useThree((state) => state.size);
  const layer = useRef<Container>(null);
  const blur = useRef<BlurFilter>(null);
  const wave = useRef<DisplacementFilter>(null);
  const [ring, setRing] = useState<Sprite | null>(null);
  const texture = useMemo(() => ringTexture(), []);
  const hit = useRef({ pending: false, at: -Infinity });

  useEffect(() => () => texture.destroy(true), [texture]);

  useFrame(({ elapsed }) => {
    if (hit.current.pending) hit.current = { pending: false, at: elapsed };
    const age = elapsed - hit.current.at;
    const trauma = Math.max(0, 1 - age / 0.6);
    layer.current!.position.set(Math.sin(elapsed * 70) * 12 * trauma, Math.cos(elapsed * 55) * 8 * trauma);
    blur.current!.enabled = trauma > 0;
    blur.current!.strength = 4 * trauma;
    if (ring && wave.current) {
      ring.scale.set(0.4 + age * 5);
      wave.current.enabled = trauma > 0;
      wave.current.scale.set(35 * trauma);
    }
  });

  return (
    <>
      <Layer3D ref={layer}>
        <blurFilter2D ref={blur} attach="filters-0" strength={0} enabled={false} />
        {ring && <displacementFilter2D ref={wave} attach="filters-1" args={[{ sprite: ring, scale: 0 }]} />}
        <sprite2D ref={setRing} texture={texture} anchor={0.5} x={width / 2} y={height / 2} />
      </Layer3D>
      <container2D
        x={width / 2 - 50}
        y={height - 60}
        cursor="pointer"
        onClick={(event: ThreeEvent2D<MouseEvent>) => {
          event.stopPropagation();
          hit.current.pending = true;
        }}
      >
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 100, 40, 8).fill('#e63946')} />
        <text2D text="HIT" x={50} y={20} anchor={0.5} style={{ fill: 'white', fontSize: 20, fontWeight: 'bold' }} />
      </container2D>
    </>
  );
}
// #endregion impact

export function App() {
  return (
    <Canvas>
      <Boxes />
      <Impact />
    </Canvas>
  );
}
// #endregion result

/**
 * Three boxes, and a HIT button over them that shakes the 3D layer, blurs it and sends a displacement
 * ring out from the middle; caught a fifth of a second after the hit, the 3D is shaken, blurred and
 * warped while the button stays sharp
 */
export const example: Example = {
  title: 'Screen shake, blur and a shockwave on the 3D layer',
  render: () => (
    <>
      <Boxes />
      <Impact />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 260);
    await frames(12);
  },
};
