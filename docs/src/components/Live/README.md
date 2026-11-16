# Live code

Every example on the site runs in the page on the repo's own build of react-pixi-fiber and the pinned @pixi/3d and pixi.js, served from the site itself. `<Example>` is built from the parts here.

## How a run works

- `docs/scripts/generators/live.mts` writes `docs/static/runtime` at sync time:
  - `docs/static/runtime/js/`: ES modules of `react-pixi-fiber` (from its entry in `src`), `@pixi/3d`, `@pixi/3d/extras`, `pixi.js`, `react`, `react/jsx-runtime`, `react-dom` and `react-dom/client`, and the frame's own module, `frame/frame.ts`.
  - `docs/static/runtime/assets/`: the images and models of `tests/assets`, when there is one, registered with PixiJS's `Assets` under their names.
  - `docs/static/runtime/manifest.json`: the files of each of these, which the site's bundle imports.
- `runtime.ts` runs a program in a sandboxed iframe with an opaque origin (`sandbox="allow-scripts"`). The frame imports the runtime's modules from the site by URL, so the browser caches them across runs and pages; the server has to send `Access-Control-Allow-Origin: *` for them, as GitHub Pages and the dev server do. The page posts only the program and the files it imports by a relative path, as blobs. The frame's import map names each module's URL; chunks import each other by relative path.
- `frame/frame.ts` reports console calls and errors, with the error's line in the program, and tells the page when a pixi renderer first draws, and which one. It then imports the program and hands it to `frame/mount.tsx`, which renders the example's `render()` inside a `<Canvas>`, or the `<Canvas>` it returns, with the renderer the page chose in its `renderer` prop. The visual harness that draws the reference pictures mounts examples too; the two must agree on what an example exports.
- `compile.ts` turns TypeScript and TSX into JavaScript with sucrase, line for line, so an error's line is a line of the source. An example's program is compiled at build time (`ExampleSource.compiled`), so a run downloads no compiler.

## Components

Import each from its file, such as `import Runner from '@site/src/components/Live/Runner'`. `<Example>` loads the runner and the console as one chunk (`docs/src/components/Example/live.ts`) when a reader first points at an example, so a page that only shows examples doesn't carry them.

### `<Runner>`

| Prop         | Type                            |                                                                                                                      |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `code`       | `string`                        | The program, TypeScript or TSX. A change runs it again in a new frame, which replaces the old one once it has drawn. |
| `language`   | `'ts' \| 'tsx'`                 |                                                                                                                      |
| `compiled`   | `string?`                       | `code` compiled already. Without it, the runner loads the compiler.                                                  |
| `files`      | `Record<string, string>?`       | The text of each file the program imports by a relative path, such as `{ './theme.css?raw': '...' }`.                |
| `renderer`   | `'webgl' \| 'webgpu'`           | A change runs the program again.                                                                                     |
| `runKey`     | `number?`                       | A change runs the same program again.                                                                                |
| `title`      | `string`                        | The frame's accessible name.                                                                                         |
| `fileName`   | `string?`                       | The program's name in an error's stack.                                                                              |
| `onStatus`   | `(status: RunStatus) => void`   | Its `state`: `loading`, `running` (with the `renderer` pixi used), `ran` or `error` (with the `error`).              |
| `onConsole`  | `(entry: ConsoleEntry) => void` | Each console call.                                                                                                   |
| `onRun`      | `() => void`                    | Each run starting: the time to clear a console.                                                                      |
| `showErrors` | `boolean?`                      | Whether an error shows over the frame; true by default.                                                              |
| `children`   | `ReactNode`                     | Drawn over the frame.                                                                                                |

The runner fills its box: give it a size. An error holds (`statusAfter` in `status.ts`): a program that throws once its canvas exists still draws a frame, and the run stays `error`. A run that has drawn nothing 400 ms after the program ran reports `ran`, so it doesn't look stuck loading.

### The rest

- `<Console entries open? onToggle? onClear?>`: a console. With `onToggle`, its header opens and closes the list; without it, it's a pane whose list always shows and fills its box. `children` go at the end of its header.
- `useRenderer()`: the reader's renderer and what chooses it, shared by every live example through Docusaurus's storage. It's WebGL until they choose, since the reference pictures are WebGL's.
- `<RendererSwitch value onChange>`: the WebGL and WebGPU switch. `RENDERER_LABELS`, `rendererLabel(name)` and `isRenderer(value)` in `types.ts` name and check renderers.
- `useCopy()`, `useResizeHandle()` and `useBrowserValue()`: what the site's components share for a copy button, a handle that resizes and a value only the browser knows. `Icons.tsx` has every icon.
- `prefetchRuntime(baseUrl)`: starts a first run's downloads, as `<link rel="prefetch">`, when a pointer reaches a button that runs a program.

## Not here yet

Editing an example in the page. Layout's site runs Monaco, with the type definitions of every package a program imports, in a build of its own. `ExampleSource.program` is the whole file and `focus` the lines of the region a page shows, which is what such an editor opens with; the runner already runs edited code, compiling it in the page.
