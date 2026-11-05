import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

/** A point light whose colour is set after it mounts, through three's `Color` methods */
function SetColor({ x, apply }: { x: number; apply: (light: ElementRef<'pointLight'>) => void }) {
  const light = useRef<ElementRef<'pointLight'>>(null);

  useLayoutEffect(() => {
    apply(light.current!);
  }, [apply]);

  return <pointLight ref={light} position={[x, 1, 0]} intensity={4} distance={2.4} />;
}

/**
 * A light's `color` is a three `Color`: four point lights each light a pool on a white floor, coloured
 * through `args` (red), `color-g` piercing on a black light (green), `color.set('royalblue')` and
 * `color.setHSL(0.13, 1, 0.5)` (amber). The ambient light's colour is set with `color="#202040"`, a dim
 * blue over the whole floor.
 */
export const scene: TestScene = {
  camera: { position: [0, 6, 4] },
  render: () => (
    <>
      <ambientLight color="#202040" intensity={0.6} />
      <pointLight position={[-3, 1, 0]} args={['red', 4, 2.4]} />
      <pointLight position={[-1, 1, 0]} color="black" color-g={1} intensity={4} distance={2.4} />
      <SetColor x={1} apply={(light) => light.color.set('royalblue')} />
      <SetColor x={3} apply={(light) => light.color.setHSL(0.13, 1, 0.5)} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </>
  ),
};
