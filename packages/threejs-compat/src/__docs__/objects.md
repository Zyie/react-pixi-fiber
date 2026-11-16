# Objects, properties and arguments

Every JSX element is a class of the catalog under three's name: `<mesh>` is `Mesh`, `<sphereGeometry>` is `SphereGeometry`, `<meshStandardMaterial>` is `MeshStandardMaterial`. Each takes three's constructor arguments and fields and maps them onto pixi-3d's objects, so the props, `args` and `attach` of an r3f scene work as r3f documents them. The same classes come from `react-pixi-fiber/three` for code that builds objects by hand (see [The three entry](three-entry.md)).

## Declaring objects

You could build every property as an object and hand it over:

```tsx
<mesh
  position={new Vector3(1, 2, 3)}
  geometry={new SphereGeometry(1, 16, 16)}
  material={new MeshBasicMaterial({ color: new Color('hotpink'), transparent: true })}
/>
```

Those objects are made again on every render. Declare them instead, and let r3f make each once:

<!-- snippet: examples/objects/declaring.example.tsx#declare -->

```tsx
<mesh visible userData={{ hello: 'world' }} position={[0, 0.2, 0]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
  <sphereGeometry args={[1, 32, 16]} />
  <meshStandardMaterial color="hotpink" roughness={0.4} />
</mesh>
```

## Constructor arguments

three's objects are classes, made with arguments once (`new SphereGeometry(1, 32)`) and changed through their fields afterwards (`mesh.visible = true`). Arguments go in `args`, as an array. When `args` change, the object is made again from scratch:

```tsx
<sphereGeometry args={[1, 32]} />
```

## Shortcuts

A prop whose object has a `set` method takes what `set` takes. A `Color` takes a CSS colour, so `color="hotpink"` works, and a `Vector3` takes three numbers, so `position={[1, 2, 3]}` works. A prop with `setScalar` takes one number: `scale={2}` is `scale={[2, 2, 2]}`.

Dashes reach into nested fields: `rotation-x={1}` sets `mesh.rotation.x`, and `material-color="red"` the colour of the mesh's material.

As in r3f, props are compared by reference. A vector made once and changed in place is never seen again; pass a new array, or change the object through a ref in `useFrame`.

## Attach

A geometry or a material is not part of the scene, but it attaches to the object that holds it. Every geometry attaches to its parent's `geometry` and every material to its `material`, so neither needs `attach`. Nested fields take dashes: a `<bufferAttribute attach="attributes-position">` becomes the position of the geometry around it.

An `attach="material-0"` array of materials isn't drawn yet: pixi-3d draws a mesh with one material, and a geometry's `groups` are kept for three's shape.

## Geometries

Every geometry of three r187 that a typical scene uses is in the catalog, built by three's own generator, so its vertices, normals, texture coordinates, winding and groups are three's: `boxGeometry`, `sphereGeometry` (with its partial sweeps), `planeGeometry`, `circleGeometry`, `ringGeometry`, `cylinderGeometry`, `coneGeometry`, `capsuleGeometry`, `torusGeometry`, `torusKnotGeometry`, `latheGeometry`, `polyhedronGeometry` and its `tetrahedron`, `octahedron`, `icosahedron` and `dodecahedron` forms, and `edgesGeometry` and `wireframeGeometry` for lines.

<!-- snippet: examples/objects/geometries.example.tsx#result -->

```tsx
import { Canvas } from '@react-fiber/threejs-compat';
import { Vector2 } from '@react-fiber/threejs-compat/three';

const profile = [new Vector2(0.05, -0.7), new Vector2(0.55, -0.5), new Vector2(0.3, 0.1), new Vector2(0.45, 0.6)];

const geometries = [
  <boxGeometry key="box" args={[1.1, 1.1, 1.1]} />,
  <sphereGeometry key="sphere" args={[0.7, 32, 16]} />,
  <cylinderGeometry key="cylinder" args={[0.5, 0.6, 1.2, 24]} />,
  <coneGeometry key="cone" args={[0.65, 1.3, 24]} />,
  <capsuleGeometry key="capsule" args={[0.4, 0.6, 6, 16]} />,
  <torusGeometry key="torus" args={[0.5, 0.2, 16, 48]} />,
  <torusKnotGeometry key="knot" args={[0.45, 0.15, 96, 12]} />,
  <icosahedronGeometry key="icosahedron" args={[0.75]} />,
  <dodecahedronGeometry key="dodecahedron" args={[0.75]} />,
  <ringGeometry key="ring" args={[0.3, 0.7, 32]} />,
  <latheGeometry key="lathe" args={[profile, 24]} />,
  <sphereGeometry key="slice" args={[0.7, 32, 16, 0, Math.PI * 1.5]} />,
];

function Gallery() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {geometries.map((geometry, index) => (
        <mesh
          key={index}
          position={[(index % 4) * 2.6 - 3.9, 2 - Math.floor(index / 4) * 2, 0]}
          rotation={[0.4, 0.5, 0]}
        >
          {geometry}
          <meshStandardMaterial color="#7fb3d5" side={2} />
        </mesh>
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <Gallery />
    </Canvas>
  );
}
```

