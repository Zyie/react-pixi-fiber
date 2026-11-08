/**
 * What a scene file imports, as `@test-scene`: its type and the constants it may need.
 *
 * The playground loads the scene files too, and a page can't load vitest. So nothing listed here, nor
 * anything those files import, imports vitest, and a scene imports the harness by no other name. The
 * tests get the same names from `@test-utils`, with the rest of the harness.
 */
export { FRAME_STEP, PIXI_ONLY, SCENE_BACKGROUND, SCENE_HEIGHT, SCENE_WIDTH } from './scene-constants';
export type { SceneInput, SceneMouse } from './scene-input';
export type { RendererType, SceneParity, SceneSkip, TestScene } from './scene-runner';
