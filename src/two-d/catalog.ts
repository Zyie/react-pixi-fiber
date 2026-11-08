/**
 * pixi.js's 2D classes under their element names: the class name with a `2D` suffix, which the JSX
 * name lower-camels, as pixi-3d's `Container3D` is `<container3D>`. `HTMLText` and `DOMContainer` are
 * `HtmlText2D` and `DomContainer2D`, so their elements read `<htmlText2D>` and `<domContainer2D>`.
 *
 * The catalog takes this module whole. The classes are pixi.js's own, not subclasses, so a ref gets
 * the pixi object and an app imports the classes from `pixi.js`; no entry re-exports them.
 */
export {
  AnimatedSprite as AnimatedSprite2D,
  BitmapText as BitmapText2D,
  Container as Container2D,
  DOMContainer as DomContainer2D,
  Graphics as Graphics2D,
  GraphicsContext as GraphicsContext2D,
  HTMLText as HtmlText2D,
  Mesh as Mesh2D,
  MeshGeometry as MeshGeometry2D,
  MeshPlane as MeshPlane2D,
  MeshRope as MeshRope2D,
  MeshSimple as MeshSimple2D,
  NineSliceSprite as NineSliceSprite2D,
  Particle as Particle2D,
  ParticleContainer as ParticleContainer2D,
  PerspectiveMesh as PerspectiveMesh2D,
  RenderContainer as RenderContainer2D,
  RenderLayer as RenderLayer2D,
  SplitBitmapText as SplitBitmapText2D,
  SplitText as SplitText2D,
  Sprite as Sprite2D,
  Text as Text2D,
  TilingSprite as TilingSprite2D,
  AlphaFilter as AlphaFilter2D,
  BlurFilter as BlurFilter2D,
  ColorMatrixFilter as ColorMatrixFilter2D,
  DisplacementFilter as DisplacementFilter2D,
  Filter as Filter2D,
  NoiseFilter as NoiseFilter2D,
} from 'pixi.js';
