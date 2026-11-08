/**
 * What every scene starts from. The docs site reads these too, to show the examples as the visual tests
 * draw them.
 */

/** Width of a scene's canvas in CSS px unless its `size` says otherwise */
export const SCENE_WIDTH = 400;

/** Height of a scene's canvas in CSS px unless its `size` says otherwise */
export const SCENE_HEIGHT = 300;

/**
 * What shows behind a scene's canvas. Both three.js and this library clear to transparent, so the
 * page behind both is black and an empty canvas looks the same on every renderer.
 */
export const SCENE_BACKGROUND = '#000000';

/** Milliseconds of the scene's clock between two frames unless a call says otherwise: a sixtieth of a second */
export const FRAME_STEP = 1000 / 60;

/**
 * The largest share of drawn pixels, from 0 to 1, that may differ from three.js on a pixi-3d renderer
 * unless a scene sets `parity`
 */
export const DEFAULT_PARITY_MAX_DIFF = 0.02;

/** How many pixels of a scene may differ from its reference image unless it sets `pixelMatch` */
export const DEFAULT_PIXEL_MATCH = 16;

/**
 * What a scene or an example with pixi.js 2D in it spreads in: three.js has no 2D elements, so it skips
 * three.js and leaves the parity comparison out, and is held to its own WebGL and WebGPU references,
 * which have to agree with each other
 * @example
 * ```tsx
 * export const scene: TestScene = { ...PIXI_ONLY, render: () => <sprite2D texture={Texture.WHITE} /> };
 * ```
 */
export const PIXI_ONLY = {
  skip: { renderers: ['three'], reason: 'three.js has no pixi.js 2D elements' },
  parity: false,
} as const satisfies { skip: { renderers: ['three']; reason: string }; parity: false };

/**
 * The folders of keys whose scenes and examples draw pixi.js 2D, which three.js can't, so they are
 * `PIXI_ONLY` without saying so: `tests/scenes/2d`, `tests/scenes/mixed` and `examples/2d`. The
 * `three` project and the playground's three.js frame don't load them, since they import names only
 * this library exports.
 */
export const PIXI_ONLY_FOLDERS = ['2d', 'mixed', 'docs/2d'] as const;

/**
 * Whether a scene's key is in one of {@link PIXI_ONLY_FOLDERS}
 * @param key - The scene's key, such as `2d/graphics` or `docs/2d/first-2d-scene`
 */
export const isPixiOnlyKey = (key: string): boolean => PIXI_ONLY_FOLDERS.some((folder) => key.startsWith(`${folder}/`));
