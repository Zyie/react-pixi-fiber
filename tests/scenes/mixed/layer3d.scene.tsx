import { Layer3D } from '@react-fiber/core';
import type { TestScene } from '@test-scene';

const GREYSCALE = [0.3, 0.59, 0.11, 0, 0, 0.3, 0.59, 0.11, 0, 0, 0.3, 0.59, 0.11, 0, 0, 0, 0, 0, 1, 0] as const;

/**
 * The scene's 3D as a 2D node. `<Layer3D>` moves the 3D layer 60 pixels left, fades it to 85% and gives
 * it a greyscale `<colorMatrixFilter2D>`: the lit box and the tag anchored to it are grey, off centre,
 * and let the stripes behind show through a little. The 2D around it isn't in the layer, so it keeps its colours: the blue stripes behind the 3D
 * (`zIndex={-1}`) and the orange HUD panel over it.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} />
      <mesh rotation={[0.5, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#e63946" />
        <anchor2D point={[0, 1.4, 0]} center>
          <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 70, 24, 6).fill('#2a9d8f')} />
        </anchor2D>
      </mesh>
      <graphics2D
        zIndex={-1}
        draw={(graphics) => {
          for (let i = 0; i < 8; i++)
            graphics.rect(0, i * 38, 400, 38).fill({ r: 20, g: 40 + i * 20, b: 120 + i * 16 });
        }}
      />
      <graphics2D x={290} y={16} draw={(graphics) => graphics.roundRect(0, 0, 94, 40, 8).fill('#f28c28')} />
      <Layer3D x={-60} alpha={0.85}>
        <colorMatrixFilter2D attach="filters-0" matrix={[...GREYSCALE]} />
      </Layer3D>
    </>
  ),
};
