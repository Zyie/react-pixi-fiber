import type { TestScene } from '@test-scene';
import type { Spritesheet } from 'pixi.js';
import { useAsset, View3D } from 'react-pixi-fiber';

function Walker({ x = 0, y = 0 }: { x?: number; y?: number }) {
  const sheet = useAsset<Spritesheet>('/sprites/walk.json');

  return (
    <animatedSprite2D
      args={[sheet.animations.walk]}
      playing
      animationSpeed={1 / 6}
      x={x}
      y={y}
      scale={2}
      anchor={0.5}
    />
  );
}

/**
 * Animated sprites play on the root's clock wherever a bridge puts them. Thirteen frames give twelve
 * ticks at `animationSpeed` 1/6, two frames of the walk sheet, so every sprite shows its third frame,
 * the white bar three quarters of the way down:
 *
 * - top left, directly in the canvas, for comparison;
 * - on the left box, directly inside the mesh, which anchors it at the mesh's origin;
 * - on the right box, inside an `<anchor2D>` inside the mesh;
 * - bottom left, inside a `<View3D>`, whose portal advances it on the canvas's root.
 */
export const scene: TestScene = {
  frames: 13,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Walker x={40} y={40} />
      <mesh position={[-1.2, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#457b9d" />
        <Walker />
      </mesh>
      <mesh position={[1.2, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#e76f51" />
        <anchor2D>
          <Walker />
        </anchor2D>
      </mesh>
      <View3D x={10} y={200} width={90} height={90}>
        <color attach="background" args={['#1d3557']} />
        <Walker x={45} y={45} />
      </View3D>
    </>
  ),
};
