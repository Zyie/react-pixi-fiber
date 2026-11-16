// #region result
import type { Mesh3D } from '@pixi/3d';
import { Canvas, useFrame, useThree } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import { useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Box({ onSpin }: { onSpin: (turns: number) => void }) {
  const mesh = useRef<Mesh3D>(null);

  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
    onSpin(mesh.current!.rotation.y / (Math.PI * 2));
  });

  return (
    <mesh3D ref={mesh} rotation-x={0.4}>
      <cubeGeometry3D args={[{ width: 2, height: 2, depth: 2 }]} />
      <phongMaterial3D baseColor="#5ec27a" />
    </mesh3D>
  );
}

// #region hud
function Hud({ turns }: { turns: number }) {
  const { width } = useThree((state) => state.size);

  return (
    <container2D x={width - 170} y={16}>
      <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 154, 44, 10).fill({ color: 'black', alpha: 0.6 })} />
      <text2D text={`${turns.toFixed(2)} turns`} x={14} y={10} style={{ fill: 'white', fontSize: 20 }} />
    </container2D>
  );
}
// #endregion hud

// #region backdrop
function Backdrop() {
  const { width, height } = useThree((state) => state.size);

  return (
    <graphics2D
      zIndex={-1}
      draw={(graphics) =>
        graphics.rect(0, 0, width, height).fill({ color: '#1d3557' }).circle(80, 230, 120).fill('#457b9d')
      }
    />
  );
}
// #endregion backdrop

function Scene() {
  const [turns, setTurns] = useState(0);

  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Box onSpin={setTurns} />
      <Backdrop />
      <Hud turns={turns} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/** A spinning box over a 2D backdrop drawn behind the 3D, with a 2D readout of its turns over it */
export const example: Example = {
  title: 'A 2D HUD over the 3D and a backdrop behind it',
  frames: 46,
  render: () => <Scene />,
};
