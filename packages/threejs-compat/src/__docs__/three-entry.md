# The three entry

r3f apps import from two places: `@react-three/fiber` for the React side, and `three` for classes, math and constants. `react-pixi-fiber` takes the place of the first. `react-pixi-fiber/three` takes the place of the second: three's API, under three's names, over pixi-3d.

```tsx
import { useFrame } from '@react-fiber/threejs-compat';
import { Color, MathUtils, Vector3 } from '@react-fiber/threejs-compat/three';
import type { Mesh } from '@react-fiber/threejs-compat/three';
```

## What it covers

- **Math.** `Vector2`, `Vector3`, `Vector4`, `Euler`, `Quaternion`, `Matrix3`, `Matrix4`, `Color`, `ColorManagement`, `MathUtils`, `Box3`, `Sphere`, `Ray`, `Plane`, `Spherical`, `Frustum` and `Clock`, with the surface three code calls: `set`, `copy`, `clone`, `add`, `sub`, `multiplyScalar`, `lerp`, `normalize`, `length`, `distanceTo`, `applyMatrix4`, `applyQuaternion`, `setFromEuler`, `slerp`, `compose`, `decompose`, `makeRotationFromEuler`, `invert` and the rest. Each extends pixi-3d's class of the same kind, so pixi-3d takes them wherever it takes its own.
- **Classes.** The catalog's classes under three's names, the classes the JSX elements build, so `useRef<Mesh>(null!)` types a `<mesh>` ref:
  - objects: `Object3D`, `Group`, `Mesh`, `SkinnedMesh`, `Skeleton`, `Bone`, `InstancedMesh`, `Points`, `Line`, `LineSegments`, `LineLoop`, `Sprite`, and the helpers `GridHelper`, `AxesHelper`, `BoxHelper` and `ArrowHelper`;
  - the scene: `Scene`, `Fog`, `FogExp2`, `PerspectiveCamera`, `OrthographicCamera` and `CubeCamera`;
  - lights: `AmbientLight`, `HemisphereLight`, `DirectionalLight`, `PointLight`, `SpotLight` and the `LightShadow` classes;
  - geometries: `BufferGeometry`, `BufferAttribute` and its typed variants, `InstancedBufferAttribute`, and three's generators from `BoxGeometry` to `TorusKnotGeometry`, `LatheGeometry`, `EdgesGeometry` and `WireframeGeometry` ([Objects, properties and arguments](objects.md) lists them);
  - materials: `MeshBasicMaterial`, `MeshLambertMaterial`, `MeshPhongMaterial`, `MeshToonMaterial`, `MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshNormalMaterial`, `MeshMatcapMaterial`, `PointsMaterial`, `LineBasicMaterial` and `SpriteMaterial`;
  - picking: `Raycaster`.
- **Textures, loaders and animation.** `Texture`, `CanvasTexture`, `DataTexture`, `VideoTexture` and `CubeTexture` over pixi's textures; `Loader`, `LoadingManager`, `DefaultLoadingManager`, `LoaderUtils`, `Cache`, `ImageLoader`, `FileLoader`, `TextureLoader` and `CubeTextureLoader`; `AnimationMixer`, `AnimationAction`, `AnimationClip`, `PropertyBinding`, `EventDispatcher` and the keyframe tracks. [Loading models](loading-models.md) and [Loading textures](loading-textures.md) show them at work.
- **Render targets.** `RenderTarget`, `WebGLRenderTarget` and `WebGLCubeRenderTarget`, which `useRenderTarget` and `CubeCamera` make, and `Controls`, the base of the camera controls (see [Render targets](render-targets.md) and [Environment](environment.md)).
- **Constants.** Every constant three r187 exports but the legacy `MipMap` spellings of the mipmap filters (use `LinearMipmapLinearFilter` and its siblings), with three's values: `DoubleSide`, `AdditiveBlending`, `RepeatWrapping`, `SRGBColorSpace`, `ACESFilmicToneMapping`, `MOUSE` and the rest. The renderer and the catalog map the ones pixi-3d has a counterpart for.

## Nodes

Every pixi-3d node, including the ones pixi-3d builds itself, has three's `Object3D` surface once a root exists:

