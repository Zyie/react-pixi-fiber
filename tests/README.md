# Tests

Tests run in real Chromium with WebGL and WebGPU enabled, not jsdom. Pick the first kind that can show what you changed:

| Kind         | File                                  | Proves                                                                                 |
| ------------ | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Scene        | `tests/scenes/<set>/*.scene.tsx`      | A picture hasn't changed on any renderer, and how far pixi-3d's is from three.js's     |
| Example      | `examples/<topic>/<name>.example.tsx` | The same, for code a docs page quotes                                                  |
| Unit test    | `tests/unit/*.test.tsx`               | Something with no picture to compare: that a mesh was disposed, that a loop ran        |
| Harness test | `tests/harness/__tests__/*.test.tsx`  | The harness itself, such as the playground's input drawing what the tests' input draws |

To add a scene or an example, write only that file. On every run a vitest plugin (`scripts/test/generate-test-wrappers.mts`) writes a gitignored wrapper for it, so each is a test file of its own and they run in parallel: `<name>.scene.test.ts` beside a scene, and `tests/docs/<topic>/<name>.example.test.ts` for an example.

## Where the packages resolve

The tests live at the root, beside the shared harness, the vitest config and the playground: `tests/scenes` and `examples` for every package, `tests/unit` for the unit tests. The scene folders map to the packages: `tests/scenes/3d` and `examples/3d` test `@react-fiber/3d`, with 2d, without threejs-compat; `examples/core` is core's guides, on 2d and 3d without threejs-compat; `tests/scenes/2d` and `examples/2d` test `@react-fiber/2d`; `tests/scenes/mixed` core's bridges with 2d and three's names; and every other folder the r3f API through `@react-fiber/threejs-compat`, measured against three.js. The references of all of them are in `tests/snapshots`.

Which packages a page has installed depends on its vitest project. The `three`, `scenes` and `unit` projects install threejs-compat on every page (`tests/harness/setup/threejs-compat.ts`, their `setupFiles`), as an r3f app does by importing it, since their scenes use three's names without importing anything. The `native` project runs `tests/scenes/3d`, `examples/3d`, `examples/core`, `tests/unit/native` and the synthetic input of the native scenes on pages of its own, where `@react-fiber/3d` is installed (`tests/harness/setup/native.ts`) and `@react-fiber/threejs-compat` and its entries resolve to a module that throws (`tests/harness/no-threejs-compat.ts`): a page that loaded it once would keep three's surface for every test after it. The runner installs `@react-fiber/2d` on every page. `NATIVE_FOLDERS` in `tests/harness/scene-constants.ts` names the native folders of keys.

