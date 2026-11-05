/*!
 * Adapted from three.js's examples/jsm/controls/OrbitControls.js (r187)
 * MIT License, Copyright (c) 2010-2025 three.js authors
 */
import type { Camera3D } from '@pixi/3d';
import { warn } from 'pixi.js';

import { MOUSE, TOUCH } from '../../catalog/constants';
import { lookAtPoint } from '../../compat/installObject3DSurface';
import { Controls } from '../../environment/Controls';
import type { ControlsElement } from '../../environment/Controls';
import type { DispatchedEvent } from '../../environment/EventDispatcher';
import { MathUtils } from '../../math/MathUtils';
import { Plane } from '../../math/Plane';
import { Quaternion } from '../../math/Quaternion';
import { Ray } from '../../math/Ray';
import { Spherical } from '../../math/Spherical';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';

/**
 * The camera {@link OrbitControls} move: a perspective or orthographic camera with three's fields
 * @category catalog
 * @advanced
 */
export type OrbitCamera = Camera3D & {
  /** Set on a perspective camera */
  isPerspectiveCamera?: boolean;
  /** Set on an orthographic camera */
  isOrthographicCamera?: boolean;
  /** An orthographic camera's frustum bounds */
  left?: number;
  /** An orthographic camera's frustum bounds */
  right?: number;
  /** An orthographic camera's frustum bounds */
  top?: number;
  /** An orthographic camera's frustum bounds */
  bottom?: number;
  /** Rebuilds the projection after a change to `zoom` */
  updateProjectionMatrix?: () => void;
};

/**
 * The pointer fields {@link OrbitControls} read, from a real event or one they make for a lifted finger
 * @category catalog
 * @advanced
 */
export interface PointerInput {
  /** Which pointer */
  pointerId: number;
  /** Across the page, in CSS pixels */
  pageX: number;
  /** Down the page, in CSS pixels */
  pageY: number;
  /** Across the viewport, in CSS pixels */
  clientX?: number;
  /** Down the viewport, in CSS pixels */
  clientY?: number;
  /** The mouse button: 0 left, 1 middle, 2 right */
  button?: number;
  /** `'mouse'`, `'pen'` or `'touch'` */
  pointerType?: string;
  /** Whether Control is held */
  ctrlKey?: boolean;
  /** Whether Meta is held */
  metaKey?: boolean;
  /** Whether Shift is held */
  shiftKey?: boolean;
}

/** The wheel fields the controls read, with the delta in pixels */
interface WheelInput {
  clientX: number;
  clientY: number;
  deltaY: number;
}

const changeEvent: DispatchedEvent<'change'> = { type: 'change' };
const startEvent: DispatchedEvent<'start'> = { type: 'start' };
const endEvent: DispatchedEvent<'end'> = { type: 'end' };

const ray = new Ray();
const plane = new Plane();
const TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);
const v = new Vector3();
const TWO_PI = 2 * Math.PI;
const EPS = 0.000001;

const STATE = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6,
} as const;

/** The element's document, or `null` for an element with none, such as an `OffscreenCanvas` */
const documentOf = (element: ControlsElement | null): Document | null =>
  element && 'ownerDocument' in element ? element.ownerDocument : null;

/**
 * three's `OrbitControls`: orbit, dolly and pan a camera around a target with the mouse, touch or keys
 *
 * A port of three's, line for line, over this library's math, so the same input moves the camera the
 * same way. Left drag orbits, the wheel or middle drag dollies, right drag (or a modified left drag)
 * pans; one finger orbits and two dolly and pan. `update()` must run every frame while `enableDamping`
 * or `autoRotate` is on. It keeps `object.up`, as three's does.
 * @example
 * ```tsx
 * import { extend, useFrame, useThree } from 'react-pixi-fiber';
 * import { OrbitControls } from 'react-pixi-fiber/addons';
 *
 * extend({ OrbitControls });
 *
 * function Controls() {
 *   const { camera, gl } = useThree();
 *   const controls = useRef<OrbitControls>(null);
 *   useFrame(() => controls.current?.update());
 *   return <orbitControls ref={controls} args={[camera, gl.domElement]} enableDamping />;
 * }
 * ```
 * @category catalog
 * @standard
 */