- `position` and `scale` take three's vector methods: `mesh.position.lerp(target, 0.1)`, `mesh.scale.setScalar(2)`.
- `rotation` is an `Euler` with an `order`, kept in step with `quaternion` both ways, as in three. Turn a node through either, or through `rotateX`, `rotateOnAxis` and `lookAt`, and read the other back.
- `up` and `lookAt(x, y, z)` or `lookAt(vector)`: a node turns its +Z toward the target, and a camera or light its -Z, as in three.
- `getWorldPosition`, `getWorldQuaternion`, `getWorldScale`, `getWorldDirection`, `localToWorld` and `worldToLocal`, worked out from the current transforms when called.
- `matrix`, `matrixWorld`, `updateMatrix` and `matrixAutoUpdate`. With `matrixAutoUpdate = false` the node draws with the `matrix` you set and ignores its `position`, `rotation` and `scale` until `updateMatrix` runs, as three's does.
- `traverse`, `traverseVisible`, `traverseAncestors`, `getObjectByName`, `getObjectById`, `getObjectByProperty`, `attach`, `clear`, `applyMatrix4`, `translateX`, `userData`, `name`, `id`, `uuid`, `type`, and the `is*` flags (`isMesh`, `isCamera`, `isLight`, ...).

`instanceof Object3D` holds for any pixi-3d node, as `instanceof THREE.Object3D` does for any three node.

## Colours

`Color` keeps three's colour management. Its channels are in linear sRGB, the working colour space. A CSS colour, a hex number and `setHex` are read as sRGB and decoded; `getHex` and `getStyle` encode back. A material's `color` and `emissive` are `Color`s, so all of these work as in three:

```tsx
<meshStandardMaterial color="hotpink" color-r={1} emissive="#ff5500" emissiveIntensity={0.7} />
```

```tsx
useFrame(() => {
  material.current.color.lerp(target, 0.1);
});
```

A scene's `background` takes a `Color` too. `<color attach="background" args={['#1d2433']} />` clears the canvas to it before the scene draws, untouched by tone mapping, as three does.

## Aliasing `three`

An r3f app can point `three` at this entry, so its own `import * as THREE from 'three'` gets these classes. In Vite:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: [{ find: /^three$/, replacement: '@react-fiber/threejs-compat/three' }],
  },
});
```

And for TypeScript, in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": { "three": ["./node_modules/react-pixi-fiber/dist/three.d.ts"] }
  }
}
```

Import `react-pixi-fiber` in place of `@react-three/fiber` as well. Only the alias reaches packages that import `three` themselves, and those, such as `@react-three/drei`, also import `@react-three/fiber`, so they aren't covered.

What three's addons provide comes from `react-pixi-fiber/addons`: `GLTFLoader`, `DRACOLoader`, `MeshoptDecoder`, `HDRLoader`, `RGBELoader`, `OrbitControls` and `MapControls`.

## What's missing

An import of a class this entry doesn't have fails to build, which is better than one that half works. Not here yet:

- `ShapeGeometry`, `ExtrudeGeometry`, `TubeGeometry` and the `Curve` and `Shape` classes they need; `InterleavedBufferAttribute`.
- The `Material` base class, `ShaderMaterial`, `RawShaderMaterial`, `LineDashedMaterial`, `MeshDepthMaterial` and `MeshDistanceMaterial`.
- `RectAreaLight`, `LightProbe`, `Layers`, `LOD`, `StringKeyframeTrack`, `AnimationObjectGroup`, three's renderers, and loaders other than three's core loaders and those in `react-pixi-fiber/addons`.
- `Object3D.clone` and `copy`.

A few names are this entry's own: the shadow classes `DirectionalLightShadow`, `SpotLightShadow` and `PointLightShadow`, which three keeps internal, `HttpError`, `SRGBToLinear` and `LinearToSRGB`, and `RenderTargetCubeTexture`. A scene that should render through three too leaves them out.

And what differs from three:

- Matrices hold their elements in a `Float32Array`, where three's are numbers, as the GPU reads them.
- `renderOrder` and `frustumCulled` are kept and do nothing: pixi-3d orders draws by pipeline and depth, and its view culls every mesh by its own setting.
- pixi-3d's lights keep their own `type` (`'directional'`, `'point'`, `'spot'`), which their shaders read, where three's is the class name.
- A mesh under an unevenly scaled parent is lit as if its surface weren't sheared; see [Differences from react-three-fiber](differences.md).
