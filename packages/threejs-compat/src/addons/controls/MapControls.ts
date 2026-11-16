/*!
 * Adapted from three.js's examples/jsm/controls/MapControls.js (r187)
 * MIT License, Copyright (c) 2010-2025 three.js authors
 */
import { MOUSE, TOUCH } from '../../catalog/constants';
import { Raycaster } from '../../compat/Raycaster';
import type { ControlsElement } from '../../environment/Controls';
import { Plane } from '../../math/Plane';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { OrbitControls } from './OrbitControls';
import type { OrbitCamera, PointerInput } from './OrbitControls';

const plane = new Plane();
const raycaster = new Raycaster();
const mouse = new Vector2();
const panCurrent = new Vector3();

/**
 * three's `MapControls`: {@link OrbitControls} set up for a map seen from above
 *
 * Left drag pans along the ground, right drag orbits, the wheel dollies; one finger pans and two
 * dolly and orbit. Panning keeps the point under the pointer under it, as three's does.
 * @example
 * ```tsx
 * import { extend } from '@react-fiber/threejs-compat';
 * import { MapControls } from '@react-fiber/threejs-compat/addons';
 *
 * extend({ MapControls });
 *
 * <mapControls args={[camera, gl.domElement]} />;
 * ```
 * @category catalog
 * @standard
 */
export class MapControls extends OrbitControls {
  private readonly _panWorldStart = new Vector3();

  /**
   * @param object - The camera to move
   * @param domElement - The element to listen on, usually `renderer.domElement`
   */
  constructor(object: OrbitCamera, domElement: ControlsElement | null = null) {
    super(object, domElement);
    this.screenSpacePanning = false;
    this.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };
    this.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE };
  }

  protected override _handleMouseDownPan(event: PointerInput): void {
    super._handleMouseDownPan(event);
    this._panOffset.set(0, 0, 0);
    if (this.screenSpacePanning === true) return;
    plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
    this._pointerOnGround(event);
    raycaster.ray.intersectPlane(plane, this._panWorldStart);
  }

  protected override _handleMouseMovePan(event: PointerInput): void {
    if (this.screenSpacePanning === true) {
      super._handleMouseMovePan(event);
      return;
    }
    this._pointerOnGround(event);
    if (raycaster.ray.intersectPlane(plane, panCurrent)) {
      panCurrent.sub(this._panWorldStart);
      this._panOffset.copy(panCurrent).negate();
      this.update();
    }
  }

  private _pointerOnGround(event: PointerInput): void {
    const rect = (this.domElement as HTMLElement).getBoundingClientRect();
    mouse.x = ((event.clientX! - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY! - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.object);
  }
}
