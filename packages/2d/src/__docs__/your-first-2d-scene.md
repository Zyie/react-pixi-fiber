# Your first 2D scene

react-pixi-fiber renders pixi.js 2D as well as pixi-3d, and both are written the same way: as react-three-fiber elements in a `<Canvas>`, with the same hooks and events. This page builds a small 2D scene: a frame, a line of text and a square that turns.

## Setting up the Canvas

The `<Canvas>` is the one from [Your first scene](../../__docs__/your-first-scene.md). It fills its parent, so give the parent a size:

```css
#canvas-container {
  width: 100vw;
  height: 100vh;
}
```

Then render a Canvas into it, with a white frame, a line of text and a blue square that turns:

<!-- snippet: examples/2d/first-2d-scene.example.tsx#result -->

```tsx
import { Canvas, useFrame } from '@react-fiber/core';
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { useRef } from 'react';

function Spinner() {
  const sprite = useRef<Sprite>(null);

  useFrame((_, delta) => {
    sprite.current!.rotation += delta;
  });

  return (
    <sprite2D
      ref={sprite}
      texture={Texture.WHITE}
      tint="royalblue"
      width={100}
      height={100}
      anchor={0.5}
      x={200}
      y={150}
    />
  );
}

function Scene() {
  return (
    <>
      <graphics2D draw={(graphics) => graphics.roundRect(20, 20, 360, 260, 16).stroke({ width: 4, color: 'white' })} />
      <text2D text="Hello 2D" x={40} y={36} style={{ fill: 'white', fontSize: 28, fontFamily: 'Arial' }} />
      <Spinner />
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

![A white frame, the text Hello 2D, and a blue square turned by half a second of animation](../../../tests/snapshots/docs/2d/first-2d-scene.webgl.png)

## 2D elements

A 2D element is a pixi.js class with a `2D` after its name, in camelCase: `Sprite` is `<sprite2D>`, `Graphics` is `<graphics2D>`, `Text` is `<text2D>`, as pixi-3d's `Container3D` is `<container3D>`. Every display class of pixi.js is an element without `extend`: `<container2D>`, `<sprite2D>`, `<graphics2D>`, `<text2D>`, `<bitmapText2D>`, `<htmlText2D>`, `<tilingSprite2D>`, `<nineSliceSprite2D>`, `<animatedSprite2D>`, `<mesh2D>`, `<meshPlane2D>`, `<meshRope2D>`, `<meshSimple2D>`, `<perspectiveMesh2D>`, `<particleContainer2D>` with `<particle2D>`, `<renderLayer2D>`, `<splitText2D>`, `<splitBitmapText2D>`, `<domContainer2D>` and `<renderContainer2D>`. So are the filters, `<blurFilter2D>`, `<alphaFilter2D>`, `<colorMatrixFilter2D>`, `<displacementFilter2D>`, `<noiseFilter2D>` and `<filter2D>`, and `<graphicsContext2D>`.

The object behind an element is pixi.js's own, so a ref gets a `Sprite` or a `Graphics`, and the classes come from `pixi.js`:

```tsx
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
```

## Where 2D draws

A 2D element placed directly in the Canvas draws in screen space: its `x` and `y` are CSS pixels from the canvas's top-left corner, as in pixi, whatever the camera does. It draws over the 3D, and the canvas's size, from `useThree`, is the size of that space. [The screen layer](screen-layer.md) has the details.

## Graphics

`<graphics2D>` takes a `draw` prop: a function that draws into the graphics, which react-pixi-fiber clears first. It runs when the element mounts and whenever a new function is passed, so the drawing follows the props it closes over.

## Animation

`useFrame` runs before every frame, for 2D as for 3D. The `Spinner` keeps a ref to its sprite and turns it by the frame's `delta`, in radians, as pixi's `rotation` is.

**Try this:**

- Change the text's `style`, or give the frame a `fill`.
- Add an `onClick` to the square, as in [2D events](events-2d.md).
- Put a `<mesh>` beside the 2D, as in [The screen layer](screen-layer.md).
- Put a label on a 3D object, or a 3D model in a 2D card, with [the bridges between 2D and 3D](mixing-2d-and-3d.md).