export class OrbitControls extends Controls<OrbitCamera> {
  /** The point the camera orbits around */
  public target: Vector3 = new Vector3();
  /** The centre of the `minTargetRadius` and `maxTargetRadius` limits */
  public cursor: Vector3 = new Vector3();
  /** How close a perspective camera can dolly in @default 0 */
  public minDistance: number = 0;
  /** How far a perspective camera can dolly out @default Infinity */
  public maxDistance: number = Infinity;
  /** How far an orthographic camera can zoom out @default 0 */
  public minZoom: number = 0;
  /** How far an orthographic camera can zoom in @default Infinity */
  public maxZoom: number = Infinity;
  /** How close the target can come to `cursor` @default 0 */
  public minTargetRadius: number = 0;
  /** How far the target can go from `cursor` @default Infinity */
  public maxTargetRadius: number = Infinity;
  /** How far up the camera can orbit, in radians from straight above @default 0 */
  public minPolarAngle: number = 0;
  /** How far down the camera can orbit, in radians from straight above @default Math.PI */
  public maxPolarAngle: number = Math.PI;
  /** How far round the camera can orbit one way, in radians @default -Infinity */
  public minAzimuthAngle: number = -Infinity;
  /** How far round the camera can orbit the other way, in radians @default Infinity */
  public maxAzimuthAngle: number = Infinity;
  /** Ease the camera to a stop; `update()` must run every frame @default false */
  public enableDamping = false;
  /** How quickly damping eases the camera, 0 to 1 @default 0.05 */
  public dampingFactor: number = 0.05;
  /** Allow dollying and zooming @default true */
  public enableZoom = true;
  /** How fast dollying goes @default 1 */
  public zoomSpeed: number = 1;
  /** Allow orbiting @default true */
  public enableRotate = true;
  /** How fast orbiting goes @default 1 */
  public rotateSpeed: number = 1;
  /** How fast the keys orbit @default 1 */
  public keyRotateSpeed: number = 1;
  /** Allow panning @default true */
  public enablePan = true;
  /** How fast panning goes @default 1 */
  public panSpeed: number = 1;
  /** Pan in the screen's plane, not the ground's @default true */
  public screenSpacePanning = true;
  /** Pixels the camera pans per key press @default 7 */
  public keyPanSpeed: number = 7;
  /** Dolly toward the point under the cursor @default false */
  public zoomToCursor = false;
  /** Orbit on its own; `update()` must run every frame @default false */
  public autoRotate = false;
  /** Seconds per orbit at 60 frames a second is 60 over this @default 2 */
  public autoRotateSpeed: number = 2;
  /** The keys that pan, or orbit with a modifier */
  public override keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string } = {
    LEFT: 'ArrowLeft',
    UP: 'ArrowUp',
    RIGHT: 'ArrowRight',
    BOTTOM: 'ArrowDown',
  };
  /** What each mouse button does */
  public override mouseButtons: { LEFT: number | null; MIDDLE: number | null; RIGHT: number | null } = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
  };
  /** What one and two fingers do */
  public override touches: { ONE: number | null; TWO: number | null } = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
  /** The target `saveState` kept, which `reset` goes back to */
  public target0: Vector3;
  /** The camera position `saveState` kept */
  public position0: Vector3;
  /** The camera zoom `saveState` kept */
  public zoom0: number;

  private _cursorStyle: 'auto' | 'grab' = 'auto';
  private _domElementKeyEvents: HTMLElement | Window | null = null;
  private readonly _lastPosition = new Vector3();
  private readonly _lastQuaternion = new Quaternion();
  private readonly _lastTargetPosition = new Vector3();
  private readonly _quat: Quaternion;
  private readonly _quatInverse: Quaternion;
  private readonly _spherical = new Spherical();
  private readonly _sphericalDelta = new Spherical();
  private _scale = 1;
  protected readonly _panOffset: Vector3 = new Vector3();
  private readonly _rotateStart = new Vector2();
  private readonly _rotateEnd = new Vector2();
  private readonly _rotateDelta = new Vector2();
  private readonly _panStart = new Vector2();
  private readonly _panEnd = new Vector2();
  private readonly _panDelta = new Vector2();
  private readonly _dollyStart = new Vector2();
  private readonly _dollyEnd = new Vector2();
  private readonly _dollyDelta = new Vector2();
  private readonly _dollyDirection = new Vector3();
  private readonly _mouse = new Vector2();
  private _performCursorZoom = false;
  private readonly _pointers: number[] = [];
  private _pointerPositions: Record<number, Vector2> = {};
  private _controlActive = false;

  private readonly _onPointerMove = (event: PointerEvent): void => {
    if (this.enabled === false) return;
    if (event.pointerType === 'touch') this._onTouchMove(event);
    else this._onMouseMove(event);
  };

  private readonly _onPointerDown = (event: PointerEvent): void => {
    if (this.enabled === false) return;
    if (this._pointers.length === 0) {
      const element = this.domElement as HTMLElement;
      element.setPointerCapture(event.pointerId);
      element.ownerDocument.addEventListener('pointermove', this._onPointerMove);
      element.ownerDocument.addEventListener('pointerup', this._onPointerUp);
    }
    if (this._isTrackingPointer(event)) return;
    this._addPointer(event);
    if (event.pointerType === 'touch') this._onTouchStart(event);
    else this._onMouseDown(event);
    if (this._cursorStyle === 'grab') (this.domElement as HTMLElement).style.cursor = 'grabbing';
  };

  private readonly _onPointerUp = (event: PointerEvent): void => {
    this._removePointer(event);
    const element = this.domElement as HTMLElement;
    switch (this._pointers.length) {
      case 0:
        if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
        element.ownerDocument.removeEventListener('pointermove', this._onPointerMove);
        element.ownerDocument.removeEventListener('pointerup', this._onPointerUp);
        this.dispatchEvent(endEvent);
        this.state = STATE.NONE;
        if (this._cursorStyle === 'grab') element.style.cursor = 'grab';
        break;
      case 1: {
        const pointerId = this._pointers[0];
        const position = this._pointerPositions[pointerId];
        this._onTouchStart({ pointerId, pageX: position.x, pageY: position.y });
        break;
      }
    }
  };

  private readonly _onContextMenu = (event: Event): void => {
    if (this.enabled === false) return;
    event.preventDefault();
  };

  private readonly _onMouseWheel = (event: WheelEvent): void => {
    if (this.enabled === false || this.enableZoom === false || this.state !== STATE.NONE) return;
    event.preventDefault();
    this.dispatchEvent(startEvent);
    this._handleMouseWheel(this._customWheelEvent(event));
    this.dispatchEvent(endEvent);
  };

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (this.enabled === false) return;
    this._handleKeyDown(event);
  };

  private readonly _interceptControlDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Control') return;
    this._controlActive = true;
    documentOf(this.domElement)?.addEventListener('keyup', this._interceptControlUp, { passive: true, capture: true });
  };

  private readonly _interceptControlUp = (event: KeyboardEvent): void => {
    if (event.key !== 'Control') return;
    this._controlActive = false;
    documentOf(this.domElement)?.removeEventListener('keyup', this._interceptControlUp, { capture: true });
  };

  /**
   * @param object - The camera to move
   * @param domElement - The element to listen on, usually `renderer.domElement`; call `connect` later when omitted
   */
  constructor(object: OrbitCamera, domElement: ControlsElement | null = null) {
    super(object, domElement);
    this.state = STATE.NONE;
    this.target0 = this.target.clone();
    this.position0 = new Vector3().copy(object.position);
    this.zoom0 = object.zoom;
    this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
    this._quatInverse = this._quat.clone().invert();
    if (this.domElement !== null) this.connect(this.domElement);
    this.update();
  }

  /** The element's cursor: `'grab'` shows a hand that closes while dragging, `'auto'` the default */
  public get cursorStyle(): 'auto' | 'grab' {
    return this._cursorStyle;
  }

  public set cursorStyle(type: 'auto' | 'grab') {
    this._cursorStyle = type;
    const element = this.domElement;
    if (element && 'style' in element) element.style.cursor = type === 'grab' ? 'grab' : 'auto';
  }

  /**
   * Starts listening for pointer, wheel and context menu events on an element
   * @param element - The element, usually `renderer.domElement`
   */
  public override connect(element: ControlsElement): void {
    super.connect(element);
    if (!('ownerDocument' in element)) return;
    element.addEventListener('pointerdown', this._onPointerDown);
    element.addEventListener('pointercancel', this._onPointerUp);
    element.addEventListener('contextmenu', this._onContextMenu);
    element.addEventListener('wheel', this._onMouseWheel, { passive: false });
    element.ownerDocument.addEventListener('keydown', this._interceptControlDown, { passive: true, capture: true });
    element.style.touchAction = 'none';
  }

  /** Stops listening and forgets the pointers that were down */
  public override disconnect(): void {
    this.state = STATE.NONE;
    const element = this.domElement;
    if (element && 'ownerDocument' in element) {
      element.removeEventListener('pointerdown', this._onPointerDown);
      element.ownerDocument.removeEventListener('pointermove', this._onPointerMove);
      element.ownerDocument.removeEventListener('pointerup', this._onPointerUp);
      element.removeEventListener('pointercancel', this._onPointerUp);
      element.removeEventListener('wheel', this._onMouseWheel);
      element.removeEventListener('contextmenu', this._onContextMenu);
      element.ownerDocument.removeEventListener('keydown', this._interceptControlDown, { capture: true });
      element.ownerDocument.removeEventListener('keyup', this._interceptControlUp, { capture: true });
      element.style.touchAction = '';
      element.style.cursor = 'auto';
    }
    this.stopListenToKeyEvents();
    this._controlActive = false;
    this._pointers.length = 0;
    this._pointerPositions = {};
  }

  /** Stops listening; three's `dispose` */
  public override dispose(): void {
    this.disconnect();
  }

  /** The camera's angle from straight above the target, in radians */
  public getPolarAngle(): number {
    return this._spherical.phi;
  }

  /** The camera's angle round the target, in radians */
  public getAzimuthalAngle(): number {
    return this._spherical.theta;
  }

  /** The camera's distance from the target */
  public getDistance(): number {
    return this.object.position.distanceTo(this.target);
  }

  /**
   * Pans with the arrow keys pressed on an element, often `window`
   * @param domElement - The element to listen for keys on
   */
  public listenToKeyEvents(domElement: HTMLElement | Window): void {
    domElement.addEventListener('keydown', this._onKeyDown as EventListener);
    this._domElementKeyEvents = domElement;
  }

  /** Stops listening for keys */
  public stopListenToKeyEvents(): void {
    this._domElementKeyEvents?.removeEventListener('keydown', this._onKeyDown as EventListener);
    this._domElementKeyEvents = null;
  }

  /** Remembers the target, camera position and zoom, which `reset` goes back to */
  public saveState(): void {
    this.target0.copy(this.target);
    this.position0.copy(this.object.position);
    this.zoom0 = this.object.zoom;
  }

  /** Goes back to the state `saveState` last kept, or the one the controls started with */
  public reset(): void {
    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.object.zoom = this.zoom0;
    this.object.updateProjectionMatrix?.();
    this.dispatchEvent(changeEvent);
    this.update();
    this.state = STATE.NONE;
  }

  /**
   * Pans by a distance in pixels
   * @param deltaX - Pixels across
   * @param deltaY - Pixels down
   */
  public pan(deltaX: number, deltaY: number): void {
    this._pan(deltaX, deltaY);
    this.update();
  }

  /**
   * Dollies in by a factor
   * @param dollyScale - Above 1 to come closer
   */
  public dollyIn(dollyScale: number): void {
    this._dollyIn(dollyScale);
    this.update();
  }

  /**
   * Dollies out by a factor
   * @param dollyScale - Above 1 to go further
   */
  public dollyOut(dollyScale: number): void {
    this._dollyOut(dollyScale);
    this.update();
  }

  /**
   * Orbits round the target
   * @param angle - Radians
   */
  public rotateLeft(angle: number): void {
    this._rotateLeft(angle);
    this.update();
  }

  /**
   * Orbits over the target
   * @param angle - Radians
   */
  public rotateUp(angle: number): void {
    this._rotateUp(angle);
    this.update();
  }

  /**
   * Moves the camera by the input since the last update, with damping and auto rotation, and sends a
   * `change` event when it moved
   * @param deltaTime - Seconds since the last update, for `autoRotate`; a sixtieth when `null`
   * @returns Whether the camera moved
   */
  public override update(deltaTime: number | null = null): boolean {
    const position = this.object.position;

    v.copy(position).sub(this.target);
    v.applyQuaternion(this._quat);
    this._spherical.setFromVector3(v);

    if (this.autoRotate && this.state === STATE.NONE) this._rotateLeft(this._getAutoRotationAngle(deltaTime));

    if (this.enableDamping) {
      this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
      this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
    } else {
      this._spherical.theta += this._sphericalDelta.theta;
      this._spherical.phi += this._sphericalDelta.phi;
    }

    let min = this.minAzimuthAngle;
    let max = this.maxAzimuthAngle;
    if (Number.isFinite(min) && Number.isFinite(max)) {
      if (min < -Math.PI) min += TWO_PI;
      else if (min > Math.PI) min -= TWO_PI;
      if (max < -Math.PI) max += TWO_PI;
      else if (max > Math.PI) max -= TWO_PI;
      if (min <= max) {
        this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
      } else {
        this._spherical.theta =
          this._spherical.theta > (min + max) / 2
            ? Math.max(min, this._spherical.theta)
            : Math.min(max, this._spherical.theta);
      }
    }

    this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
    this._spherical.makeSafe();

    if (this.enableDamping === true) this.target.addScaledVector(this._panOffset, this.dampingFactor);
    else this.target.add(this._panOffset);

    this.target.sub(this.cursor);
    this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
    this.target.add(this.cursor);

    let zoomChanged = false;
    if ((this.zoomToCursor && this._performCursorZoom) || this.object.isOrthographicCamera) {
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    } else {
      const prevRadius = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
      zoomChanged = prevRadius !== this._spherical.radius;
    }

    v.setFromSpherical(this._spherical);
    v.applyQuaternion(this._quatInverse);
    position.copy(this.target).add(v);
    lookAtPoint(this.object, this.target);

    if (this.enableDamping === true) {
      this._sphericalDelta.theta *= 1 - this.dampingFactor;
      this._sphericalDelta.phi *= 1 - this.dampingFactor;
      this._panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      this._sphericalDelta.set(0, 0, 0);
      this._panOffset.set(0, 0, 0);
    }

    if (this.zoomToCursor && this._performCursorZoom) {
      let newRadius: number | null = null;
      if (this.object.isPerspectiveCamera) {
        const prevRadius = v.length();
        newRadius = this._clampDistance(prevRadius * this._scale);
        const radiusDelta = prevRadius - newRadius;
        this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
        zoomChanged = !!radiusDelta;
      } else if (this.object.isOrthographicCamera) {
        const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
        mouseBefore.unproject(this.object);
        const prevZoom = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
        this.object.updateProjectionMatrix?.();
        zoomChanged = prevZoom !== this.object.zoom;
        const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
        mouseAfter.unproject(this.object);
        this.object.position.sub(mouseAfter).add(mouseBefore);
        newRadius = v.length();
      } else {
        warn('OrbitControls encountered an unknown camera type - zoom to cursor disabled.');
        this.zoomToCursor = false;
      }

      if (newRadius !== null) {
        if (this.screenSpacePanning) {
          this.target
            .set(0, 0, -1)
            .transformDirection(this.object.matrix)
            .multiplyScalar(newRadius)
            .add(this.object.position);
        } else {
          ray.origin.copy(this.object.position);
          ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);
          if (Math.abs(this.object.up.dot(ray.direction)) < TILT_LIMIT) {
            lookAtPoint(this.object, this.target);
          } else {
            plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
            ray.intersectPlane(plane, this.target);
          }
        }
      }
    } else if (this.object.isOrthographicCamera) {
      const prevZoom = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
      if (prevZoom !== this.object.zoom) {
        this.object.updateProjectionMatrix?.();
        zoomChanged = true;
      }
    }

    this._scale = 1;
    this._performCursorZoom = false;

    if (
      zoomChanged ||
      this._lastPosition.distanceToSquared(this.object.position) > EPS ||
      8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > EPS ||
      this._lastTargetPosition.distanceToSquared(this.target) > EPS
    ) {
      this.dispatchEvent(changeEvent);
      this._lastPosition.copy(this.object.position);
      this._lastQuaternion.copy(this.object.quaternion);
      this._lastTargetPosition.copy(this.target);
      return true;
    }
    return false;
  }

  private _getAutoRotationAngle(deltaTime: number | null): number {
    if (deltaTime !== null) return (TWO_PI / 60) * this.autoRotateSpeed * deltaTime;
    return (TWO_PI / 60 / 60) * this.autoRotateSpeed;
  }

  private _getZoomScale(delta: number): number {
    const normalizedDelta = Math.abs(delta * 0.01);
    return 0.95 ** (this.zoomSpeed * normalizedDelta);
  }

  private _rotateLeft(angle: number): void {
    this._sphericalDelta.theta -= angle;
  }

  private _rotateUp(angle: number): void {
    this._sphericalDelta.phi -= angle;
  }

  private _panLeft(distance: number, objectMatrix: OrbitCamera['matrix']): void {
    v.setFromMatrixColumn(objectMatrix, 0);
    v.multiplyScalar(-distance);
    this._panOffset.add(v);
  }

  private _panUp(distance: number, objectMatrix: OrbitCamera['matrix']): void {
    if (this.screenSpacePanning === true) {
      v.setFromMatrixColumn(objectMatrix, 1);
    } else {
      v.setFromMatrixColumn(objectMatrix, 0);
      v.crossVectors(this.object.up, v);
    }
    v.multiplyScalar(distance);
    this._panOffset.add(v);
  }

  private _pan(deltaX: number, deltaY: number): void {
    const element = this.domElement as HTMLElement;
    const camera = this.object;
    if (camera.isPerspectiveCamera) {
      v.copy(camera.position).sub(this.target);
      let targetDistance = v.length();
      targetDistance *= Math.tan(((camera.fov / 2) * Math.PI) / 180);
      this._panLeft((2 * deltaX * targetDistance) / element.clientHeight, camera.matrix);
      this._panUp((2 * deltaY * targetDistance) / element.clientHeight, camera.matrix);
    } else if (camera.isOrthographicCamera) {
      this._panLeft((deltaX * (camera.right! - camera.left!)) / camera.zoom / element.clientWidth, camera.matrix);
      this._panUp((deltaY * (camera.top! - camera.bottom!)) / camera.zoom / element.clientHeight, camera.matrix);
    } else {
      warn('OrbitControls encountered an unknown camera type - pan disabled.');
      this.enablePan = false;
    }
  }

  private _dollyOut(dollyScale: number): void {
    if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) {
      this._scale /= dollyScale;
    } else {
      warn('OrbitControls encountered an unknown camera type - dolly/zoom disabled.');
      this.enableZoom = false;
    }
  }

  private _dollyIn(dollyScale: number): void {
    if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) {
      this._scale *= dollyScale;
    } else {
      warn('OrbitControls encountered an unknown camera type - dolly/zoom disabled.');
      this.enableZoom = false;
    }
  }

  private _updateZoomParameters(x: number, y: number): void {
    if (!this.zoomToCursor) return;
    this._performCursorZoom = true;
    const rect = (this.domElement as HTMLElement).getBoundingClientRect();
    const dx = x - rect.left;
    const dy = y - rect.top;
    this._mouse.x = (dx / rect.width) * 2 - 1;
    this._mouse.y = -(dy / rect.height) * 2 + 1;
    this._dollyDirection
      .set(this._mouse.x, this._mouse.y, 1)
      .unproject(this.object)
      .sub(this.object.position)
      .normalize();
  }

  private _clampDistance(dist: number): number {
    return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
  }

  private _handleMouseDownRotate(event: PointerInput): void {
    this._rotateStart.set(event.clientX!, event.clientY!);
  }

  private _handleMouseDownDolly(event: PointerInput): void {
    this._updateZoomParameters(event.clientX!, event.clientY!);
    this._dollyStart.set(event.clientX!, event.clientY!);
  }

  protected _handleMouseDownPan(event: PointerInput): void {
    this._panStart.set(event.clientX!, event.clientY!);
  }

  private _handleMouseMoveRotate(event: PointerInput): void {
    this._rotateEnd.set(event.clientX!, event.clientY!);
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const element = this.domElement as HTMLElement;
    this._rotateLeft((TWO_PI * this._rotateDelta.x) / element.clientHeight);
    this._rotateUp((TWO_PI * this._rotateDelta.y) / element.clientHeight);
    this._rotateStart.copy(this._rotateEnd);
    this.update();
  }

  private _handleMouseMoveDolly(event: PointerInput): void {
    this._dollyEnd.set(event.clientX!, event.clientY!);
    this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
    if (this._dollyDelta.y > 0) this._dollyOut(this._getZoomScale(this._dollyDelta.y));
    else if (this._dollyDelta.y < 0) this._dollyIn(this._getZoomScale(this._dollyDelta.y));
    this._dollyStart.copy(this._dollyEnd);
    if (this.zoomToCursor) {
      this._performCursorZoom = true;
      this._dollyDirection
        .set(this._mouse.x, this._mouse.y, 1)
        .unproject(this.object)
        .sub(this.object.position)
        .normalize();
    }
    this.update();
  }

  protected _handleMouseMovePan(event: PointerInput): void {
    this._panEnd.set(event.clientX!, event.clientY!);
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
    this._pan(this._panDelta.x, this._panDelta.y);
    this._panStart.copy(this._panEnd);
    this.update();
  }

  private _handleMouseWheel(event: WheelInput): void {
    this._updateZoomParameters(event.clientX, event.clientY);
    if (event.deltaY < 0) this._dollyIn(this._getZoomScale(event.deltaY));
    else if (event.deltaY > 0) this._dollyOut(this._getZoomScale(event.deltaY));
    this.update();
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    const modified = event.ctrlKey || event.metaKey || event.shiftKey;
    const height = (this.domElement as HTMLElement).clientHeight;
    let needsUpdate = false;
    switch (event.code) {
      case this.keys.UP:
        if (modified) {
          if (this.enableRotate) this._rotateUp((TWO_PI * this.keyRotateSpeed) / height);
        } else if (this.enablePan) {
          this._pan(0, this.keyPanSpeed);
        }
        needsUpdate = true;
        break;
      case this.keys.BOTTOM:
        if (modified) {
          if (this.enableRotate) this._rotateUp((-TWO_PI * this.keyRotateSpeed) / height);
        } else if (this.enablePan) {
          this._pan(0, -this.keyPanSpeed);
        }
        needsUpdate = true;
        break;
      case this.keys.LEFT:
        if (modified) {
          if (this.enableRotate) this._rotateLeft((TWO_PI * this.keyRotateSpeed) / height);
        } else if (this.enablePan) {
          this._pan(this.keyPanSpeed, 0);
        }
        needsUpdate = true;
        break;
      case this.keys.RIGHT:
        if (modified) {
          if (this.enableRotate) this._rotateLeft((-TWO_PI * this.keyRotateSpeed) / height);
        } else if (this.enablePan) {
          this._pan(-this.keyPanSpeed, 0);
        }
        needsUpdate = true;
        break;
    }
    if (needsUpdate) {
      event.preventDefault();
      this.update();
    }
  }

  private _pointerCentre(event: PointerInput, out: Vector2): Vector2 {
    if (this._pointers.length === 1) return out.set(event.pageX, event.pageY);
    const position = this._getSecondPointerPosition(event);
    return out.set(0.5 * (event.pageX + position.x), 0.5 * (event.pageY + position.y));
  }

  private _handleTouchStartDolly(event: PointerInput): void {
    const position = this._getSecondPointerPosition(event);
    const dx = event.pageX - position.x;
    const dy = event.pageY - position.y;
    this._dollyStart.set(0, Math.sqrt(dx * dx + dy * dy));
  }

  private _handleTouchMoveRotate(event: PointerInput): void {
    this._pointerCentre(event, this._rotateEnd);
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const element = this.domElement as HTMLElement;
    this._rotateLeft((TWO_PI * this._rotateDelta.x) / element.clientHeight);
    this._rotateUp((TWO_PI * this._rotateDelta.y) / element.clientHeight);
    this._rotateStart.copy(this._rotateEnd);
  }

  private _handleTouchMovePan(event: PointerInput): void {
    this._pointerCentre(event, this._panEnd);
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
    this._pan(this._panDelta.x, this._panDelta.y);
    this._panStart.copy(this._panEnd);
  }

  private _handleTouchMoveDolly(event: PointerInput): void {
    const position = this._getSecondPointerPosition(event);
    const dx = event.pageX - position.x;
    const dy = event.pageY - position.y;
    this._dollyEnd.set(0, Math.sqrt(dx * dx + dy * dy));
    this._dollyDelta.set(0, (this._dollyEnd.y / this._dollyStart.y) ** this.zoomSpeed);
    this._dollyOut(this._dollyDelta.y);
    this._dollyStart.copy(this._dollyEnd);
    this._updateZoomParameters((event.pageX + position.x) * 0.5, (event.pageY + position.y) * 0.5);
  }

  private _addPointer(event: PointerInput): void {
    this._pointers.push(event.pointerId);
  }

  private _removePointer(event: PointerInput): void {
    delete this._pointerPositions[event.pointerId];
    const index = this._pointers.indexOf(event.pointerId);
    if (index !== -1) this._pointers.splice(index, 1);
  }

  private _isTrackingPointer(event: PointerInput): boolean {
    return this._pointers.includes(event.pointerId);
  }

  private _trackPointer(event: PointerInput): void {
    const position = (this._pointerPositions[event.pointerId] ??= new Vector2());
    position.set(event.pageX, event.pageY);
  }

  private _getSecondPointerPosition(event: PointerInput): Vector2 {
    const pointerId = event.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[pointerId];
  }

  private _customWheelEvent(event: WheelEvent): WheelInput {
    const wheel: WheelInput = { clientX: event.clientX, clientY: event.clientY, deltaY: event.deltaY };
    if (event.deltaMode === 1) wheel.deltaY *= 16;
    else if (event.deltaMode === 2) wheel.deltaY *= 100;
    if (event.ctrlKey && !this._controlActive) wheel.deltaY *= 10;
    return wheel;
  }

  private _onMouseDown(event: PointerInput): void {
    const mouseAction =
      event.button === 0
        ? this.mouseButtons.LEFT
        : event.button === 1
          ? this.mouseButtons.MIDDLE
          : event.button === 2
            ? this.mouseButtons.RIGHT
            : -1;
    const modified = event.ctrlKey || event.metaKey || event.shiftKey;
    switch (mouseAction) {
      case MOUSE.DOLLY:
        if (this.enableZoom === false) return;
        this._handleMouseDownDolly(event);
        this.state = STATE.DOLLY;
        break;
      case MOUSE.ROTATE:
        if (modified) {
          if (this.enablePan === false) return;
          this._handleMouseDownPan(event);
          this.state = STATE.PAN;
        } else {
          if (this.enableRotate === false) return;
          this._handleMouseDownRotate(event);
          this.state = STATE.ROTATE;
        }
        break;
      case MOUSE.PAN:
        if (modified) {
          if (this.enableRotate === false) return;
          this._handleMouseDownRotate(event);
          this.state = STATE.ROTATE;
        } else {
          if (this.enablePan === false) return;
          this._handleMouseDownPan(event);
          this.state = STATE.PAN;
        }
        break;
      default:
        this.state = STATE.NONE;
    }
    if (this.state !== STATE.NONE) this.dispatchEvent(startEvent);
  }

  private _onMouseMove(event: PointerInput): void {
    switch (this.state) {
      case STATE.ROTATE:
        if (this.enableRotate === false) return;
        this._handleMouseMoveRotate(event);
        break;
      case STATE.DOLLY:
        if (this.enableZoom === false) return;
        this._handleMouseMoveDolly(event);
        break;
      case STATE.PAN:
        if (this.enablePan === false) return;
        this._handleMouseMovePan(event);
        break;
    }
  }

  private _onTouchStart(event: PointerInput): void {
    this._trackPointer(event);
    switch (this._pointers.length) {
      case 1:
        switch (this.touches.ONE) {
          case TOUCH.ROTATE:
            if (this.enableRotate === false) {
              this.state = STATE.NONE;
              break;
            }
            this._pointerCentre(event, this._rotateStart);
            this.state = STATE.TOUCH_ROTATE;
            break;
          case TOUCH.PAN:
            if (this.enablePan === false) {
              this.state = STATE.NONE;
              break;
            }
            this._pointerCentre(event, this._panStart);
            this.state = STATE.TOUCH_PAN;
            break;
          default:
            this.state = STATE.NONE;
        }
        break;
      case 2:
        switch (this.touches.TWO) {
          case TOUCH.DOLLY_PAN:
            if (this.enableZoom === false && this.enablePan === false) return;
            if (this.enableZoom) this._handleTouchStartDolly(event);
            if (this.enablePan) this._pointerCentre(event, this._panStart);
            this.state = STATE.TOUCH_DOLLY_PAN;
            break;
          case TOUCH.DOLLY_ROTATE:
            if (this.enableZoom === false && this.enableRotate === false) return;
            if (this.enableZoom) this._handleTouchStartDolly(event);
            if (this.enableRotate) this._pointerCentre(event, this._rotateStart);
            this.state = STATE.TOUCH_DOLLY_ROTATE;
            break;
          default:
            this.state = STATE.NONE;
        }
        break;
      default:
        this.state = STATE.NONE;
    }
    if (this.state !== STATE.NONE) this.dispatchEvent(startEvent);
  }

  private _onTouchMove(event: PointerInput): void {
    this._trackPointer(event);
    switch (this.state) {
      case STATE.TOUCH_ROTATE:
        if (this.enableRotate === false) return;
        this._handleTouchMoveRotate(event);
        this.update();
        break;
      case STATE.TOUCH_PAN:
        if (this.enablePan === false) return;
        this._handleTouchMovePan(event);
        this.update();
        break;
      case STATE.TOUCH_DOLLY_PAN:
        if (this.enableZoom === false && this.enablePan === false) return;
        if (this.enableZoom) this._handleTouchMoveDolly(event);
        if (this.enablePan) this._handleTouchMovePan(event);
        this.update();
        break;
      case STATE.TOUCH_DOLLY_ROTATE:
        if (this.enableZoom === false && this.enableRotate === false) return;
        if (this.enableZoom) this._handleTouchMoveDolly(event);
        if (this.enableRotate) this._handleTouchMoveRotate(event);
        this.update();
        break;
      default:
        this.state = STATE.NONE;
    }
  }
}
