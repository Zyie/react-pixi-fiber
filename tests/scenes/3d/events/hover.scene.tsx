import type { HitVolume3DInput } from '@pixi/3d';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A sphere that is hot pink while hovered, purple once the pointer has left it, and grey before */
function HoverSphere({ x, hitVolume }: { x: number; hitVolume?: HitVolume3DInput }) {
  const [state, setState] = useState<'never' | 'over' | 'out'>('never');
  const color = { never: '#808080', over: '#ff69b4', out: '#7b3fa0' }[state];

  return (
    <mesh3D
      position={[x, 0, 0]}
      hitVolume={hitVolume ?? null}
      onPointerOver={() => setState('over')}
      onPointerOut={() => setState('out')}
    >
      <sphereGeometry3D args={[{ radius: 0.7 }]} />
      <flatMaterial3D baseColor={color} />
    </mesh3D>
  );
}

/**
 * Hover with @pixi/3d's hit volumes. The pointer moves over the top left corner of the left sphere's
 * bounding box, off the sphere itself, then over the same corner of the middle sphere, then onto the
 * right sphere. The left sphere is picked by its geometry's bounds, @pixi/3d's default, so it got
 * `onPointerOver` and then `onPointerOut`: purple. The middle one has `hitVolume="geometry"`, picked by
 * its triangles, so the corner missed it: grey. The pointer is on the right one: hot pink.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <HoverSphere x={-2} />
      <HoverSphere x={0} hitVolume="geometry" />
      <HoverSphere x={2} />
    </>
  ),
  // At z = 0 a unit is about 64 pixels; the corners are 0.62 units up and left of each centre.
  act: async ({ mouse, frames }) => {
    await mouse.move(200 - 2 * 64.3 - 40, 150 - 40);
    await frames();
    await mouse.move(200 - 40, 150 - 40);
    await frames();
    await mouse.move(200 + 2 * 64.3, 150);
    await frames();
  },
};
