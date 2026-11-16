import { useTexture } from '@react-fiber/threejs-compat';
import { LinearFilter } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

function Maps() {
  const textures = useTexture([
    '/textures/normal-domes.png?standard-maps',
    '/textures/alpha-ramp.png?standard-maps',
    '/textures/uv-checker.png?standard-maps',
  ]);
  for (const texture of textures) Object.assign(texture, { generateMipmaps: false, minFilter: LinearFilter });
  const [normal, ramp, checker] = textures;
  const position = (index: number): [number, number, number] => [((index % 3) - 1) * 2.3, index < 3 ? 1.1 : -1.1, 0];

  return (
    <>
      <mesh position={position(0)} rotation={[0.3, 0.4, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#9fb7c9" roughness={0.4} normalMap={normal} />
      </mesh>
      <mesh position={position(1)} rotation={[0.3, 0.4, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#9fb7c9" roughness={0.4} normalMap={normal} normalScale={[0.4, 0.4]} />
      </mesh>
      <mesh position={position(2)}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#d9a441" metalness={1} roughness={0.2} roughnessMap={ramp} />
      </mesh>
      <mesh position={position(3)}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#d9a441" metalness={1} roughness={0.35} metalnessMap={ramp} />
      </mesh>
      <mesh position={position(4)}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#e8e8e8" aoMap={ramp} aoMapIntensity={0.8} />
      </mesh>
      <mesh position={position(5)}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#202020" emissive="#ffffff" emissiveIntensity={0.8} emissiveMap={checker} />
      </mesh>
    </>
  );
}

/**
 * The standard material's maps. Top: a normal map of domes on a box, then at `normalScale` 0.4, and
 * a metal plane whose `roughnessMap` (a ramp, dark to light left to right) smooths its left side.
 * Bottom: a plane whose `metalnessMap` ramp makes its right side metal, one darkened by an `aoMap`
 * ramp at `aoMapIntensity` 0.8 under strong ambient light, and one glowing through an `emissiveMap`.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7] },
  render: () => (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 3, 4]} intensity={2.5} />
      <Maps />
    </>
  ),
};
