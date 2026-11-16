# Events

Objects that implement a `raycast` method, as meshes and instanced meshes do, can be interacted with by declaring events on them. Pointer events, clicks, wheel turns and drag and drop are supported. Each event carries the browser event and what the ray hit: the object, the point, the distance and more. The event system is react-three-fiber's own, so everything on this page behaves as r3f documents it; the ray is cast by this package's `Raycaster`, which tests pixi-3d's geometry the way three tests its own.

`onPointerMissed` fires on clicks that hit nothing; on the `<Canvas>` it fires when a click hits no object at all, and on an object when a click hits something else. `onDragOverMissed` and `onDropMissed` do the same for drag and drop.

<!-- snippet: examples/events-and-interaction/handlers.example.tsx#handlers -->

```tsx
<mesh
  onClick={() => console.log('click')}
  onContextMenu={() => console.log('context menu')}
  onDoubleClick={() => console.log('double click')}
  onWheel={() => console.log('wheel spins')}
  onPointerUp={() => console.log('up')}
  onPointerDown={() => console.log('down')}
  onPointerOver={() => console.log('over')}
  onPointerOut={() => console.log('out')}
  onPointerEnter={() => console.log('enter')}
  onPointerLeave={() => console.log('leave')}
  onPointerMove={() => console.log('move')}
  onPointerMissed={() => console.log('missed')}
>
  <boxGeometry />
  <meshPhongMaterial color="royalblue" />
</mesh>
```

![A royal blue box that logs every pointer event it gets](../../tests/snapshots/docs/events-and-interaction/handlers.webgl.png)

## Event data

```ts
({
  ...DomEvent, // All the original event data
  ...Intersection, // What the ray hit: see below
  intersections, // Every hit under the pointer, nearest first, one per object
  object, // The object that was hit
  eventObject, // The object whose handler is running
  unprojectedPoint, // The pointer on the camera's near plane, in world space
  ray, // The ray that was cast
  camera, // The camera it was cast from
  pointer, // The pointer in normalised device coordinates, -1 to 1
  delta, // Distance in pixels between pointerdown and this event
  nativeEvent, // The DOM event
  stopPropagation, // Stops the event here; see below
  target, // setPointerCapture, releasePointerCapture, hasPointerCapture
});
```

The hit has three's fields: `point` and `distance` in world space, `face` (the triangle's corners `a`, `b`, `c` and its flat `normal`), `faceIndex`, `barycoord`, `uv`, `normal` (the vertex normals blended at the hit, turned to face the ray), and `instanceId` for an instanced mesh. `object` and `eventObject` are pixi-3d nodes with three's `Object3D` surface, so `e.object.getWorldPosition(v)` and `e.object.userData` work as in three.

## Drag and drop

Files dragged in from the desktop reach objects as drag events:

| Event              | Fires                                       |
| ------------------ | ------------------------------------------- |
| `onDragOver`       | while a drag is over the object             |
| `onDragOverEnter`  | once, when a drag comes over the object     |
| `onDragOverLeave`  | once, when a drag leaves the object         |
| `onDragOverMissed` | while a drag is over the canvas but nothing |
| `onDrop`           | when something is dropped on the object     |
| `onDropMissed`     | when a drop hits something else or nothing  |

The canvas takes `onDragOverMissed` and `onDropMissed` too. The dropped files are on the native event:

```tsx
<mesh
  onDrop={(e) => {
    const file = e.nativeEvent.dataTransfer?.files[0];
    if (file) console.log('Dropped:', file.name, file.type);
  }}
/>
```

Prevent the browser's own handling on the canvas, or it opens the dropped file: `<Canvas onDrop={(e) => e.preventDefault()} onDragOver={(e) => e.preventDefault()}>`.

## How events travel

> [!NOTE]
> `onPointerEnter` and `onPointerLeave` work exactly as `onPointerOver` and `onPointerOut`: r3f doesn't implement the DOM's enter and leave. Moving between two children of a group takes the group out and back in.

An event that has no intersection with its object, such as `onPointerOut`, carries the hit of the last event that object got.

### Bubbling

Objects in 3D occlude each other, so propagation works a little differently from the DOM. `intersections` holds everything the ray hit, not only the nearest, one hit per object. The event goes to the nearest object first, then up through its ancestors, as in the DOM; then to the next nearest object and its ancestors, and so on. Objects are transparent to pointer events by default, even ones that handle the event. A group with a handler hears about every child it holds:

<!-- snippet: examples/events/selection.example.tsx#sphere -->

```tsx
function Sphere() {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh onPointerOver={(e) => (e.stopPropagation(), setHovered(true))} onPointerOut={() => setHovered(false)}>
      <sphereGeometry args={[0.5, 64, 64]} />
      <meshBasicMaterial color={hovered ? 'hotpink' : 'indianred'} />
    </mesh>
  );
}
```

![A see-through pair of spheres on the left, and a pink sphere in front of a grey circle on the right](../../tests/snapshots/docs/events/selection.webgl.png)

### `stopPropagation`

