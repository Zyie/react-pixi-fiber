// #region result
import { Canvas, RenderTexture2D, useThree } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/threejs-compat';
import type { ThreeEvent2D } from '@react-fiber/core';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region ui
function Counter() {
  const { width, height } = useThree((state) => state.size);
  const [count, setCount] = useState(0);

  return (
    <>
      <graphics2D draw={(graphics) => graphics.rect(0, 0, width, height).fill('#1d3557')} />
      <text2D text={`${count}`} x={width / 2} y={110} anchor={0.5} style={{ fill: 'white', fontSize: 96 }} />
      <container2D
        x={width / 2 - 80}
        y={190}
        cursor="pointer"
        onClick={(event: ThreeEvent2D<MouseEvent>) => {
          event.stopPropagation();
          setCount((value) => value + 1);
        }}
      >
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 160, 50, 10).fill('#e63946')} />
        <text2D text="+1" x={80} y={25} anchor={0.5} style={{ fill: 'white', fontSize: 28 }} />
      </container2D>
    </>
  );
}
// #endregion ui

// #region screen
function Monitor() {
  return (
    <group rotation={[-0.15, -0.45, 0]}>
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[3.3, 2.6, 0.12]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh>
        <planeGeometry args={[3, 2.3]} />
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture2D width={384} height={294}>
            <Counter />
          </RenderTexture2D>
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}
// #endregion screen

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Monitor />
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

/** A monitor in 3D whose screen is a 2D counter drawn into a texture; its +1 button was clicked three times on the screen */
export const example: Example = {
  title: 'A 2D UI on a 3D screen',
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await frames();
    for (let i = 0; i < 3; i++) {
      await mouse.click(200, 184);
      await frames();
    }
    await frames();
  },
};
