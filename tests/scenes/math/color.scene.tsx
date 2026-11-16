import { Color, SRGBColorSpace } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

type Material = ElementRef<'meshStandardMaterial'>;

const FROM = new Color('royalblue');
const TO = new Color('orange');
const STEPS = [0, 0.25, 0.5, 0.75, 1];

function Box({ position, children }: { position: [number, number, number]; children: React.ReactNode }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      {children}
    </mesh>
  );
}

/** Colours set on a material after it mounts, through its `color` and `emissive` */
function Imperative() {
  const hsl = useRef<Material>(null);
  const hex = useRef<Material>(null);
  const linear = useRef<Material>(null);
  const glow = useRef<Material>(null);

  useLayoutEffect(() => {
    hsl.current!.color.setHSL(0.83, 0.6, 0.55);
    hex.current!.color.setHex(new Color('teal').getHex()).multiplyScalar(1.5);
    linear.current!.color.setRGB(0.9, 0.3, 0.3, SRGBColorSpace).convertSRGBToLinear();
    glow.current!.emissive.set('#ff5500');
    glow.current!.emissiveIntensity = 0.7;
  }, []);

  return (
    <>
      <Box position={[-1.8, -0.9, 0]}>
        <meshStandardMaterial ref={hsl} />
      </Box>
      <Box position={[-0.6, -0.9, 0]}>
        <meshStandardMaterial ref={hex} />
      </Box>
      <Box position={[0.6, -0.9, 0]}>
        <meshStandardMaterial ref={linear} />
      </Box>
      <Box position={[1.8, -0.9, 0]}>
        <meshStandardMaterial ref={glow} color="#202020" />
      </Box>
    </>
  );
}

/**
 * three's `Color` on materials and the background, in three's colour management: the top row lerps
 * royal blue to orange in linear light (`color={FROM.clone().lerp(TO, t)}`); the middle row sets red
 * with `color-r={1}`, linear `[r, g, b]`, a CSS string and an sRGB hex number; the bottom row sets
 * `setHSL`, `setHex` then `multiplyScalar`, `setRGB` in sRGB then `convertSRGBToLinear`, and an orange
 * `emissive` on a dark box. The background is `<color attach="background">`.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <color attach="background" args={['#1d2433']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[1, 2, 5]} intensity={1.6} />
      {STEPS.map((t, i) => (
        <Box key={t} position={[i * 1 - 2, 1.1, 0]}>
          <meshStandardMaterial color={FROM.clone().lerp(TO, t)} />
        </Box>
      ))}
      <Box position={[-1.8, 0.1, 0]}>
        <meshStandardMaterial color="#204060" color-r={1} />
      </Box>
      <Box position={[-0.6, 0.1, 0]}>
        <meshStandardMaterial color={[0.1, 0.5, 0.2]} />
      </Box>
      <Box position={[0.6, 0.1, 0]}>
        <meshStandardMaterial color="hsl(200, 70%, 60%)" />
      </Box>
      <Box position={[1.8, 0.1, 0]}>
        <meshStandardMaterial color={0xd4a017} />
      </Box>
      <Imperative />
    </>
  ),
};