`event.stopPropagation()` doesn't just stop the event bubbling up: it stops it reaching objects behind this one, too. Everything else, nearer or farther, stops counting as hit while the pointer is over this object, and an object that had a pointer over gets its pointer out at once. To make an object block what is behind it, give it a handler that stops propagation, even if it doesn't need the event itself:

<!-- snippet: examples/events/stop-propagation.example.tsx#over -->

```tsx
const onPointerOver = useCallback(
  (e: ThreeEvent<PointerEvent>) => {
    if (stop) e.stopPropagation();
    setHovered(true);
  },
  [stop],
);
```

![Three planes stepping back; the middle one is orange and hides the pink one behind it](../../tests/snapshots/docs/events/stop-propagation.webgl.png)

The pointer outs happen during the `stopPropagation()` call, so do the rest of the handler's work after it.

### Pointer capture

Since events go to every object the ray hits, capture works differently too. In the DOM the capturing element replaces the hit test; here the capturing object is added to it. When the capturing object wasn't hit, every hit object and its ancestors get the event first, then the capturing object and its ancestors. The capturing object can call `stopPropagation()` so the objects that really were hit get their pointer outs.

`setPointerCapture` and `releasePointerCapture` are on `event.target` only, not on the objects, and take the native event's `pointerId`, as in the DOM. Each pointer is tracked on its own, so several fingers can each hold a capture. A drag that keeps working once the pointer leaves the object:

<!-- snippet: examples/events/gestures.example.tsx#drag -->

```tsx
const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  e.target.setPointerCapture(e.pointerId);
  drag.current = { x: e.offsetX, y: e.offsetY, from: position };
};
const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
  if (!drag.current) return;
  e.stopPropagation();
  const { x, y, from } = drag.current;
  const factor = viewport.getCurrentViewport().factor;
  set([from[0] + (e.offsetX - x) / factor, from[1] - (e.offsetY - y) / factor, z]);
};
const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
  e.target.releasePointerCapture(e.pointerId);
  drag.current = null;
};
```

![The front object dragged up and to the right, uncovering the small one behind](../../tests/snapshots/docs/events/gestures.webgl.png)

r3f types an object's `onLostPointerCapture` and `onPointerCancel` but never calls them. When the canvas loses a capture, r3f drops that pointer's captures on the next frame and ends its hovers with `onPointerOut` and `onPointerLeave`, and a pointer the browser cancels ends the same way.

### Context menu and double click

`onContextMenu` follows a right click or a long press, and counts as a click: it goes to the objects the pointerdown hit. Call `preventDefault()` on the native event to keep the browser's menu closed:

<!-- snippet: examples/events/context-menu-override.example.tsx#box -->

```tsx
function Box() {
  const [state, setState] = useState(false);

  return (
    <mesh
      scale={[2, 2, 2]}
      position={[1, 0, 0]}
      onContextMenu={(ev) => {
        ev.nativeEvent.preventDefault();
        setState((value) => !value);
      }}
      onPointerMissed={() => console.log('mesh.missed')}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial color={state ? 'hotpink' : 'blue'} />
    </mesh>
  );
}
```

![A box turned hot pink by a right click](../../tests/snapshots/docs/events/context-menu-override.webgl.png)

`onDoubleClick` fires on an object both clicks hit. r3f v10's own build never fires it in Chrome, whose `dblclick` has no `pointerId` to match to the pointerdown; this package's event layer gives it the pointerdown's.

## Customizing the event settings

The `events` prop of `<Canvas>` sets up the event layer for the whole root:

```tsx
import { Canvas, events } from 'react-pixi-fiber';
import type { EventManager, RootStore } from 'react-pixi-fiber';

const eventManagerFactory = (store: RootStore): EventManager<HTMLElement> => ({
  // The default configuration
  ...events(store),

  // Whether the layer handles events
  enabled: true,

  // Layers of higher priority come first, and may stop propagation to lower ones
  priority: 1,

  // Reorders or filters the hits before handlers run
  filter: (items, state) => items,

  // Turns a DOM event into the pointer and the ray
  compute: (event, state) => {
    state.pointer.set((event.offsetX / state.size.width) * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1);
    state.raycaster.setFromCamera(state.pointer, state.camera);
  },
});

function App() {
  return <Canvas events={eventManagerFactory}>{/* ... */}</Canvas>;
}
```

The same settings change later through the root's `setEvents`: `useThree((state) => state.setEvents)({ enabled: false })` stops the layer, and `{ enabled: true }` starts it again and raycasts the last pointer at once.

### Priority

A portal can have an event layer of its own, with a higher priority, so its objects win the pointer over nearer ones in the main scene: drei's `<Hud>` works this way. Here the plate behind the box is in a layer of priority 2, takes the click, and stops it:

<!-- snippet: examples/events/event-priority.example.tsx#portal -->

