import { useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import type { TestScene } from '@test-scene';

function Model() {
  const { scene } = useLoader(GLTFLoader, '/models/extensions.glb?extensions');

  return <primitive object={scene} />;
}

/**
 * A model that uses glTF extensions: a warm `KHR_lights_punctual` spot light from above, its soft
 * edged pool of light on a grey floor, over a red box with a clear coat (`KHR_materials_clearcoat`)
 * and a dark blue box with a pink sheen (`KHR_materials_sheen`), under a dim ambient light
 */
export const scene: TestScene = {
  camera: { position: [0, 2.5, 5] },
  render: () => (
    <>
      <ambientLight intensity={0.3} />
      <Model />
    </>
  ),
  // The spot light and the clear-coated box match three.js. The sheen box doesn't, on two faces. Its
  // shaded side has no ambient sheen in pixi-3d (sheenBit adds sheen from lights and the environment
  // only). And its top, seen at a grazing angle, is darker: pixi-3d dims the whole surface under the
  // sheen by 1 - max(sheenColor) * E(N.V), its own fit of the sheen albedo, where three r187 dims each
  // light's share by 1 - max(sheenColor) * max(E(N.V), E(N.L)) from IBLSheenBRDF
  // (lights_physical_pars_fragment). With the ambient light off, only the top differs.
  parity: { maxDiff: 0.035 },
};
