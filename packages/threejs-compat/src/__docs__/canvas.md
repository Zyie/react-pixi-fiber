# Canvas

`<Canvas>` is where a scene starts, as in react-three-fiber. It fills its parent, measures it, creates a root on the canvas inside, and renders its children with pixi-3d.

```tsx
import { Canvas } from 'react-pixi-fiber';

const App = () => (
  <Canvas>
    <pointLight position={[10, 10, 10]} intensity={500} />
    <mesh>
      <sphereGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  </Canvas>
);
```

## Properties

| Prop                                             | Description                                                                                                                                            | Default                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `children`                                       | Elements and components of the scene                                                                                                                   |                                                          |
| `fallback`                                       | DOM content shown when the renderer can't start                                                                                                        |                                                          |
| `renderer`                                       | Settings for the renderer: `PixiRenderer`'s parameters, three's renderer properties, and r3f's `shadows` (see [Renderer settings](#renderer-settings)) | `{}`                                                     |
| `gl`                                             | Read as `renderer`, so code written for `@react-three/fiber/legacy` runs                                                                               |                                                          |
| `camera`                                         | Props for the default camera, or your own camera                                                                                                       | `{ fov: 50, near: 0.1, far: 1000, position: [0, 0, 5] }` |
| `orthographic`                                   | Make the default camera an `OrthographicCamera`                                                                                                        | `false`                                                  |
| `scene`                                          | Props for the default scene, or your own `Scene`                                                                                                       | `{}`                                                     |
| `background`                                     | A colour the scene clears to                                                                                                                           |                                                          |
| `frameloop`                                      | `'always'`, `'demand'` or `'never'`                                                                                                                    | `'always'`                                               |
| `dpr`                                            | Pixel ratio: a number, or `[min, max]`, which clamps the display's and follows it                                                                      | `[1, 2]`                                                 |
| `width`, `height`                                | A fixed drawing size in CSS pixels, in place of the parent's                                                                                           | the parent's size                                        |
| `resize`                                         | `react-use-measure`'s options                                                                                                                          | `{ scroll: true, debounce: { scroll: 50, resize: 0 } }`  |
| `events`, `eventSource`, `eventPrefix`           | The event manager, the element it listens on, and the coordinates it reads                                                                             | r3f's pointer events on the canvas's parent              |
| `raycaster`                                      | Props for the default raycaster                                                                                                                        | `{}`                                                     |
| `scheduler`                                      | This canvas's place in the frame loop: `{ before, after, order, fps }`                                                                                 |                                                          |
| `autoUpdateFrustum`                              | Keep `state.frustum` up to date every frame                                                                                                            | `true`                                                   |
| `onCreated`                                      | Called with the root's state once the canvas is ready                                                                                                  |                                                          |
| `onPointerMissed`                                | Called for a click that hits nothing                                                                                                                   |                                                          |
| `id`, `className`, `style` and other `div` props | Passed to the canvas (`id`) and the `div` around it                                                                                                    |                                                          |

`primary` and `share` are r3f's multi-canvas renderer sharing, which pixi.js can't do: every canvas gets its own renderer, and both are ignored. `background` takes a colour only, since three's environment presets need three's loaders.

## Defaults

The canvas creates a `PixiRenderer` on pixi.js's WebGL renderer, translucent and antialiased, with three's defaults: `outputColorSpace` sRGB and `toneMapping` ACES filmic. It creates a `PerspectiveCamera` (or an `OrthographicCamera` with `orthographic`) at z 5 looking at the origin, a `Scene` the camera is added to, and a `Raycaster`.

## Renderer settings

`renderer` takes `PixiRenderer`'s parameters (`antialias`, `alpha`, `preference: 'webgpu'`, `powerPreference`), three's renderer properties, and r3f's `shadows`:

<!-- snippet: examples/canvas/tone-mapping.example.tsx#canvas -->

```tsx
import { Canvas } from 'react-pixi-fiber';
import { AgXToneMapping } from 'react-pixi-fiber/three';

export function App() {
  return (
    <Canvas renderer={{ toneMapping: AgXToneMapping, toneMappingExposure: 1.2 }}>
      <Scene />
    </Canvas>
  );
}
```

- `toneMapping` takes every three curve: `NoToneMapping`, `LinearToneMapping`, `ReinhardToneMapping`, `CineonToneMapping`, `ACESFilmicToneMapping`, `AgXToneMapping` and `NeutralToneMapping`, each worked out as three's shader does.
- `toneMappingExposure` brightens or darkens the picture before the curve.
- `outputColorSpace`: `SRGBColorSpace` encodes the picture with the sRGB curve, `LinearSRGBColorSpace` writes linear values.
- `shadows`: `true`, `'basic'`, `'percentage'`, `'soft'` or `'variance'` (see [Lights and shadows](lights-and-shadows.md)).

r3f v10 removed the `flat` and `linear` props; they are renderer settings now, and work here as in r3f:

```tsx
<Canvas renderer={{ toneMapping: NoToneMapping }} />
<Canvas renderer={{ outputColorSpace: LinearSRGBColorSpace }} />
```

The renderer is `state.renderer` (and `state.gl`) inside the canvas, so a setting can change while the scene runs: `useThree((state) => state.renderer).toneMappingExposure = 1.5`.

## Cameras

`camera` takes props for the default camera, or a camera of your own. With `orthographic`, r3f sets the camera's bounds to the canvas size in pixels, so `zoom` is pixels per world unit:

<!-- snippet: examples/canvas/orthographic.example.tsx#canvas -->

```tsx
import { Canvas } from 'react-pixi-fiber';

export function App() {
  return (
    <Canvas orthographic camera={{ zoom: 60, position: [0, 0, 20] }}>
      <Scene />
    </Canvas>
  );
}
```

