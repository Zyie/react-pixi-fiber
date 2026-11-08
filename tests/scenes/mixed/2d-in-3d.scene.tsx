import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

/**
 * A 2D element directly inside a 3D object follows the object's origin on screen: the red square inside
 * the turned green box sits at the box's centre, the middle of the canvas, over the box. A 3D element
 * inside a 2D one is left out with a warning, without a crash: the `<container2D>` draws only its orange
 * square at the top left.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <mesh rotation={[0.5, 0.7, 0]}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial color="#5ec27a" />
        <sprite2D texture={Texture.WHITE} tint="red" width={30} height={30} anchor={0.5} />
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
