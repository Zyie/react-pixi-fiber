# Events and interaction

With the loop running, the next step is to make the mesh react to the pointer: here, a click that makes the cube bigger. The events are react-three-fiber's own, dispatched by r3f's event system, so they bubble, capture and order exactly as in r3f.

## Pointer events

Any object react-pixi-fiber can hit test receives events, such as a mesh:

```tsx
<mesh
  onClick={(e) => console.log('click')}
  onContextMenu={(e) => console.log('context menu')}
  onDoubleClick={(e) => console.log('double click')}
  onWheel={(e) => console.log('wheel spins')}
  onPointerUp={(e) => console.log('up')}
  onPointerDown={(e) => console.log('down')}
  onPointerOver={(e) => console.log('over')}
  onPointerOut={(e) => console.log('out')}
  onPointerEnter={(e) => console.log('enter')}
  onPointerLeave={(e) => console.log('leave')}
  onPointerMove={(e) => console.log('move')}
  onPointerMissed={() => console.log('missed')}
/>
```

Start with the click a DOM element would have:

```tsx
<mesh onClick={() => alert('Hello')}>
  <boxGeometry />
  <meshStandardMaterial color="royalblue" />
</mesh>
```

## Changing the mesh

Keep whether the mesh is active in state:

```tsx
const [active, setActive] = useState(false);
```

and scale the mesh by it:

```tsx
<mesh scale={active ? 1.5 : 1} onClick={() => setActive(!active)}>
  <boxGeometry />
  <meshStandardMaterial color="royalblue" />
</mesh>
```

Click the mesh and it scales up and down. In three steps it:

- has a click handler,
- keeps whether it is active in state,
- sets its scale from that state.

## The event object

A handler gets r3f's event: the DOM event's fields, and what the ray hit. `e.object` is the pixi-3d object that was hit, `e.eventObject` the one whose handler runs, `e.point` the hit in world space and `e.distance` how far along the ray it was. `e.stopPropagation()` stops the event at the nearest object, as in r3f.

The hit comes from a pixi-3d ray cast against the geometry of each mesh with a handler, which skips back faces as three.js does. The hit carries `face`, `faceIndex` and `uv` as well. A few things differ: there's no `instanceId`, since pixi-3d's batched meshes can't be picked by instance, and `face.normal` is the hit triangle's flat normal, where three.js interpolates the vertex normals.

**Try this:**

- Change other props of the mesh, such as its `position`, or the `color` of its material.
- Use `onPointerOver` and `onPointerOut` to change the mesh while the pointer is over it.

## Next steps

Pictures and models make a scene: load [models](loading-models.md) and [textures](loading-textures.md).
