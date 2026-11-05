# Tests

Tests run in real Chromium with WebGL and WebGPU enabled, not jsdom. Pick the first kind that can show what you changed:

| Kind         | File                                  | Proves                                                                                 |
| ------------ | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Scene        | `tests/scenes/<set>/*.scene.tsx`      | A picture hasn't changed on any renderer, and how far pixi-3d's is from three.js's     |
| Example      | `examples/<topic>/<name>.example.tsx` | The same, for code a docs page quotes                                                  |
| Unit test    | `tests/unit/*.test.tsx`               | Something with no picture to compare: that a mesh was disposed, that a loop ran        |
| Harness test | `tests/harness/__tests__/*.test.tsx`  | The harness itself, such as the playground's input drawing what the tests' input draws |

To add a scene or an example, write only that file. On every run a vitest plugin (`scripts/test/generate-test-wrappers.mts`) writes a gitignored wrapper for it, so each is a test file of its own and they run in parallel: `<name>.scene.test.ts` beside a scene, and `tests/docs/<topic>/<name>.example.test.ts` for an example.

## Where `react-pixi-fiber` resolves

A scene, an example and a docs page import the library by its package name and nothing else that names a renderer. So the same file renders through real three.js when the name points at r3f's own WebGL entry, `legacy.tsx`, and that is how parity is measured. `FIBER_TARGETS` in `scripts/test/aliases.mts` names both targets, and every vitest project and the playground read them from there:

| Where                            | `react-pixi-fiber` is | Renderers                     |
| -------------------------------- | --------------------- | ----------------------------- |
| vitest project `three`           | `FIBER_TARGETS.three` | three.js `WebGLRenderer`      |
| vitest projects `scenes`, `unit` | `FIBER_TARGETS.pixi`  | pixi-3d on WebGPU, then WebGL |
| playground frame on `three`      | `FIBER_TARGETS.three` | three.js                      |
| any other playground frame       | `FIBER_TARGETS.pixi`  | pixi-3d                       |

Both targets sit on the same vendored r3f core, so a hook a scene imports is the same function under either. The type checker reads the package name from `tsconfig.json`.

## Visual scenes

Each `tests/scenes/**/*.scene.tsx` exports a `scene`. Its `render()` returns what an r3f `<Canvas>` would hold: three.js element names and hooks from `react-pixi-fiber`.

```tsx
import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';
import { useFrame } from 'react-pixi-fiber';

function Spinner() {
  const mesh = useRef<ElementRef<'mesh'>>(null);

  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#5ec27a" />
    </mesh>
  );
}

export const scene: TestScene = {
  frames: 46,
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} />
      <Spinner />
    </>
  ),
};
```

A scene imports `react`, `react-pixi-fiber` and `@test-scene`, and never `three` or `@pixi/3d`: either would tie it to one renderer, and it runs on both. It names only what both entries have: r3f's API and three's element names. The library's own extras, such as its catalog classes or pixi-3d's element names (`<cubeGeometry>`, `<material3D>`), exist only on pixi-3d, so a scene that uses them skips three.js and sets `parity: false`, as `tests/scenes/core/native-names.scene.tsx` does.

For each renderer of the vitest project, the harness (`tests/harness/scene-runner.tsx`):

1. Puts a 400 by 300 canvas at a device pixel ratio of 1 on the page, over a black background. Both renderers clear to transparent, so the black shows through.
2. Creates a root with `createRoot` from `react-pixi-fiber`, `frameloop: 'never'`, r3f's pointer events and the scene's `canvas` props, and renders the scene. It waits for anything the scene suspends on, such as a texture.
3. Holds `performance.now()` still, and advances the root by `frames` frames, each a sixtieth of a second of the scene's clock after the one before. The first frame has a delta of 0. Nothing moves between frames, so the picture doesn't depend on how fast the machine ran.
4. Runs `act`, if there is one, then advances one more frame.
5. Captures the canvas and compares it with `tests/snapshots/<key>.<renderer>.png`. On a pixi-3d renderer it then measures the capture against `tests/snapshots/<key>.three.png` (see "Parity with three.js").

