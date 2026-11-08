import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';

/**
 * 2D on both sides of a lit 3D box. A blue gradient of stripes with `zIndex={-1}` draws behind the 3D,
 * so the green box covers it; an orange card at the default zIndex draws over the box's lower right
 * corner. Both are in CSS pixels from the canvas's top-left corner, and the box is in the middle of the
 * canvas as r3f's default camera sees it.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} />
      <mesh rotation={[0.5, 0.7, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#5ec27a" />
      </mesh>
      <graphics2D
        zIndex={-1}
        draw={(graphics) => {
          for (let i = 0; i < 8; i++)
            graphics.rect(0, i * 38, 400, 38).fill({ r: 20, g: 40 + i * 20, b: 120 + i * 16 });
        }}
      />
      <graphics2D x={230} y={170} draw={(graphics) => graphics.roundRect(0, 0, 140, 90, 10).fill(0xf28c28)} />
    </>
  ),
};