```tsx
function Hud() {
  const [layer, setLayer] = useState<ElementRef<'group'> | null>(null);
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <group ref={setLayer} />
      {layer &&
        createPortal(
          <mesh
            position={[0.6, 0.4, -2]}
            onClick={(e) => {
              e.stopPropagation();
              setClicks((count) => count + 1);
            }}
          >
            <boxGeometry args={[2.2, 2.2, 0.1]} />
            <meshBasicMaterial color={clicks % 2 ? 'royalblue' : 'midnightblue'} />
          </mesh>,
          layer,
          { events: { priority: 2 } },
        )}
    </>
  );
}
```

![A red box in front of a royal blue plate, which took the click](../../tests/snapshots/docs/events/event-priority.webgl.png)

`userData.interactivePriority` does the same for one object: objects that have one sort ahead of objects without, higher first, whatever their distance. Gizmos and handles that must stay reachable use it:

```tsx
<mesh userData={{ interactivePriority: 10 }} onPointerDown={grab} />
```

### A different target element

The event listeners can go on another element than the canvas, usually a parent shared with DOM overlays, so both get events. Use the root's event layer:

```tsx
const events = useThree((state) => state.events);

useEffect(() => {
  events.connect?.(domNode);
}, [events]);
```

or the `eventSource` prop of `<Canvas>`, which takes an element or a ref to one:

```tsx
function App() {
  const target = useRef<HTMLDivElement>(null);

  return (
    <div ref={target}>
      <Canvas eventSource={target}>{/* ... */}</Canvas>
    </div>
  );
}
```

`events.disconnect()` takes the listeners off again.

### A different prefix

The ray is set up from `offsetX` and `offsetY` by default. `eventPrefix` picks another pair, such as `clientX` and `clientY`:

```tsx
<Canvas eventPrefix="client">
```

### Raycasting without input

r3f raycasts only when the pointer moves or clicks. If an object moves under a still pointer, or the camera moves, nothing hovers until the pointer moves again. `events.update()` raycasts the last pointer event again:

```tsx
const events = useThree((state) => state.events);

useFrame((state) => {
  if (cameraMoved(state.camera)) events.update?.();
});
```

### Frame-timed raycasting

While `frameloop` is `always`, pointer moves are raycast once per frame at its start rather than once per DOM event, which saves work on busy scenes. Clicks raycast at once, after any move still waiting. Turn it off, or have wheel turns wait for the frame too, in the event settings:

```tsx
const eventManagerFactory = (store: RootStore): EventManager<HTMLElement> => ({
  ...events(store),
  frameTimedRaycasts: false,
  alwaysFireOnScroll: false,
});
```

With `frameloop` set to `demand` or `never` every move raycasts at once.

## Instances

An event on an `instancedMesh` carries the `instanceId` of the instance hit, and each instance counts as an object of its own for hover, so moving from one instance to the next is a pointer out and a pointer over:

<!-- snippet: examples/scaling-performance/instanced-hover.example.tsx#hover -->

```tsx
const paint = (id: number | undefined, lightness: number) => {
  if (id === undefined) return;
  mesh.current.setColorAt(id, color.setHSL(0.6, 0.5, lightness));
  mesh.current.instanceColor!.needsUpdate = true;
};

const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  if (e.instanceId === hovered.current) return;
  paint(hovered.current, 0.35);
  paint((hovered.current = e.instanceId), 0.75);
};

const onPointerOut = () => {
  paint(hovered.current, 0.35);
  hovered.current = undefined;
};
```

![A grid of instanced boxes, one lit under the pointer](../../tests/snapshots/docs/scaling-performance/instanced-hover.webgl.png)

## The raycaster

`useThree((state) => state.raycaster)` is three's `Raycaster`, from `react-pixi-fiber/three`, and works on its own too:

```tsx
import { Raycaster, Vector2, Vector3 } from 'react-pixi-fiber/three';

const raycaster = new Raycaster();

// From a camera through a point on screen, -1 to 1 on each axis; perspective or orthographic
raycaster.setFromCamera(new Vector2(0, 0), camera);

// Or from any point in any direction, with near and far limits
raycaster.set(new Vector3(0, 5, 0), new Vector3(0, -1, 0));
raycaster.far = 10;

// Every triangle the ray crosses, nearest first; recursive by default
const hits = raycaster.intersectObject(scene, true);
const [nearest] = raycaster.intersectObjects([floor, wall], false, hits);
```

As in three, it tests each object through its `raycast` method, so `raycast={() => null}` opts an object out and a function of your own picks by any shape. Hidden objects are hit too. The material's `side` decides which faces count: the front ones by default, both for `DoubleSide`, the back ones for `BackSide`. Every triangle the ray crosses is a hit, and an `InstancedMesh` adds one for every instance.

What differs from three's:

- There is no `layers`: pixi-3d has no layers, so every object is tested.
- `params` is kept for three's shape, but only triangles are picked: no lines or points.
- A skinned or morphed mesh is picked in its rest pose. pixi-3d keeps morph targets on the GPU only, and the raycaster doesn't apply the skeleton.

## XR pointers

r3f's event layer can register XR controllers and hands as pointers (`events.registerPointer`), and that code runs here unchanged, but pixi-3d has no WebXR session to drive them.
