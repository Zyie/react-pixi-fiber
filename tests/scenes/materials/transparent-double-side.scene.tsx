import type { TestScene } from '@test-scene';
import { DoubleSide } from 'react-pixi-fiber/three';

/**
 * r3f's AutoNeedsUpdate shell: a sphere with a quarter cut away, transparent and drawn on both sides,
 * around an orange torus knot. Through the cut its inside shows, and the knot shows through it.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <mesh rotation-y={Math.PI * 0.75 - 0.5}>
        <sphereGeometry args={[1.4, 18, 12, 0, Math.PI * 1.5]} />
        <meshStandardMaterial color="#4aa3df" roughness={0.5} transparent opacity={0.6} side={DoubleSide} />
      </mesh>
      <mesh>
        <torusKnotGeometry args={[0.45, 0.14, 128, 16]} />
        <meshStandardMaterial color="#ff9f1c" roughness={0.3} />
      </mesh>
    </>
  ),
  // three r187 draws a transparent DoubleSide mesh in two passes, its back faces then its front faces
  // (WebGLRenderer's renderObject), so the far wall always lies under the near one. pixi-3d draws it in one pass, in triangle order, so where a back face comes after a front
  // face in the index buffer it blends over it, and streaks the shell. With forceSinglePass on, three
  // draws one pass too, and the pictures match (0.0% on WebGL, 0.8% on WebGPU).
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
};