The cameras project as three's do. A perspective camera uses its own `aspect`, which r3f keeps in step with the canvas; give it an `aspect` (or an orthographic camera `left`, `right`, `top` and `bottom`) in `camera` and r3f marks it `manual` and leaves it alone, so it can draw stretched or off centre, as in three. `zoom`, `filmOffset`, `setViewOffset` and the focal length helpers work too. As in three, a change to these shows once `updateProjectionMatrix()` is called; r3f calls it on every resize.

To draw from another camera, put it in the store with `set`, as drei's `makeDefault` does. A camera parented to a moving object follows it; [Camera parenting](camera-parenting.md) has the patterns.

```tsx
function DefaultCamera(props: ThreeElements['perspectiveCamera']) {
  const camera = useRef<PerspectiveCamera>(null!);
  const set = useThree((state) => state.set);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    camera.current.aspect = size.width / size.height;
    camera.current.updateProjectionMatrix();
    set({ camera: camera.current });
  }, [set, size]);

  return <perspectiveCamera ref={camera} {...props} />;
}
```

`useThree((state) => state.viewport)` gives the size of the view at the origin's depth in world units (`width`, `height`), pixels per world unit (`factor`), the camera's distance and the canvas aspect, worked out from the camera as in r3f. `viewport.getCurrentViewport(camera, target)` does the same for any camera and point.

## Frame loop

`frameloop="always"` draws every frame. `'demand'` draws only after `invalidate()`, which r3f calls for you when props change; call it yourself after changing an object outside React. `'never'` draws only when `advance(timestamp)` is called, for a loop you drive.

`useFrame` jobs run in phases. The `physics` phase runs on a fixed timestep, so a simulation is the same at any display rate; `state.overstep` is how far the loop is into the next step, for smoothing between steps:

<!-- snippet: examples/canvas/fixed-timestep.example.tsx#simulation -->

```tsx
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from 'react-pixi-fiber';
import { MathUtils } from 'react-pixi-fiber/three';
import type { Mesh } from 'react-pixi-fiber/three';

function useSimulation(raw: RefObject<(Mesh | null)[]>, smooth: RefObject<(Mesh | null)[]>) {
  const sim = useRef({ previous: initialBodies(), current: initialBodies() });
  const { scheduler } = useFrame();

  useLayoutEffect(() => {
    scheduler.setPhaseTimestep('physics', 1 / 10);
    return () => scheduler.setPhaseTimestep('physics', 1 / 60);
  }, [scheduler]);

  useFrame(
    (_, dt) => {
      sim.current.previous = sim.current.current.map((body) => ({ ...body }));
      step(sim.current.current, dt);
    },
    { phase: 'physics' },
  );

  useFrame(
    ({ overstep }) => {
      sim.current.current.forEach((body, i) => {
        const previous = sim.current.previous[i];
        raw.current[i]?.position.set(body.x, body.y, 0);
        smooth.current[i]?.position.set(
          MathUtils.lerp(previous.x, body.x, overstep),
          MathUtils.lerp(previous.y, body.y, overstep),
          0,
        );
      });
    },
    { phase: 'update' },
  );
}
```

A phase of your own goes between the built-in ones. A follow camera that must see the smoothed position runs after `update`:

<!-- snippet: examples/canvas/frame-phases.example.tsx#phases -->

```tsx
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from 'react-pixi-fiber';
import { MathUtils } from 'react-pixi-fiber/three';
import type { Group } from 'react-pixi-fiber/three';

function useFollowCamera(target: RefObject<Group>) {
  const physics = useRef({ previous: 0, current: 0 });
  const { scheduler } = useFrame();

  useLayoutEffect(() => {
    if (!scheduler.hasPhase('camera')) scheduler.addPhase('camera', { after: 'update', before: 'render' });
    scheduler.setPhaseTimestep('physics', 1 / 15);
    return () => scheduler.setPhaseTimestep('physics', 1 / 60);
  }, [scheduler]);

  useFrame(
    ({ elapsed }) => {
      physics.current.previous = physics.current.current;
      physics.current.current = elapsed * ORBIT_SPEED;
      place(target.current, physics.current.current);
    },
    { phase: 'physics' },
  );

  useFrame(
    ({ overstep }) => {
      const { previous, current } = physics.current;
      place(target.current, MathUtils.lerp(previous, current, overstep));
    },
    { phase: 'update' },
  );

  useFrame(
    ({ camera }) => {
      const { x, z } = target.current.position;
      const angle = -target.current.rotation.y;
      camera.position.set(x + Math.sin(angle) * CAMERA_DISTANCE, CAMERA_HEIGHT, z - Math.cos(angle) * CAMERA_DISTANCE);
      camera.lookAt(x, 0.35, z);
    },
    { phase: 'camera' },
  );
}
```

## Pixel ratio and size

`dpr={1.5}` fixes the pixel ratio; `dpr={[1, 2]}` clamps the display's into the range and follows it when the window moves to another display. `width` and `height` fix the drawing size and stop the canvas following its parent. Without them it follows its parent's size as the parent resizes.

## Custom roots

`createRoot(canvas)` renders into a canvas you own, with the same options as `<Canvas>` passed to `configure`. You size it yourself:

```tsx
import { createRoot, events } from 'react-pixi-fiber';

const root = createRoot(document.querySelector('canvas')!);
const config = { events, camera: { position: [0, 0, 50] as [number, number, number] } };

await root.configure(config);
window.addEventListener('resize', () =>
  root.configure({ ...config, size: { width: innerWidth, height: innerHeight, top: 0, left: 0 } }),
);
root.render(<App />);
```

As in r3f, `configure` replaces the configuration, so keep one object and spread it into every call.