A scene's key is its path under `tests/scenes` without `.scene.tsx`: `tests/scenes/core/use-frame.scene.tsx` is `core/use-frame`.

Every scene can also set:

- `size`: `{ width, height, dpr }` of the canvas, in CSS px.
- `camera`: the default camera, as `<Canvas camera>` takes it. r3f's default is a perspective camera with a fov of 50 at z 5, aimed at the origin.
- `canvas`: more root props, as `<Canvas>` takes them: `renderer` settings such as `{ shadows: true }`, `orthographic` and `scene`. The harness hands the renderer settings to each entry where it reads them: as `renderer` to this library, with pixi-3d's backend added, and as `gl` to r3f's WebGL entry, which rejects `renderer`.
- `frames`: how many frames to advance before the capture, or before `act`. The default is 1.
- `act`: drives the scene before it is captured. See "Interaction scenes".
- `pixelMatch`: how many pixels may differ from the reference image. The default is 16. Raise it for one scene only when a GPU draws that scene differently.
- `skip`: `{ reason, renderers? }` skips the scene on the listed renderers, or on all of them. The reason is in the test's title.
- `delay`: milliseconds to wait between the last frame and the capture.
- `fails`: marks a scene that can't pass yet. See "Expected failures".
- `parity`: `false` leaves the scene out of the three.js comparison; `{ maxDiff }` fails it when it is further from three.js than that.

`tests/harness/scene-runner.tsx` documents each option. The playground builds scenes through the same `mountScene`, so a scene looks the same in both.

A scene imports the harness as `@test-scene` (`tests/harness/scene.ts`), which imports neither vitest nor anything that does, because the playground loads scene files too. Tests import it as `@test-utils` (`tests/harness/test-utils.tsx`), which is all of it.

### Interaction scenes

`act` gets the scene's input and its root state:

```tsx
export const scene: TestScene = {
  render: () => <HoverBox />,
  act: async ({ mouse, frames, update }) => {
    await mouse.move(295, 150); // CSS px from the canvas's top-left corner
    await frames(); // one frame; frames(30, 20) is 30 frames 20 ms apart
    await update(<HoverBox color="orange" />); // a second root.render(), resolved once React has committed
  },
};
```

- `mouse.move`, `down`, `up`, `click(x, y)` and `wheel(dx, dy)`. In the tests the input is real: Playwright moves the mouse over the canvas, and each call resolves once the page has handled the event. r3f raycasts a pointer event as it arrives when the frameloop is `never`, so a handler has run by the time the call resolves; its state change shows on the next frame.
- `frames(count, step)` advances the root. The clock only moves here.
- `update(children)` renders new JSX into the root, which is how a scene shows a prop change or a child inserted before a sibling.

The playground can't reach Playwright, so it drives `act` with DOM events dispatched on the canvas. `tests/harness/__tests__/synthetic-input.test.tsx` holds every scene with an `act`, driven that way, to the reference the Playwright-driven test wrote, so the two can't drift apart. A `click` is dispatched as a PointerEvent, as Chrome sends it, because r3f matches a click to its pointerdown by `pointerId`.

Test files share a page and Playwright's mouse stays where the last scene left it. Before and after every scene the harness releases a button that is still down and moves the mouse off the page.

## Examples

An example is the code a docs page quotes, in the shape of a scene. Each `examples/<topic>/<name>.example.tsx` exports `example: Example` (`examples/example.tsx`):

```tsx
// #region result
import { Canvas } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  return (
    <>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </>
  );
}
// #endregion result

// #region result
export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
// #endregion result

export const example: Example = {
  render: () => <Scene />,
};
```

What the docs site can rely on:

