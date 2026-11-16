// #region result
import { Canvas } from '@react-fiber/threejs-compat';
// #endregion result

import type { Example } from '../example';

// #region result
function Logger() {
  return (
    // #region handlers
    <mesh
      onClick={() => console.log('click')}
      onContextMenu={() => console.log('context menu')}
      onDoubleClick={() => console.log('double click')}
      onWheel={() => console.log('wheel spins')}
      onPointerUp={() => console.log('up')}
      onPointerDown={() => console.log('down')}
      onPointerOver={() => console.log('over')}
      onPointerOut={() => console.log('out')}
      onPointerEnter={() => console.log('enter')}
      onPointerLeave={() => console.log('leave')}
      onPointerMove={() => console.log('move')}
      onPointerMissed={() => console.log('missed')}
    >
      <boxGeometry />
      <meshPhongMaterial color="royalblue" />
    </mesh>
    // #endregion handlers
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Logger />
    </Canvas>
  );
}
// #endregion result

/** A box that logs every pointer event it gets; open the console and move, click and scroll over it */
export const example: Example = {
  title: 'Every pointer event',
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Logger />
    </>
  ),
};
