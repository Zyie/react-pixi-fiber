/**
 * The 2D area module: pixi.js's display classes, filters and the other 2D classes useful as elements,
 * under their element names (`Sprite2D` for `<sprite2D>`), and `Anchor2D`, the 2D that follows a 3D object. The catalog takes it whole; unlike the 3D
 * areas, `react-pixi-fiber/three` doesn't, since these are pixi.js's own classes, which an app imports
 * from `pixi.js`.
 */
export * from './catalog';
export { Anchor2D } from './Anchor2D';
