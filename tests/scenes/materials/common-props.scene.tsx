import { useTexture } from '@react-fiber/threejs-compat';
import { AdditiveBlending, BackSide, DoubleSide, FrontSide, LinearFilter } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

const SIDES = [FrontSide, BackSide, DoubleSide];

function Props() {
  const [checker, ramp] = useTexture([
    '/textures/uv-checker.png?common-props',
    '/textures/alpha-ramp.png?common-props',
  ]);
  Object.assign(checker, { generateMipmaps: false, minFilter: LinearFilter });
  Object.assign(ramp, { generateMipmaps: false, minFilter: LinearFilter });

  return (
    <>
      {SIDES.map((side, index) => (
        <mesh key={side} position={[(index - 1) * 1.9 - 2.6, 1.3, 0]} rotation={[0.2, 2.2, 0]}>
          <sphereGeometry args={[0.75, 32, 16, 0, Math.PI * 1.4]} />
          <meshStandardMaterial color="#5b8def" side={side} />
        </mesh>
      ))}

      <mesh position={[2.9, 1.3, 0]} rotation={[0.4, 0.5, 0]}>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial color="#e8b04a" flatShading />
      </mesh>

      <mesh position={[-3.4, -1.3, -0.6]}>
        <boxGeometry args={[1.4, 1.4, 0.3]} />
        <meshStandardMaterial color="#3c3c46" />
      </mesh>
      <mesh position={[-3.0, -1.0, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial color="#ff4f6d" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-3.6, -1.5, 0.3]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial color="#4fd1ff" transparent opacity={0.5} depthWrite={false} />
      </mesh>

      <mesh position={[-0.9, -1.3, -0.4]}>
        <boxGeometry args={[1.3, 1.3, 0.3]} />
        <meshStandardMaterial color="#3c3c46" />
      </mesh>
      <mesh position={[-0.9, -1.3, 0.3]}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="#ff9b2e" transparent blending={AdditiveBlending} />
      </mesh>

      <mesh position={[1.1, -1.3, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={checker} alphaMap={ramp} alphaTest={0.5} side={DoubleSide} />
      </mesh>

      <mesh position={[3.2, -1.3, -0.5]}>
        <boxGeometry args={[1.2, 1.2, 0.3]} />
        <meshStandardMaterial color="#3c3c46" />
      </mesh>
      <mesh position={[3.2, -1.3, -1.2]}>
        <sphereGeometry args={[0.45, 32, 16]} />
        <meshBasicMaterial color="#7cff6b" transparent depthTest={false} />
      </mesh>
      <mesh position={[3.2, -1.3, 0.5]}>
        <sphereGeometry args={[0.3, 32, 16]} />
        <meshBasicMaterial color="white" visible={false} />
      </mesh>
    </>
  );
}

/**
 * three's common `Material` fields. Top row: a cut sphere drawn `FrontSide`, `BackSide` and
 * `DoubleSide`, then a faceted `flatShading` ball. Bottom row: two half-clear planes over a box (the
 * blue one without `depthWrite`), an `AdditiveBlending` disc, a plane cut by `alphaTest` through the
 * green channel of its `alphaMap` (a ramp, dark to light left to right), and a green ball drawn
 * through a box by `depthTest={false}`. The disc and the ball are `transparent`, so they draw after
 * the opaque objects on both renderers. A white
 * ball with `visible={false}` in front of the last box draws nothing.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 9] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      <Props />
    </>
  ),
};