Each keeps three's `parameters`, and each is a `BufferGeometry`, so `geometry.attributes.position`, `computeBoundingBox()`, `translate()`, `rotateX()`, `scale()` and `center()` work on a `<boxGeometry>` too. `shapeGeometry`, `extrudeGeometry` and `tubeGeometry` aren't in the catalog: they need three's shapes and curves. pixi-3d's own generators stay reachable under their own names, such as `<cubeGeometry>`.

## Buffer geometry

`<bufferGeometry>` takes its data from `<bufferAttribute>` children, as in r3f. `position`, `normal`, `uv`, `color` and `tangent` are drawn; an attribute of any other name is kept for your own code. A three-component `color` is drawn as it is: there is no need to pad it to four.

<!-- snippet: examples/objects/custom-geometry.example.tsx#result -->

```tsx
import { Canvas } from '@react-fiber/threejs-compat';
import { useMemo } from 'react';

function Fan({ blades = 12 }) {
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(blades * 9);
    const colors = new Float32Array(blades * 9);
    for (let i = 0; i < blades; i++) {
      const a = (i / blades) * Math.PI * 2;
      const b = ((i + 0.6) / blades) * Math.PI * 2;
      positions.set([0, 0, 0, Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0, Math.cos(b) * 1.6, Math.sin(b) * 1.6, 0], i * 9);
      const t = i / blades;
      colors.set([1, 1, 1, t, 0.4, 1 - t, t, 0.4, 1 - t], i * 9);
    }
    return [positions, colors];
  }, [blades]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <meshBasicMaterial vertexColors side={2} />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <Fan />
    </Canvas>
  );
}
```

After changing an attribute's data, set `needsUpdate`, as in three:

```tsx
useFrame(({ elapsed }) => {
  const position = geometry.attributes.position;
  position.setY(0, Math.sin(elapsed));
  position.needsUpdate = true;
});
```

pixi-3d copies a geometry into buffers it shares with other geometries, so each update copies it again. For data that changes every frame, give the attribute three's `DynamicDrawUsage` (`attribute.setUsage(DynamicDrawUsage)`): the geometry then draws from its own buffers. `setIndex`, `setDrawRange`, `computeVertexNormals`, `setFromPoints`, `toNonIndexed`, `applyMatrix4` and the rest of three's `BufferGeometry` methods work as in three.

`geometry.attributes` is also the map pixi-3d draws from, so iterating it lists pixi-3d's names (`aPosition`, `aNormal`, ...); reading or writing a three name such as `attributes.position` works as in three. `morphAttributes` are kept and not drawn.

## Materials

The catalog's materials take three's parameters and fields: `meshBasicMaterial`, `meshLambertMaterial`, `meshPhongMaterial`, `meshToonMaterial`, `meshStandardMaterial`, `meshPhysicalMaterial`, `meshNormalMaterial` and `meshMatcapMaterial`, and for points, lines and sprites, `pointsMaterial`, `lineBasicMaterial` and `spriteMaterial`. Colours are three `Color`s, so `color="hotpink"`, `material.color.set(...)` and `color-r={1}` all work.

<!-- snippet: examples/objects/materials.example.tsx#result -->

```tsx
import { Canvas } from '@react-fiber/threejs-compat';

const materials = [
  <meshBasicMaterial key="basic" color="#ef8354" />,
  <meshLambertMaterial key="lambert" color="#ef8354" />,
  <meshPhongMaterial key="phong" color="#ef8354" specular="#777777" shininess={50} />,
  <meshToonMaterial key="toon" color="#ef8354" />,
  <meshStandardMaterial key="standard" color="#ef8354" roughness={0.3} />,
  <meshStandardMaterial key="metal" color="#ef8354" roughness={0.3} metalness={1} />,
  <meshPhysicalMaterial key="physical" color="#ef8354" roughness={0.5} clearcoat={1} clearcoatRoughness={0.05} />,
  <meshNormalMaterial key="normal" />,
];

function Gallery() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {materials.map((material, index) => (
        <mesh key={index} position={[(index % 4) * 2.4 - 3.6, index < 4 ? 1.2 : -1.2, 0]}>
          <sphereGeometry args={[0.9, 48, 24]} />
          {material}
        </mesh>
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 9] }}>
      <Gallery />
    </Canvas>
  );
}
```

