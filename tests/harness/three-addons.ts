/**
 * What `react-pixi-fiber/addons` resolves to on three.js: three's own addons under the names
 * `src/addons` exports, so a scene that imports an addon renders through real three.js too. Every
 * value `src/addons` exports has its line here; add one with any new addon, and its file to the
 * pre-bundled list in `vitest.config.ts` and `playground/vite.config.ts`.
 */
export { MapControls } from 'three/addons/controls/MapControls.js';
export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
export { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
export { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
