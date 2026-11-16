# Your first scene

This guide sets up a scene and introduces the core concepts, following react-three-fiber's own first scene with nothing changed but the import. It assumes some React knowledge.

## Setting up the Canvas

Import `<Canvas>` from `@react-fiber/threejs-compat` and put it in your React tree.

```tsx
import { Canvas } from '@react-fiber/threejs-compat';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div id="canvas-container">
      <Canvas />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
```

`<Canvas>` does the setup work behind the scenes:

- It creates a PixiJS renderer, WebGL or WebGPU, and a pixi-3d view with a **scene** and a **camera**, the building blocks of anything it draws.
- It renders the scene every frame, so there's no render loop to write.

> [!NOTE]
> The canvas fills its parent, so size it by sizing the parent, `#canvas-container` here.

## Adding a mesh

To see something, add a `<mesh>`, the lowercase element for a mesh. A mesh holds the geometry and the material of a shape in 3D space. Give it a box geometry and a standard material, which attach to their parent on their own:

```tsx
<Canvas>
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
</Canvas>
```

Nothing needs importing: the elements are three's names, in camelCase, as in react-three-fiber. Behind each is a pixi-3d object. The JSX above does what this does by hand with pixi-3d:

```tsx
import { CubeGeometry, Material3D, Mesh3D, View3D } from '@pixi/3d';
import { autoDetectRenderer, Container } from 'pixi.js';

const renderer = await autoDetectRenderer({ width, height });
const view = new View3D({ width, height });
const stage = new Container();

document.querySelector('#canvas-container').appendChild(renderer.canvas);
stage.addChild(view);

const mesh = new Mesh3D({ geometry: new CubeGeometry(), material: new Material3D() });

view.root.addChild(mesh);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(stage);
}

animate();
```

### Constructor arguments

A box geometry takes its width, height and depth as arguments, as three's `BoxGeometry` does:

```tsx
new BoxGeometry(2, 2, 2);
```

In JSX, the `args` prop holds them, always as an array of the constructor's arguments:

```tsx
<boxGeometry args={[2, 2, 2]} />
```

> [!NOTE]
> Changing `args` constructs the object again.

## Adding lights

Next, put some lights in the canvas:

```tsx
<Canvas>
  <ambientLight intensity={0.1} />
  <directionalLight color="red" position={[0, 0, 5]} />
</Canvas>
```

### Props

Setting a prop on an element sets the property of the same name on the object behind it. `<ambientLight intensity={0.1} />` does what this does:

```tsx
const light = new AmbientLight();

light.intensity = 0.1;
```

The names are three's. Where pixi-3d calls a property something else, such as a standard material's `color`, which pixi-3d calls `baseColor`, the element maps the name, so a prop means what it means in three.js.

### Shortcuts

A prop whose property has a `set` method, such as a vector, takes the arguments of `set`:

```tsx
<directionalLight position={[0, 0, 5]} color="red" />
```

That is the same as `light.position.set(0, 0, 5)`, written once in JSX. A colour prop takes anything a colour does, a CSS name, a hex string or a number.

## The result

Put together, the scene is a box lit red from the front, with a faint ambient light on everything:

<!-- snippet: examples/your-first-scene/first-scene.example.tsx#result -->

```tsx
import { Canvas } from '@react-fiber/threejs-compat';

function Scene() {
  return (
    <>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhongMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </>
  );
}

export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
```

![A box lit red from the front](../../../../tests/snapshots/docs/your-first-scene/first-scene.webgl.png)

> [!TIP]
> Things to try:
>
> - another geometry, such as `<sphereGeometry>` or `<planeGeometry>`
> - a `color` on the material
> - a `position` on the mesh, set as the prop of the same name
> - the mesh as a component of its own
