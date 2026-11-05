// #region result
import { Canvas, extend, useThree } from 'react-pixi-fiber';
import type { ThreeElement } from 'react-pixi-fiber';
import { MapControls } from 'react-pixi-fiber/addons';

extend({ MapControls });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    mapControls: ThreeElement<typeof MapControls>;
  }
}
// #endregion result

import type { Example } from '../example';

// #region result
function Controls() {
  const { camera, renderer } = useThree();
  return <mapControls args={[camera, renderer.domElement]} />;
}

function City() {
  const blocks = [];
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      const height = 0.3 + ((x * 7 + z * 13 + 49) % 5) * 0.35;
      blocks.push(
        <mesh key={`${x}:${z}`} position={[x * 1.2, height / 2, z * 1.2]}>
          <boxGeometry args={[0.8, height, 0.8]} />
          <meshStandardMaterial color={(x + z) % 2 === 0 ? '#adb5bd' : '#6c757d'} />
        </mesh>,
      );
    }
  }
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 3]} intensity={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#495057" />
      </mesh>
      {blocks}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 8, 6] }}>
      <City />
      <Controls />
    </Canvas>
  );
}
// #endregion result

/** `<mapControls>`: a left drag pans across the blocks, keeping the point under the pointer under it */
export const example: Example = {
  title: 'Map controls',
  camera: { position: [0, 8, 6] },
  render: () => (
    <>
      <City />
      <Controls />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    await mouse.down();
    for (let step = 1; step <= 4; step++) await mouse.move(200 - step * 15, 150 - step * 8);
    await mouse.up();
    await frames();
  },
};
