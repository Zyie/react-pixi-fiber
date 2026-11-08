import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

/**
 * A 2D element inside a 3D object isn't supported yet: the `<sprite2D>` inside the mesh is left out with
 * a warning, and the 3D inside the `<container2D>` too, without a crash. The green box draws, and the
 * 2D square beside it, which is directly in the canvas, draws as usual.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <mesh rotation={[0.5, 0.7, 0]}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial color="#5ec27a" />
        <sprite2D texture={Texture.WHITE} tint="red" width={300} height={300} />
      </mesh>
      <container2D x={20} y={20}>
        <sprite2D texture={Texture.WHITE} tint="orange" width={60} height={60} />
        <mesh position={[2, 0, 0]}>
          <boxGeometry />
          <meshBasicMaterial color="red" />
        </mesh>
      </container2D>
    </>
  ),
};
