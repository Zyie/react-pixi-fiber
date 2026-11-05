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

/** How many pixels of a scene may differ from its reference image unless it sets `pixelMatch` */
export const DEFAULT_PIXEL_MATCH = 16;