A scene, an example and a docs page import the packages by name, and nothing else that names a renderer: `@react-fiber/threejs-compat` (r3f's API), `@react-fiber/threejs-compat/three` and `@react-fiber/threejs-compat/addons`, or in 2D and mixed files `@react-fiber/core` and `@react-fiber/2d`. So the same file renders through real three.js when the names point at r3f's own WebGL entry, `legacy.tsx`, at `three` and at three's addons, and that is how parity is measured. `FIBER_TARGETS` in `scripts/test/aliases.mts` names both families' targets, and every vitest project and the playground read them from there:

| Specifier                            | `pixi` family (`scenes`, `unit`, pixi playground frames) | `three` family (`three` project, three.js playground frame)  |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------ |
| `@react-fiber/threejs-compat`        | `packages/threejs-compat/src/index.ts`                   | `packages/r3f/src/legacy.tsx`, three.js `WebGLRenderer`      |
| `@react-fiber/threejs-compat/three`  | `packages/threejs-compat/src/three.ts`                   | `three`                                                      |
| `@react-fiber/threejs-compat/addons` | `packages/threejs-compat/src/addons/index.ts`            | `tests/harness/three-addons.ts`, re-exporting `three/addons` |
| `@react-fiber/core`                  | `packages/core/src/index.tsx`                            | `packages/r3f/src/legacy.tsx`                                |
| `@react-fiber/2d`                    | `packages/2d/src/index.ts`                               | `tests/harness/pixi-only.ts`, an empty module                |

Both families sit on the same forked r3f core, so a hook a scene imports is the same function under either. The harness's runner imports `createRoot` from `@react-fiber/core` and imports `@react-fiber/2d` to install it for every scene; on three.js they are r3f's entry and the empty module. The type checker reads the package names from `tsconfig.base.json`, on the `pixi` side; a unit test reaches threejs-compat's internals through `~threejs-compat/` (`tsconfig.json` and `vitest.config.ts`).

## Visual scenes

Each `tests/scenes/**/*.scene.tsx` exports a `scene`. Its `render()` returns what an r3f `<Canvas>` would hold: three.js element names and hooks from `@react-fiber/threejs-compat`.

```tsx
import { useFrame } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';

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

A scene imports `react`, `@react-fiber/threejs-compat`, its `/three` and `/addons`, and `@test-scene`, and nothing from `three` or `@pixi/3d` directly: either would tie it to one renderer, and it runs on both. Classes, math and constants come from `@react-fiber/threejs-compat/three` (`import { Color, Vector3 } from '@react-fiber/threejs-compat/three'`), which is `three` itself on the three.js side, and addons from `@react-fiber/threejs-compat/addons`. A scene names only what both sides have: r3f's API, three's element names and the classes `@react-fiber/threejs-compat/three` shares with `three`. The packages' own extras, such as `PixiRenderer` or @react-fiber/3d's element names (`<cubeGeometry3D>`, `<material3D>`), exist only on pixi-3d, so a scene that uses them skips three.js and sets `parity: false`, as `tests/scenes/core/native-names.scene.tsx` does.

### @react-fiber/3d's scenes

A scene of @pixi/3d's own elements goes in `tests/scenes/3d` (`3d/events`, `3d/assets`, `3d/mixed` for 2D with them and the bridges). It imports `@react-fiber/core` for hooks and types, `@pixi/3d` for classes and types (`Mesh3D`, `Plane`), `pixi.js`, and nothing from threejs-compat. It is `PIXI_ONLY` without saying so, runs in the `native` project, and is held to its own WebGL and WebGPU references, which should agree. The default camera is core's @pixi/3d camera, r3f's fov of 50 at z 5, so a unit at z = 0 is about 64 pixels of the 400 by 300 canvas.

```tsx
import type { TestScene } from '@test-scene';

export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-40, 30, 0]} intensity={3} />
      <mesh3D rotation={[0.5, 0.7, 0]}>
        <cubeGeometry3D />
        <material3D baseColor="#4f86f7" roughness={0.6} metallic={0} />
      </mesh3D>
    </>
  ),
};
```

### 2D and mixed scenes

pixi.js 2D has no three.js counterpart, so a scene with 2D elements in it has nothing to measure parity against. Put it in a 2D folder: `tests/scenes/2d` for 2D alone (a subfolder per feature, such as `2d/graphics`, `2d/filters` or `2d/animated-sprite`), `tests/scenes/mixed` for 2D with 3D, including the bridges (`mixed/anchors`, `mixed/view3d`, `mixed/layer3d`, `mixed/render-texture` and their `-events` scenes), and `examples/2d` for a docs example. Their scenes are `PIXI_ONLY` without saying so (`PIXI_ONLY_FOLDERS` in `tests/harness/scene-constants.ts`, applied by `withFolderDefaults`): they skip three.js and leave out the parity comparison, the `three` project doesn't load them, and the playground's three.js frame shows them as skipped. Such a scene may import `pixi.js` (`Texture`, `Rectangle`, types), `pixi-filters`, and the packages' own names, from `@react-fiber/core` (hooks, `ThreeEvent2D`, `View3D`, `Layer3D`, `RenderTexture2D`) and `@react-fiber/2d` (`useAsset`), which a parity scene can't. A 2D scene anywhere else spreads `PIXI_ONLY` from `@test-scene` into its object.

Each is held to its own WebGL and WebGPU references, which should agree with each other: when you write one, look at both, and compare them (the playground's Diff between pixi WebGL and pixi WebGPU). A 2D element's `x` and `y` are CSS pixels from the canvas's top-left corner, so `mouse.move(x, y)` in `act` lands on it at the same numbers.

```tsx
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