- **Format.** `Example` is `render`, plus any of `camera`, `canvas`, `frames`, `act`, `parity`, `pixelMatch`, `skip` and `fails`, with the meanings a scene gives them. `render()` returns the children of a `<Canvas>`, `camera` is the Canvas's `camera` prop and `canvas` more of its props. An example takes the default 400 by 300 canvas; it has no `size`.
- **Topic.** A topic folder named like a guide's id (`your-first-scene`, `basic-animations`, `events-and-interaction`, `loading-models-and-textures`) links that guide from the example's page.
- **Regions.** `// #region <name>` and `// #endregion <name>` mark the code a page quotes. A name may mark several blocks of a file, which read as one in their order, so a region can take an import from the top of the file and a component from further down. Code outside every region, such as `import type { Example }` and the `example` export, is never shown.
- **Key and pictures.** An example runs as a scene keyed `docs/<topic>/<name>`. Its reference images are `tests/snapshots/docs/<topic>/<name>.webgl.png`, `.webgpu.png` and `.three.png`, each 400 by 300, and its parity composite after a run is `.temp/parity/docs/<topic>/<name>.png`.
- **Live.** `runExample(example, renderer, host)` mounts the example in a `<Canvas>` that fills `host`, on r3f's default frameloop, as an app would run it, on `webgl`, `webgpu` or `three`. It returns a function that unmounts it.
- **Playground.** `/scene-frame.html?kind=example&id=<topic>/<name>&renderer=webgl|webgpu|three&live` runs it live on one renderer.

`examples/your-first-scene/first-scene.example.tsx` is r3f's "Your first scene" tutorial with the import swapped. It uses `meshStandardMaterial`, from the tutorial's first step, where the tutorial ends on `meshPhongMaterial`, which the catalog doesn't have yet.

## Parity with three.js

The `three` project renders every scene and example through r3f's own `legacy.tsx` on three.js and records `tests/snapshots/<key>.three.png`, held to its reference like any other picture. It runs before the `scenes` project, so the pixi-3d tests of the same run measure against fresh pictures.

On each pixi-3d renderer, a scene's capture is measured against its three.js picture:

- Two pixels differ when pixelmatch says so at a threshold of 0.05 (`PARITY_THRESHOLD` in `tests/harness/parity-metric.ts`), which lets a grey be about 13 levels off. Shading that is close counts as the same; a face lit a fifth darker, another colour, or a missing or moved object doesn't. Pixels pixelmatch takes for anti-aliasing don't count.
- A pixel is drawn when it isn't the black background in at least one of the two pictures.
- The parity diff is the share of drawn pixels that differ, from 0 to 1. A scene with `parity: { maxDiff: 0.1 }` fails when more than 10% of its drawn pixels differ on either pixi-3d renderer. Without `maxDiff` the diff is only reported.

At the end of a run the reporter prints a table, and writes the same to `.temp/parity/summary.json`:

```
Parity with three.js: the share of drawn pixels that differ (pixelmatch threshold 0.05)
scene                              webgl  webgpu  maxDiff  parity
---------------------------------  -----  ------  -------  --------------
assets/use-texture                 2.4%   2.4%    5.0%     within maxDiff
core/alias-catalog                 34.4%  34.4%   -        reported only
docs/your-first-scene/first-scene  0.0%   0.0%    -        reported only
```

### Reading a parity composite

Each scene that ran on pixi-3d gets `.temp/parity/<key>.png`, four panels from this run, left to right:

