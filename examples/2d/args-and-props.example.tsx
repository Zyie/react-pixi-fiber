// #region result
import { Canvas } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/threejs-compat';
// #endregion result

import type { Example } from '../example';

// #region result
function Labels() {
  return (
    <>
      {/* #region args */}
      <text2D args={[{ text: 'From args', style: { fill: 'white', fontSize: 32 } }]} x={20} y={20} />
      {/* #endregion args */}
      {/* #region props */}
      <text2D text="From props" style={{ fill: 'white', fontSize: 32 }} anchor={[1, 0]} position={[380, 80]} />
      {/* #endregion props */}
      {/* #region pierce */}
      <text2D text="Pierced" style={{ fontSize: 32 }} style-fill="hotpink" scale-x={1.5} x={20} y={140} angle={-8} />
      {/* #endregion pierce */}
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Labels />
    </Canvas>
  );
}
// #endregion result

/** Three texts: one built from args, one set by props and anchored right, one with a pierced fill */
export const example: Example = {
  title: 'Arguments, props and piercing on 2D elements',
  render: () => <Labels />,
};