export const scene: TestScene = {
  render: () => <sprite2D texture={Texture.WHITE} tint="orange" width={80} height={80} x={20} y={20} />,
};
```

For each renderer of the vitest project, the harness (`tests/harness/scene-runner.tsx`):

1. Puts a 400 by 300 canvas at a device pixel ratio of 1 on the page, over a black background. Both renderers clear to transparent, so the black shows through.
2. Creates a root with `createRoot` from `@react-fiber/threejs-compat`, `frameloop: 'never'`, r3f's pointer events and the scene's `canvas` props, and renders the scene. It waits for anything the scene suspends on, such as a texture.
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
- `parity`: `false` leaves the scene out of the three.js comparison; `{ maxDiff }` sets how far from three.js it may be, 2% of drawn pixels when omitted.

`tests/harness/scene-runner.tsx` documents each option. The playground builds scenes through the same `mountScene`, so a scene looks the same in both.

A scene imports the harness as `@test-scene` (`tests/harness/scene.ts`), which imports neither vitest nor anything that does, because the playground loads scene files too. Tests import it as `@test-utils` (`tests/harness/test-utils.tsx`), which is all of it.

### Interaction scenes

`act` gets the scene's input and its root state. The state is how a scene reaches what input can't: `state.setEvents`, `state.events.connect` and `update`, or a DragEvent or `pointercancel` dispatched on `state.events.connected`:

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

- `mouse.move`, `down`, `up`, `click(x, y)`, `wheel(dx, dy)`, `contextMenu(x, y)` (a right-button press and release) and `doubleClick(x, y)`. A move to a point off the canvas, such as `move(450, 150)`, takes the mouse off it, so the canvas gets a `pointerleave`. In the tests the input is real: Playwright moves the mouse over the canvas, and each call resolves once the page has handled the event. r3f raycasts a pointer event as it arrives when the frameloop is `never`, so a handler has run by the time the call resolves; its state change shows on the next frame.
- `frames(count, step)` advances the root. The clock only moves here. Before each frame it lets React commit what is pending, so a state change `act` sets off outside a DOM event, such as a hover from `state.events.update()`, shows on that frame.
- `update(children)` renders new JSX into the root, which is how a scene shows a prop change or a child inserted before a sibling.

The playground can't reach Playwright, so it drives `act` with DOM events dispatched on the canvas. `tests/harness/__tests__/synthetic-input.test.tsx` holds every scene with an `act`, driven that way, to the reference the Playwright-driven test wrote, so the two can't drift apart; `synthetic-input-native.test.tsx` does the same for the native scenes in the `native` project (both through `tests/harness/synthetic-input-tests.tsx`). A `click` and a `contextmenu` are dispatched as PointerEvents, as Chrome sends them, because r3f matches a click to its pointerdown by `pointerId`, and a `dblclick` as a plain MouseEvent, as Chrome sends it. A release over the canvas clicks wherever the press was, as in Chrome. Off the canvas, moves reach it only while the button is down, as a drag that captured the pointer would.

Test files share a page and Playwright's mouse stays where the last scene left it. Before and after every scene the harness releases a button that is still down and moves the mouse off the page.

## Examples

An example is the code a docs page quotes, in the shape of a scene. Each `examples/<topic>/<name>.example.tsx` exports `example: Example` (`examples/example.tsx`):

```tsx
// #region result
import { Canvas } from '@react-fiber/threejs-compat';
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

- **Format.** `Example` is `render`, plus any of `camera`, `canvas`, `frames`, `act`, `parity`, `pixelMatch`, `skip` and `fails`, with the meanings a scene gives them, and a `title` and `description` for the docs' gallery. `render()` returns the children of a `<Canvas>`, `camera` is the Canvas's `camera` prop and `canvas` more of its props. An example takes the default 400 by 300 canvas; it has no `size`.
- **Topic.** A topic folder named like a guide's id (`your-first-scene`, `basic-animations`, `events-and-interaction`, `loading-models`, `loading-textures`) links that guide from the example's page. `examples/2d`, `examples/3d` and `examples/core` hold the examples of those packages' guides, each quoted by region from its guide; `examples/3d` and `examples/core` import only `@react-fiber/core`, `@react-fiber/2d`, `@react-fiber/3d`, `@pixi/3d` and `pixi.js`, and run in the `native` project.
- **Regions.** `// #region <name>` and `// #endregion <name>` mark the code a page quotes. A name may mark several blocks of a file, which read as one in their order, so a region can take an import from the top of the file and a component from further down. Code outside every region, such as `import type { Example }` and the `example` export, is never shown.
- **Key and pictures.** An example runs as a scene keyed `docs/<topic>/<name>`. Its reference images are `tests/snapshots/docs/<topic>/<name>.webgl.png`, `.webgpu.png` and `.three.png`, each 400 by 300, and its parity composite after a run is `.temp/parity/docs/<topic>/<name>.png`.
- **Live.** `runExample(example, renderer, host)` mounts the example in a `<Canvas>` that fills `host`, on r3f's default frameloop, as an app would run it, on `webgl`, `webgpu` or `three`. It returns a function that unmounts it.
- **Playground.** `/scene-frame.html?kind=example&id=<topic>/<name>&renderer=webgl|webgpu|three&live` runs it live on one renderer.

