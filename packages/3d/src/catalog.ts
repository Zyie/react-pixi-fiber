/**
 * `@pixi/3d`'s classes under their element names: the class name with a `3D` suffix, which the JSX name
 * lower-camels, and no second suffix on a name that has one (`Mesh3D` is `<mesh3D>`, `SphereGeometry`
 * is `<sphereGeometry3D>`, `PhongMaterial` is `<phongMaterial3D>`, `PointLight` is `<pointLight3D>`).
 *
 * The catalog takes this module whole. The classes are @pixi/3d's own, not subclasses, so a ref gets
 * the @pixi/3d object and an app imports the classes from `@pixi/3d`; no entry re-exports them. The one
 * exception is `<camera3D>`, core's `RootCamera`: @pixi/3d's `Camera3D` with the members r3f's core
 * calls on a root's camera, so a camera element can be made the root's or a `<View3D>`'s camera.
 */
export { RootCamera as Camera3D } from '@react-fiber/core';
export {
  BatchedMesh3D,
  Container3D,
  Mesh3D,
  Model3D,
  ParticleContainer3D,
  Sprite3D,
  AmbientLight as AmbientLight3D,
  DirectionalLight as DirectionalLight3D,
  PointLight as PointLight3D,
  SpotLight as SpotLight3D,
  CapsuleGeometry as CapsuleGeometry3D,
  ConeGeometry as ConeGeometry3D,
  CubeGeometry as CubeGeometry3D,
  CylinderGeometry as CylinderGeometry3D,
  Geometry3D,
  IcosahedronGeometry as IcosahedronGeometry3D,
  PlaneGeometry as PlaneGeometry3D,
  SphereGeometry as SphereGeometry3D,
  TorusGeometry as TorusGeometry3D,
  TorusKnotGeometry as TorusKnotGeometry3D,
  FlatMaterial as FlatMaterial3D,
  Material3D,
  ParticleMaterial as ParticleMaterial3D,
  PhongMaterial as PhongMaterial3D,
} from '@pixi/3d';
