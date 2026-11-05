/**
 * What `react-pixi-fiber/addons` resolves to on three.js: three's own addons under the names
 * `src/addons` exports, so a scene that imports an addon renders through real three.js too. It may name
 * more than `src/addons` exports so far, since scenes are type-checked against `src/addons`; the two
 * below are the ones the feature areas add (`src/addons/loaders`, `src/addons/controls`). Add a line for
 * any other addon.
 */
export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { MapControls } from 'three/addons/controls/MapControls.js';
