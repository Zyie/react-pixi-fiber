# Basic animations

This tutorial builds a small, continuous animation loop, the building block of more advanced animations. It uses refs and `useFrame`, exactly as in react-three-fiber.

## `useFrame`

`useFrame` runs a function on every frame of the render loop. Hooks like it can only be called inside a `<Canvas>`.

```tsx
import { useFrame } from 'react-pixi-fiber';

function MyAnimatedBox() {
  useFrame(() => {
    console.log("I'm running every frame!");
  });

  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );
}
```

The function gets the state of the scene. Its timing tells you how much time has passed, which is what animates a value:

```tsx
useFrame((state) => {
  console.log(state.elapsed); // about 0 on the first frame, growing every frame after
});
```

`state.elapsed` is the number of seconds since the first frame. `state.delta` is the time since the previous frame, `state.time` the timestamp of the frame, and `state.frame` the number of frames so far.

## Animating with refs

Going through React state for a value that changes every frame re-renders the component every frame. Mutate the object directly instead, through a ref:

```tsx
import { useRef } from 'react';

function MyAnimatedBox() {
  const myMesh = useRef(null);

  return (
    <mesh ref={myMesh}>
      <boxGeometry />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );
}
```

`myMesh.current` is the pixi-3d mesh, which `useFrame` can change without React:

```tsx
useFrame((state) => {
  myMesh.current.rotation.x = state.elapsed;
});
```

- `elapsed` comes from the state `useFrame` passes.
- `myMesh.current.rotation.x` is the rotation of the mesh around its x axis.
- The angle grows with time, so the box turns around the x axis for as long as the scene runs.

> [!NOTE]
> pixi-3d's rotation is in radians, as three's is, with the same `x`, `y` and `z` fields. It turns in XYZ order only; three's `rotation.order` has no effect.

## Frame loop modes

`<Canvas frameloop="demand">` draws only when something calls `invalidate()`, and `frameloop="never"` draws only when you call `advance()`. They work as in r3f, since the loop is r3f's own.

**Try this:** set the rotation to `Math.sin(state.elapsed)` and watch the box swing back and forth.

## Next steps

Now that the box moves, [make it respond to the pointer](events-and-interaction.md).