1. **pixi webgl**: this library's capture on pixi-3d's WebGL renderer.
2. **pixi webgpu**: the same on WebGPU.
3. **three**: three.js's picture, `tests/snapshots/<key>.three.png`.
4. **diff**: pixi WebGL against three.js (pixi WebGPU when WebGL didn't run), with the share in its title. Red pixels differ, yellow ones are anti-aliasing, and the rest are a faded grey of the pixi picture.

Read it in that order. A red patch where both pictures draw the same shape is shading or colour: lighting calibration, tone mapping, colour management. A red outline or a red shape that is in one picture only is geometry, a transform, or something not drawn at all: a missing alias, prop or feature.

A scene whose pixi pictures can't match three.js yet because of a known gap sets `maxDiff` and marks its pixi renderers `fails`. The day the gap closes, its reference comparison fails, and the references are updated and the mark removed. `tests/scenes/assets/use-texture.scene.tsx` carried one until `map` was aliased; it now keeps a `maxDiff` of 5% as a gate.

## Running tests

```sh
npm run test:visual   # every scene and example, on three.js then pixi-3d
npm run test:three    # only the three.js pictures
npm run test:unit     # unit and harness tests
npm run test:update   # rewrite the references the scenes fail on, then look at them
npm test              # lint, types, then every project
```

Run one scene by the full path of its wrapper. Pass the full path, since vitest matches a bare name as a substring. `--project` picks one side and `-t webgl` or `-t webgpu` one renderer:

```sh
npx vitest run --browser.headless tests/scenes/core/use-frame.scene.test.ts
npx vitest run --browser.headless --project scenes -t webgpu tests/docs/your-first-scene/first-scene.example.test.ts
```

Run the `three` project too when you want a fresh parity number; the `scenes` project alone measures against the three.js references on disk. Every run writes its full results to `.temp/vitest-last.json`.

## References

A scene's references are `tests/snapshots/<key>.webgl.png`, `<key>.webgpu.png` and `<key>.three.png`. A reference that no scene or example compares stops vitest from starting, with the list of them: delete it, or bring the scene back.

A scene with no reference writes one on its first local run and passes. Open each image and check it shows what the scene should draw before you commit it: from then on the test only says nothing changed. A parity composite holds all three of a scene's pictures, so it's the quickest way to look. On CI a missing reference fails the test.

After an intended change, add `--update=true` to the single-scene command to rewrite that scene's references, then look at them. `npm run test:update` does it for every scene. Only references the test would fail on are rewritten.

## Expected failures

A scene that can't pass yet carries `fails`, with part of the failure message it gives now, for every renderer or per renderer: `fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' }`. Its tests pass while it fails that way, and the report names them as expected failures. They fail the day the scene passes, and when it starts to fail another way, so a mark can't outlive its reason.

## When a test fails

- **Look at the picture.** A failing scene writes `.pr_uploads/visual/<key>.<renderer>.png`: the expected, actual and diff images side by side. A failing synthetic-input check writes the same under `.pr_uploads/visual/synthetic/`.
- **Look at the composite** for a parity failure, `.temp/parity/<key>.png`, as "Reading a parity composite" describes.
- **Compare the renderers in the playground.** `npm start`, pick the scene, and switch to Diff.
- **`the renderer the scene actually got`** means Chromium gave no WebGPU adapter and pixi fell back to WebGL.
- **`The page never got a pointermove event`** means an interaction scene's input didn't reach the page: the canvas is off screen or something covers it.
- **A timeout while other runs share the machine** is GPU contention. Rerun that file alone before you treat it as a failure.

## Unit tests

A unit test is for what no picture shows: that a mesh, its geometry and its material were destroyed on unmount, that a re-render kept the same object, that `<Canvas>` measured its parent and ran the real `requestAnimationFrame` loop, that camera matrices are ready before the first frame, that the renderer keeps and releases one view per scene, that the canvas clears to transparent. They run in the `unit` project on pixi-3d, after the scenes, because the loop stalls while other pages hold the GPU. A test that uses React's `act` sets `globalThis.IS_REACT_ACT_ENVIRONMENT = true`; one that runs the real loop sets it to `false` and waits with `vi.waitFor`.

## Assets

Scenes load textures from `tests/assets`, which vitest and the playground both serve at `/`: `tests/assets/textures/quadrants.png` is `/textures/quadrants.png`. Nothing is fetched from the network.

## The playground

`npm start` serves `playground/` on http://localhost:5181. It lists every scene and example, and builds the one you pick three times, each in a hidden frame of its own on the runner the tests use: pixi WebGL, pixi WebGPU and three.js, side by side. Diff compares any two of them and measures the difference as the tests measure parity. Each pane's `open` link shows that frame on its own, and an example's `live` link runs it as an app.

A frame on three.js loads its entry with `?fiber=three`. The playground's Vite plugin carries that query through every script the frame reaches outside `node_modules`, so those modules are copies of their own in that frame and `react-pixi-fiber` resolves to `FIBER_TARGETS.three` there. Frames are built one after another, since each loads pixi-3d and r3f from source.