`examples/your-first-scene/first-scene.example.tsx` is r3f's "Your first scene" tutorial with the import swapped, ending on `meshPhongMaterial` as the tutorial does.

## Parity with three.js

The `three` project renders every scene and example through r3f's own `legacy.tsx` on three.js and holds the picture to `tests/snapshots/<key>.three.png` like any other reference, writing it when it's missing and rewriting it under `--update`. The pixi-3d tests measure against that reference on disk, not against the capture. The `three` project runs before the `scenes` project, so in a full run the reference has just been checked against what three.js draws now. When three's picture moves by more than `pixelMatch`, its test fails, and pixi-3d is measured against the old reference until you update it.

On each pixi-3d renderer, a scene's capture is measured against its three.js picture:

- Two pixels differ when pixelmatch says so at a threshold of 0.05 (`PARITY_THRESHOLD` in `tests/harness/parity-metric.ts`), which lets a grey be about 13 levels off. Shading that is close counts as the same; a face lit a fifth darker, another colour, or a missing or moved object doesn't. Pixels pixelmatch takes for anti-aliasing don't count.
- A pixel is drawn when it isn't the black background in at least one of the two pictures.
- The parity diff is the share of drawn pixels that differ, from 0 to 1. A scene fails when more than 2% of its drawn pixels differ on either pixi-3d renderer (`DEFAULT_PARITY_MAX_DIFF` in `tests/harness/scene-constants.ts`), or more than its own `parity: { maxDiff }`.

At the end of a run the reporter prints a table, and writes the same to `.temp/parity/summary.json`:

```
Parity with three.js: the share of drawn pixels that differ (pixelmatch threshold 0.05)
scene                              webgl  webgpu  maxDiff  parity
---------------------------------  -----  ------  -------  --------------
assets/use-texture                 2.4%   2.4%    5.0%     within maxDiff
docs/your-first-scene/first-scene  0.0%   0.0%    2.0%     within maxDiff
object/sheared-normals             27.5%  27.2%   2.0%     over maxDiff
```

### Reading a parity composite

Each scene that ran on pixi-3d gets `.temp/parity/<key>.png`, four panels, left to right:

1. **pixi webgl**: this library's capture on pixi-3d's WebGL renderer.
2. **pixi webgpu**: the same on WebGPU.
3. **three**: the three.js reference on disk, `tests/snapshots/<key>.three.png`, which the `three` project checked earlier in a full run.
4. **diff**: pixi WebGL against three.js (pixi WebGPU when WebGL didn't run), with the share in its title. Red pixels differ, yellow ones are anti-aliasing, and the rest are a faded grey of the pixi picture.

Read it in that order. A red patch where both pictures draw the same shape is shading or colour: lighting calibration, tone mapping, colour management. A red outline or a red shape that is in one picture only is geometry, a transform, or something not drawn at all: a missing alias, prop or feature.

A scene whose pixi pictures can't match three.js yet because of a known gap marks its pixi renderers `fails`, with the gap in a comment, as `tests/scenes/object/sheared-normals.scene.tsx` does for lighting under a sheared transform, which pixi-3d's normal transform gets wrong. The day the gap closes, its reference comparison fails, and the references are updated and the mark removed. A scene that comes close but can't match exactly sets its own `maxDiff`, as `tests/scenes/assets/use-texture.scene.tsx` does for texture filtering.

## Running tests

```sh
npm run test:visual   # every scene and example, on three.js then pixi-3d, and the native scenes
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

Run the `three` project too when you want a fresh parity number; the `scenes` project alone measures against the three.js references on disk. A native scene runs in the `native` project: `npx vitest run --browser.headless --project native tests/scenes/3d/basic.scene.test.ts`. Every run writes its full results to `.temp/vitest-last.json`.

## References

A scene's references are `tests/snapshots/<key>.webgl.png`, `<key>.webgpu.png` and `<key>.three.png`. A reference that no scene or example compares stops vitest from starting, with the list of them: delete it, or bring the scene back.

A scene with no reference writes one on its first local run and passes. Open each image and check it shows what the scene should draw before you commit it: from then on the test only says nothing changed. A parity composite holds all three of a scene's pictures, so it's the quickest way to look. On CI a missing reference fails the test.

After an intended change, add `--update=true` to the single-scene command to rewrite that scene's references, then look at them. `npm run test:update` does it for every scene. A test lets colours a few levels off pass (pixelmatch's threshold of 0.1), so update mode holds a reference to a tighter one, 0.02 (`UPDATE_THRESHOLD` in `scripts/test/browser-commands.mts`), and rewrites it when more than `pixelMatch` pixels are off by about 5 grey levels or more; a reference that still matches is left untouched.

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

A unit test is for what no picture shows: that `@react-fiber/threejs-compat/three`'s math gives three's numbers (`tests/unit/three-math.test.ts` runs each call on both and imports `three` to do it, which a scene never does), that a mesh, its geometry and its material were destroyed on unmount, that a re-render kept the same object, that `<Canvas>` measured its parent and ran the real `requestAnimationFrame` loop, that camera matrices are ready before the first frame, that the renderer keeps and releases one view per scene, that the canvas clears to transparent, that 2D elements and a root's 2D frame jobs are freed with it and that 2D text follows the root's pixel ratio (`tests/unit/two-d.test.tsx`), that importing and rendering the packages changes no prototype of pixi.js's classes (`tests/unit/pixi-prototypes.test.tsx`, which runs in a frame of its own, with a pixi.js no other test file has touched), and that each bridge frees its anchor, embedded view or render target on unmount (`tests/unit/bridges.test.tsx`); and, in `tests/unit/native`, which the `native` project runs, that a root without threejs-compat gets core's @pixi/3d classes and nothing of three's on @pixi/3d's prototypes, and that @react-fiber/3d's elements are destroyed on unmount. They run in the `unit` project on pixi-3d, after the scenes, because the loop stalls while other pages hold the GPU. A unit test imports the packages as an app does: one that renders 2D imports `@react-fiber/2d`, since it doesn't go through the scene runner, which installs it. A test that uses React's `act` sets `globalThis.IS_REACT_ACT_ENVIRONMENT = true`; one that runs the real loop sets it to `false` and waits with `vi.waitFor`.

## Assets

Scenes load textures from `tests/assets`, which vitest and the playground both serve at `/`: `tests/assets/textures/quadrants.png` is `/textures/quadrants.png`. 2D scenes load the spritesheets `/sprites/walk.json` (animation `walk`) and `/sprites/coin.json` (animation `spin`), the bitmap font `/fonts/blocks.fnt`, the textures `/textures/panel.png` and `/textures/bricks.png`, and the video `/video/steps.webm` with `useAsset`. Nothing is fetched from the network. `scripts/test/make-assets.mts` writes the models in `tests/assets/models` and the textures besides `quadrants.png` from code, so every file there is the repo's own; run it again after changing it, and look at the scenes that load what changed. A scene that loads a file `useLoader` caches by URL shares it with every scene on the page, so give its URL a query of its own (`/models/box.glb?primitive`).

## The playground

`npm start` serves `playground/` on http://localhost:5181. It lists every scene and example, 2D ones included, and builds the one you pick three times, each in a hidden frame of its own on the runner the tests use: pixi WebGL, pixi WebGPU and three.js, side by side. Diff compares any two of them and measures the difference as the tests measure parity. Each pane's `open` link shows that frame on its own, and an example's `live` link runs it as an app.

A frame installs threejs-compat before it loads a scene, or `@react-fiber/3d` for a native one, as the vitest projects do. A frame on three.js loads its entry with `?fiber=three`. The playground's Vite plugin carries that query through every script the frame reaches outside `node_modules`, so those modules are copies of their own in that frame and the packages' names resolve to `FIBER_TARGETS.three` there. Frames are built one after another, since each loads pixi-3d and r3f from source.
