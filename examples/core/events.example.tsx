// #region result
import { Canvas, useThree } from '@react-fiber/core';
import type { FiberEvent2D } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region log
function useLog() {
  const [log, setLog] = useState<string[]>([]);

  return [log, (line: string) => setLog((lines) => [...lines.slice(-6), line])] as const;
}
// #endregion log

function Scene() {
  const { width, height } = useThree((state) => state.size);
  const [log, add] = useLog();

  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      {/* #region order */}
      <graphics2D
        zIndex={-1}
        draw={(graphics) => graphics.rect(0, 0, width, height).fill('#1d3557')}
        onClick={() => add('backdrop, behind the 3D')}
      />
      <mesh3D angle={[20, 30, 0]} onClick={() => add('cube, in the 3D')}>
        <cubeGeometry3D args={[{ width: 2, height: 2, depth: 2 }]} />
        <phongMaterial3D baseColor="#e9c46a" />
      </mesh3D>
      <container2D
        x={width / 2 + 20}
        y={height / 2 - 20}
        onClick={(event: FiberEvent2D<MouseEvent>) => add(`panel, over the 3D, at ${Math.round(event.local.x)}`)}
      >
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 120, 70, 10).fill({ color: '#e63946', alpha: 0.9 })} />
      </container2D>
      {/* #endregion order */}
      {/* #region stop */}
      <container2D x={16} y={height - 56}>
        <graphics2D
          draw={(graphics) => graphics.roundRect(0, 0, 110, 40, 8).fill('#2a9d8f')}
          onClick={(event: FiberEvent2D<MouseEvent>) => {
            event.stopPropagation();
            add('button, stopped');
          }}
        />
      </container2D>
      {/* #endregion stop */}
      {log.map((line, i) => (
        <text2D
          key={i}
          text={line}
          x={12}
          y={10 + i * 20}
          style={{ fill: 'white', fontSize: 15, fontFamily: 'Arial' }}
        />
      ))}
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

/**
 * A cube between a 2D backdrop and a red 2D panel, and four clicks, logged at the top left in the order
 * the handlers ran: on the panel where it covers the cube, which reaches the panel, the cube and the
 * backdrop; on the cube, which reaches the cube and the backdrop; on the backdrop alone; and on the
 * green button, which stops the click there
 */
export const example: Example = {
  title: 'Clicks across 2D and 3D',
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    for (const [x, y] of [
      [250, 150],
      [170, 160],
      [340, 260],
      [60, 264],
    ]) {
      await mouse.click(x!, y!);
      await frames();
    }
  },
};
