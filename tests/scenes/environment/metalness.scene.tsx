import { Environment } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

import { CUBE_FACES } from './faces';

const METALNESS = [0, 0.25, 0.5, 0.75, 1];

/**
 * White spheres from dielectric (left) to metal (right) in steps of a quarter, at roughness 0.4, lit only
 * by an environment from six images. The ends match three's picture; the spheres between them measure
 * how pixi-3d's image-based lighting splits light between diffuse and specular on partial metal.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7], fov: 40 },
  // three r187 lights partial metal by mixing two lobes, a dielectric one (F0 0.04) and a metallic one
  // (F0 the colour), by metalness, and takes the diffuse light's share from the dielectric lobe alone.
  // pixi-3d mixes F0 first and takes the diffuse share from that blended lobe (its iblBit), so a sphere of
  // metalness 0.5 keeps about half the diffuse light three's does and comes out up to a fifth darker
  // (grey 110 against 138 on its lower half). Metalness 0 and 1 match.
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
  render: () => (
    <>
      <Environment files={CUBE_FACES} path="/environment/cube/" />
      {METALNESS.map((metalness, index) => (
        <mesh key={metalness} position={[(index - 2) * 1.1, 0, 0]}>
          <sphereGeometry args={[0.5, 48, 24]} />
          <meshStandardMaterial color="#ffffff" metalness={metalness} roughness={0.4} />
        </mesh>
      ))}
    </>
  ),
};
