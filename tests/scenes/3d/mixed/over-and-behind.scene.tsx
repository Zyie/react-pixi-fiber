import type { TestScene } from '@test-scene';

/**
 * 2D on both sides of @pixi/3d's 3D, without threejs-compat. Blue stripes with `zIndex={-1}` draw behind
 * the 3D, so the lit green cube covers them; an orange card at the default zIndex draws over the cube's
 * lower right corner. Both are in CSS pixels from the canvas's top-left corner.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <mesh3D angle={[30, 40, 0]}>
        <cubeGeometry3D args={[{ width: 2, height: 2, depth: 2 }]} />
        <phongMaterial3D baseColor="#5ec27a" />
      </mesh3D>
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