They are shaded as three shades them. The standard and physical materials use three's lighting, multi-scatter energy compensation included, so metal looks as it does in three; their maps read the channels three's do: `roughnessMap` green, `metalnessMap` blue, `aoMap` red (with `aoMapIntensity`), `alphaMap` green, plus `map`, `normalMap` and `emissiveMap`. Phong and Lambert light as three's do, and the toon material picks a level of its `gradientMap` per light.

Every material, a loaded model's included, has three's common fields, and each can change at any time: `side` (`FrontSide`, `BackSide`, `DoubleSide`), `transparent`, `opacity`, `alphaTest`, `depthTest`, `depthWrite`, `blending` (normal, additive, multiply), `visible`, `polygonOffset`, `flatShading`, `vertexColors`, `fog` and `toneMapped`.

### Materials and `needsUpdate`

three needs `material.needsUpdate = true` after a change to a field it compiles into the shader, and r3f sets it when one of those props changes. Here every such field rebuilds the shader on its own, whether it is set through a prop or through a ref; `needsUpdate` works too.

### Physical features

pixi-3d builds each of the physical material's features into the shader when the material is laid out: clear coat, sheen, transmission, iridescence, specular and anisotropy. A feature turns on the first time its strength is set above 0 before the material is first drawn, which a JSX prop is. Turning one on later warns: set it from the first render, even to a small value, if you animate it. The physical maps (`clearcoatMap`, `sheenColorMap`, ...) aren't taken.

## Points, lines and sprites

`<points>` draws each vertex of its geometry as a square of `pointsMaterial`'s `size`, shrinking with distance unless `sizeAttenuation` is off. `<threeLine>` joins the vertices in order, `<lineSegments>` in pairs and `<lineLoop>` back to the first; lines are 1 pixel wide, as on most of three's platforms. `<threeLine>` is three's `Line` under the name r3f gives it, since `<line>` is SVG's.

<!-- snippet: examples/objects/points-and-lines.example.tsx#result -->

```tsx
import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import { BoxGeometry, BufferGeometry, Vector3 } from '@react-fiber/threejs-compat/three';
import type { Points } from '@react-fiber/threejs-compat/three';
import { useMemo, useRef } from 'react';

function Starfield({ count = 400 }) {
  const points = useRef<Points>(null!);
  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.2 + ((i * 7919) % 100) / 100;
      const theta = i * 2.39996;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      array.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
    }
    return array;
  }, [count]);
  useFrame((_, delta) => {
    points.current.rotation.y += delta * 0.2;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#f9d56e" />
    </points>
  );
}

function Wires() {
  const spiral = useMemo(() => {
    const points = Array.from({ length: 80 }, (_, i) => {
      const t = i / 79;
      return new Vector3(Math.cos(t * 12) * t * 0.9, t * 2 - 1, Math.sin(t * 12) * t * 0.9);
    });
    return new BufferGeometry().setFromPoints(points);
  }, []);
  const box = useMemo(() => new BoxGeometry(1.2, 1.2, 1.2), []);

  return (
    <>
      <threeLine geometry={spiral} position={[-2.6, 0, 0]}>
        <lineBasicMaterial color="#ff6f91" />
      </threeLine>
      <lineSegments position={[2.6, 0, 0]} rotation={[0.5, 0.6, 0]}>
        <edgesGeometry args={[box]} />
        <lineBasicMaterial color="#4ecdc4" />
      </lineSegments>
      <gridHelper args={[8, 16, '#888888', '#333333']} position={[0, -1.5, 0]} />
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 1, 6] }}>
      <Starfield />
      <Wires />
    </Canvas>
  );
}
```

`<sprite>` is a quad that always faces the camera, sized by `scale`, with a `spriteMaterial`. All of them raycast as three's do, so pointer events reach them: a point within `raycaster.params.Points.threshold` of the pointer, a line within `raycaster.params.Line.threshold`, and anywhere on a sprite.

`<gridHelper>`, `<axesHelper>`, `<arrowHelper>` and `BoxHelper` are three's helpers, built on these.

## Putting existing objects into the scene

`<primitive object={...}>` adds an object you made yourself, such as a loaded model. It keeps its props and children, and it isn't disposed when it unmounts: that is yours to do.

## Disposal

When an element unmounts, r3f calls `dispose()` on its object, which frees the pixi-3d resources behind it: a geometry's buffers, a material's shader data. `dispose={null}` on an element, or on a group around it, opts it out, for assets you share or cache yourself. A helper frees the geometry and material it made.

## Not there yet

- Several materials on one mesh (`attach="material-0"` and geometry groups).
- `wireframe`, `LineDashedMaterial`, `MeshDepthMaterial` and `MeshDistanceMaterial`.
- `ShaderMaterial` and node materials, which pixi-3d replaces with its shader bits.
- `shapeGeometry`, `extrudeGeometry` and `tubeGeometry`, morph attributes and interleaved attributes.
