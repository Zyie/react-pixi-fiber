import type { TestScene } from '@test-scene';
import { useMemo } from 'react';
import { useLoader } from 'react-pixi-fiber';
import { RepeatWrapping, TextureLoader } from 'react-pixi-fiber/three';
import type { Texture } from 'react-pixi-fiber/three';

function Panel({ position, setup }: { position: [number, number, number]; setup: (texture: Texture) => void }) {
  const source = useLoader(TextureLoader, '/textures/checker.png?transform');
  const texture = useMemo(() => {
    const copy = source.clone();

    copy.wrapS = copy.wrapT = RepeatWrapping;
    setup(copy);

    return copy;
  }, [source, setup]);

  return (
    <mesh position={position}>
      <planeGeometry args={[1.7, 1.7]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

const shifted = (texture: Texture): void => void texture.offset.set(0.25, 0.125);
const turned = (texture: Texture): void => {
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI / 6;
};
const scaled = (texture: Texture): void => {
  texture.repeat.set(1.5, 0.75);
  texture.offset.set(0.1, 0.2);
  texture.center.set(0.5, 0.5);
  texture.rotation = -Math.PI / 5;
};
const unflipped = (texture: Texture): void => {
  texture.flipY = false;
};

/**
 * Four clones of the checker, whose red cell marks its top left, each moved on the surface: an
 * offset (top left), a turn around the middle (top right), repeat, offset and turn together (bottom
 * left), and `flipY` off, which turns the image upside down as three's upload does (bottom right).
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Panel position={[-1, 1, 0]} setup={shifted} />
      <Panel position={[1, 1, 0]} setup={turned} />
      <Panel position={[-1, -1, 0]} setup={scaled} />
      <Panel position={[1, -1, 0]} setup={unflipped} />
    </>
  ),
};
