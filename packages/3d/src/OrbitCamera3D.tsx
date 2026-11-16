import { OrbitCamera } from '@pixi/3d/extras';
import type { OrbitCameraOptions } from '@pixi/3d/extras';
import { useFrame, useThree } from '@react-fiber/core';
import { EventBoundary, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js';
import { useEffect, useImperativeHandle, useState } from 'react';
import type { Ref } from 'react';

/**
 * The props of {@link OrbitCamera3D}: the `OrbitCameraOptions` of `@pixi/3d/extras` but `view`, which is the root's,
 * and `autoUpdate`, since the root's frames update it
 * @category core
 * @advanced
 */
export interface OrbitCamera3DProps extends Omit<OrbitCameraOptions, 'view' | 'autoUpdate'> {
  /** Receives the `OrbitCamera` once the root's view exists */
  ref?: Ref<OrbitCamera | null>;
}

/**
 * Gives a federated event a DOM event and its position on the canvas in CSS pixels, where the root's view
 * is drawn
 * @param event - The federated event
 * @param native - The DOM event
 * @param canvas - The canvas
 */
function place(event: FederatedPointerEvent | FederatedWheelEvent, native: MouseEvent, canvas: Element): void {
  const { left, top } = canvas.getBoundingClientRect();
  event.nativeEvent = native;
  event.button = native.button;
  event.ctrlKey = native.ctrlKey;
  event.global.set(native.clientX - left, native.clientY - top);
}

/**
 * The root's camera driven by `OrbitCamera` from `@pixi/3d/extras`: drag to turn it around its `target`,
 * right-drag to pan, wheel to zoom, and two fingers on a touch screen, with its options as props. The
 * controller listens for pixi's events on a view, and pixi's own event system is off under
 * react-pixi-fiber, so this passes it the canvas's pointer and wheel events, updates it on the root's
 * frames and asks for a frame when it moves the camera, for `frameloop="demand"`. `target` is where it
 * starts, which panning moves; the other options can change between renders, and the ref is the
 * controller for its methods (`rotate`, `pan`, `zoom`, `saveState`, `reset`).
 * @example
 * ```tsx
 * <Canvas camera={{ position: [0, 2, 6] }}>
 *   <OrbitCamera3D enableDamping target={{ x: 0, y: 0.5, z: 0 }} />
 *   <mesh3D>
 *     <cubeGeometry3D />
 *     <material3D baseColor="orange" />
 *   </mesh3D>
 * </Canvas>
 * ```
 * @category core
 * @standard
 */
export function OrbitCamera3D({ ref, ...options }: OrbitCamera3DProps): null {
  const renderer = useThree((state) => state.renderer);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const [orbit, setOrbit] = useState<OrbitCamera | null>(null);

  useImperativeHandle<OrbitCamera | null, OrbitCamera | null>(ref, () => orbit, [orbit]);

  useFrame(() => {
    if (orbit) {
      orbit.update();
      return;
    }
    const view = renderer.getView(scene);
    if (view) setOrbit(new OrbitCamera({ ...options, view, autoUpdate: false }));
  });

  useEffect(() => {
    if (!orbit) return;
    const { target: _target, mouseButtons, touches, ...settings } = options;
    for (const [key, value] of Object.entries(settings)) if (value !== undefined) Reflect.set(orbit, key, value);
    if (mouseButtons) Object.assign(orbit.mouseButtons, mouseButtons);
    if (touches) Object.assign(orbit.touches, touches);
  });

  useEffect(() => {
    if (!orbit) return undefined;
    const canvas = renderer.domElement as HTMLCanvasElement;
    const boundary = new EventBoundary();
    const down = new Set<number>();
    const pointer = (type: string) => (native: MouseEvent) => {
      const event = new FederatedPointerEvent(boundary);
      place(event, native, canvas);
      if (native instanceof PointerEvent) {
        event.pointerId = native.pointerId;
        event.pointerType = native.pointerType;
      }
      orbit.view.emit(type, event);
    };
    const move = pointer('globalpointermove');
    const lift = pointer('pointerup');
    const onUp = (native: PointerEvent): void => {
      if (!down.delete(native.pointerId)) return;
      lift(native);
      if (down.size) return;
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
    };
    const press = pointer('pointerdown');
    const onDown = (native: PointerEvent): void => {
      if (!down.size) {
        addEventListener('pointermove', move);
        addEventListener('pointerup', onUp);
        addEventListener('pointercancel', onUp);
      }
      down.add(native.pointerId);
      press(native);
    };
    const onContextMenu = pointer('contextmenu');
    const onWheel = (native: WheelEvent): void => {
      const event = new FederatedWheelEvent(boundary);
      place(event, native, canvas);
      event.deltaY = native.deltaY;
      event.deltaMode = native.deltaMode;
      orbit.view.emit('wheel', event);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('wheel', onWheel);
    orbit.on('change', invalidate);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('wheel', onWheel);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      orbit.destroy();
    };
  }, [orbit, renderer, invalidate]);

  return null;
}
