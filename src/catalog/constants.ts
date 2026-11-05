/**
 * three's constants, by three's names and with three r187's values, so code that reads them from
 * `three` reads them from `react-pixi-fiber/three`. The renderer and catalog map the ones pixi-3d has a
 * counterpart for; the JSDoc of each mapped one says what it maps to. The rest are kept for three's shape.
 */
/**
 * three's `ACESFilmicToneMapping`, r3f's default; maps to pixi-3d's `'aces'`
 * @category constants
 * @standard
 */
export const ACESFilmicToneMapping = 4;
/**
 * three's `AddEquation`: A 'source + destination' blending equation
 * @category constants
 * @advanced
 */
export const AddEquation = 100;
/**
 * three's `AddOperation`: adds the two colors
 * @category constants
 * @advanced
 */
export const AddOperation = 2;
/**
 * three's `AdditiveAnimationBlendMode`: additive animation blend mode
 * @category constants
 * @advanced
 */
export const AdditiveAnimationBlendMode = 2501;
/**
 * three's `AdditiveBlending`: represents additive blending
 * @category constants
 * @standard
 */
export const AdditiveBlending = 2;
/**
 * three's `AgXToneMapping`; pixi-3d has no AgX, so it maps to `'aces'`
 * @category constants
 * @standard
 */
export const AgXToneMapping = 6;
/**
 * three's `AlphaFormat`: discards the red, green and blue components and reads just the alpha component
 * @category constants
 * @advanced
 */
export const AlphaFormat = 1021;
/**
 * three's `AlwaysCompare`: always pass
 * @category constants
 * @advanced
 */
export const AlwaysCompare = 519;
/**
 * three's `AlwaysDepth`: always pass
 * @category constants
 * @advanced
 */
export const AlwaysDepth = 1;
/**
 * three's `AlwaysStencilFunc`: will always return true
 * @category constants
 * @advanced
 */
export const AlwaysStencilFunc = 519;
/**
 * three's `AttachedBindMode`: the skinned mesh shares the same world space as the skeleton
 * @category constants
 * @advanced
 */
export const AttachedBindMode = 'attached';
/**
 * three's `BackSide`
 * @category constants
 * @standard
 */
export const BackSide = 1;
/**
 * three's `BasicDepthPacking`: the depth value is inverted (1.0; z) for visualization purposes
 * @category constants
 * @advanced
 */
export const BasicDepthPacking = 3200;
/**
 * three's `BasicShadowMap`; maps to pixi-3d's `'hard'` shadow filter
 * @category constants
 * @standard
 */
export const BasicShadowMap = 0;
/**
 * three's `ByteType`: A byte data type for textures
 * @category constants
 * @advanced
 */
export const ByteType = 1010;
/**
 * three's `CineonToneMapping`; maps to pixi-3d's filmic `'uncharted2'`
 * @category constants
 * @standard
 */
export const CineonToneMapping = 3;
/**
 * three's `ClampToEdgeWrapping`: the last pixel of the texture stretches to the edge of the mesh
 * @category constants
 * @standard
 */
export const ClampToEdgeWrapping = 1001;
/**
 * three's `Compatibility`: compatibility flags for features that may not be supported across all platforms
 * @category constants
 * @advanced
 */
export const Compatibility: { readonly TEXTURE_COMPARE: 'depthTextureCompare' } = {
  TEXTURE_COMPARE: 'depthTextureCompare',
};
/**
 * three's `ConstantAlphaFactor`: multiplies all colors by a constant alpha value
 * @category constants
 * @advanced
 */
export const ConstantAlphaFactor = 213;
/**
 * three's `ConstantColorFactor`: multiplies all colors by a constant color
 * @category constants
 * @advanced
 */
export const ConstantColorFactor = 211;
/**
 * three's `CubeReflectionMapping`: reflection mapping for cube textures
 * @category constants
 * @advanced
 */
export const CubeReflectionMapping = 301;
/**
 * three's `CubeRefractionMapping`: refraction mapping for cube textures
 * @category constants
 * @advanced
 */
export const CubeRefractionMapping = 302;
/**
 * three's `CullFaceBack`: culls back faces
 * @category constants
 * @advanced
 */
export const CullFaceBack = 1;
/**
 * three's `CullFaceFront`: culls front faces
 * @category constants
 * @advanced
 */
export const CullFaceFront = 2;
/**
 * three's `CullFaceFrontBack`: culls both front and back faces
 * @category constants
 * @advanced
 */
export const CullFaceFrontBack = 3;
/**
 * three's `CullFaceNone`: disables face culling
 * @category constants
 * @advanced
 */
export const CullFaceNone = 0;
/**
 * three's `CustomBlending`: represents custom blending
 * @category constants
 * @advanced
 */
export const CustomBlending = 5;
/**
 * three's `CustomToneMapping`; maps to pixi-3d's `'custom'`
 * @category constants
 * @standard
 */
export const CustomToneMapping = 5;
/**
 * three's `DecrementStencilOp`: decrements the current stencil buffer value
 * @category constants
 * @advanced
 */
export const DecrementStencilOp = 7683;
/**
 * three's `DecrementWrapStencilOp`: decrements the current stencil buffer value
 * @category constants
 * @advanced
 */
export const DecrementWrapStencilOp = 34056;
/**
 * three's `DepthFormat`: reads each element as a single depth value, converts it to floating point, and clamps to the range '[0,1]'
 * @category constants
 * @advanced
 */
export const DepthFormat = 1026;
/**
 * three's `DepthStencilFormat`: reads each element is a pair of depth and stencil values
 * @category constants
 * @advanced
 */
export const DepthStencilFormat = 1027;
/**
 * three's `DetachedBindMode`: the skinned mesh does not share the same world space as the skeleton
 * @category constants
 * @advanced
 */
export const DetachedBindMode = 'detached';
/**
 * three's `DoubleSide`
 * @category constants
 * @standard
 */
export const DoubleSide = 2;
/**
 * three's `DstAlphaFactor`: multiplies all colors by the destination alpha value
 * @category constants
 * @advanced
 */
export const DstAlphaFactor = 206;
/**
 * three's `DstColorFactor`: multiplies all colors by the destination color
 * @category constants
 * @advanced
 */
export const DstColorFactor = 208;
/**
 * three's `DynamicCopyUsage`: the contents are intended to be respecified repeatedly by reading data from the 3D API, and used many times as the source for WebGL drawing and image specification commands
 * @category constants
 * @advanced
 */
export const DynamicCopyUsage = 35050;
/**
 * three's `DynamicDrawUsage`: the contents are intended to be respecified repeatedly by the application, and used many times as the source for drawing and image specification commands
 * @category constants
 * @advanced
 */
export const DynamicDrawUsage = 35048;
/**
 * three's `DynamicReadUsage`: the contents are intended to be respecified repeatedly by reading data from the 3D API, and queried many times by the application
 * @category constants
 * @advanced
 */
export const DynamicReadUsage = 35049;
/**
 * three's `EqualCompare`: pass if the incoming value equals the texture value
 * @category constants
 * @advanced
 */
export const EqualCompare = 514;
/**
 * three's `EqualDepth`: pass if the incoming value equals the depth buffer value
 * @category constants
 * @advanced
 */
export const EqualDepth = 4;
/**
 * three's `EqualStencilFunc`: will return true if the stencil reference value is equal to the current stencil value
 * @category constants
 * @advanced
 */
export const EqualStencilFunc = 514;
/**
 * three's `EquirectangularReflectionMapping`: reflection mapping for equirectangular textures
 * @category constants
 * @standard
 */
export const EquirectangularReflectionMapping = 303;
/**
 * three's `EquirectangularRefractionMapping`: refraction mapping for equirectangular textures
 * @category constants
 * @advanced
 */
export const EquirectangularRefractionMapping = 304;
/**
 * three's `FloatType`: A float data type for textures
 * @category constants
 * @advanced
 */
export const FloatType = 1015;
/**
 * three's `FrontSide`
 * @category constants
 * @standard
 */
export const FrontSide = 0;
/**
 * three's `GLSL1`: GLSL 1 shader code
 * @category constants
 * @advanced
 */
export const GLSL1 = '100';
/**
 * three's `GLSL3`: GLSL 3 shader code
 * @category constants
 * @advanced
 */
export const GLSL3 = '300 es';
/**
 * three's `GreaterCompare`: pass if the incoming value is greater than the texture value
 * @category constants
 * @advanced
 */
export const GreaterCompare = 516;
/**
 * three's `GreaterDepth`: pass if the incoming value is greater than the depth buffer value
 * @category constants
 * @advanced
 */
export const GreaterDepth = 6;
/**
 * three's `GreaterEqualCompare`: pass if the incoming value is greater than or equal to the texture value
 * @category constants
 * @advanced
 */
export const GreaterEqualCompare = 518;
/**
 * three's `GreaterEqualDepth`: pass if the incoming value is greater than or equal to the depth buffer value
 * @category constants
 * @advanced
 */
export const GreaterEqualDepth = 5;
/**
 * three's `GreaterEqualStencilFunc`: will return true if the stencil reference value is greater than or equal to the current stencil value
 * @category constants
 * @advanced
 */
export const GreaterEqualStencilFunc = 518;
/**
 * three's `GreaterStencilFunc`: will return true if the stencil reference value is greater than the current stencil value
 * @category constants
 * @advanced
 */
export const GreaterStencilFunc = 516;
/**
 * three's `HalfFloatType`: A half float data type for textures
 * @category constants
 * @advanced
 */
export const HalfFloatType = 1016;
/**
 * three's `IncrementStencilOp`: increments the current stencil buffer value
 * @category constants
 * @advanced
 */
export const IncrementStencilOp = 7682;
/**
 * three's `IncrementWrapStencilOp`: increments the current stencil buffer value
 * @category constants
 * @advanced
 */
export const IncrementWrapStencilOp = 34055;
/**
 * three's `IntType`: an int data type for textures
 * @category constants
 * @advanced
 */
export const IntType = 1013;
/**
 * three's `InterpolateBezier`: bezier interpolation mode for keyframe tracks
 * @category constants
 * @advanced
 */
export const InterpolateBezier = 2303;
/**
 * three's `InterpolateDiscrete`: discrete interpolation mode for keyframe tracks
 * @category constants
 * @advanced
 */
export const InterpolateDiscrete = 2300;
/**
 * three's `InterpolateLinear`: linear interpolation mode for keyframe tracks
 * @category constants
 * @advanced
 */
export const InterpolateLinear = 2301;
/**
 * three's `InterpolateSmooth`: smooth interpolation mode for keyframe tracks
 * @category constants
 * @advanced
 */
export const InterpolateSmooth = 2302;
/**
 * three's `InterpolationSamplingMode`: represents the different interpolation sampling modes
 * @category constants
 * @advanced
 */
export const InterpolationSamplingMode: {
  readonly NORMAL: 'normal';
  readonly CENTROID: 'centroid';
  readonly SAMPLE: 'sample';
  readonly FIRST: 'first';
  readonly EITHER: 'either';
} = { NORMAL: 'normal', CENTROID: 'centroid', SAMPLE: 'sample', FIRST: 'first', EITHER: 'either' };
/**
 * three's `InterpolationSamplingType`: represents mouse buttons and interaction types in context of controls
 * @category constants
 * @advanced
 */
export const InterpolationSamplingType: {
  readonly PERSPECTIVE: 'perspective';
  readonly LINEAR: 'linear';
  readonly FLAT: 'flat';
} = { PERSPECTIVE: 'perspective', LINEAR: 'linear', FLAT: 'flat' };
/**
 * three's `InvertStencilOp`: inverts the current stencil buffer value bitwise
 * @category constants
 * @advanced
 */
export const InvertStencilOp = 5386;
/**
 * three's `KeepStencilOp`: keeps the current value
 * @category constants
 * @advanced
 */
export const KeepStencilOp = 7680;
/**
 * three's `LessCompare`: pass if the incoming value is less than the texture value
 * @category constants
 * @advanced
 */
export const LessCompare = 513;
/**
 * three's `LessDepth`: pass if the incoming value is less than the depth buffer value
 * @category constants
 * @advanced
 */
export const LessDepth = 2;
/**
 * three's `LessEqualCompare`: pass if the incoming value is less than or equal to the texture value
 * @category constants
 * @advanced
 */
export const LessEqualCompare = 515;
/**
 * three's `LessEqualDepth`: pass if the incoming value is less than or equal to the depth buffer value
 * @category constants
 * @advanced
 */
export const LessEqualDepth = 3;
/**
 * three's `LessEqualStencilFunc`: will return true if the stencil reference value is less than or equal to the current stencil value
 * @category constants
 * @advanced
 */
export const LessEqualStencilFunc = 515;
/**
 * three's `LessStencilFunc`: will return true if the stencil reference value is less than the current stencil value
 * @category constants
 * @advanced
 */
export const LessStencilFunc = 513;
/**
 * three's `LinearFilter`: returns the weighted average of the four texture elements that are closest to the specified texture coordinates, and can include items wrapped or repeated from other parts of a texture, depending on the values of 'wrapS' and 'wrapT', and on the exact mapping
 * @category constants
 * @standard
 */
export const LinearFilter = 1006;
/**
 * three's `LinearMipMapLinearFilter`
 * @category constants
 * @advanced
 */
export const LinearMipMapLinearFilter = 1008;
/**
 * three's `LinearMipMapNearestFilter`
 * @category constants
 * @advanced
 */
export const LinearMipMapNearestFilter = 1007;
/**
 * three's `LinearMipmapLinearFilter`: chooses the two mipmaps that most closely match the size of the pixel being textured and uses the 'LinearFilter' criterion to produce a texture value from each mipmap
 * @category constants
 * @standard
 */
export const LinearMipmapLinearFilter = 1008;
/**
 * three's `LinearMipmapNearestFilter`: chooses the mipmap that most closely matches the size of the pixel being textured and uses the 'LinearFilter' criterion (a weighted average of the four texels that are closest to the center of the pixel) to produce a texture value
 * @category constants
 * @advanced
 */
export const LinearMipmapNearestFilter = 1007;
/**
 * three's `LinearSRGBColorSpace`
 * @category constants
 * @standard
 */
export const LinearSRGBColorSpace = 'srgb-linear';
/**
 * three's `LinearToneMapping`; maps to pixi-3d's `'none'`, with exposure
 * @category constants
 * @standard
 */
export const LinearToneMapping = 1;
/**
 * three's `LinearTransfer`: linear transfer function
 * @category constants
 * @advanced
 */
export const LinearTransfer = 'linear';
/**
 * three's `LoopOnce`: animations are played once
 * @category constants
 * @standard
 */
export const LoopOnce = 2200;
/**
 * three's `LoopPingPong`: animations are played with a chosen number of repetitions, alternately playing forward and backward
 * @category constants
 * @standard
 */
export const LoopPingPong = 2202;
/**
 * three's `LoopRepeat`: animations are played with a chosen number of repetitions, each time jumping from the end of the clip directly to its beginning
 * @category constants
 * @standard
 */
export const LoopRepeat = 2201;
/**
 * three's `MOUSE`: represents mouse buttons and interaction types in context of controls
 * @category constants
 * @standard
 */
export const MOUSE: {
  readonly LEFT: 0;
  readonly MIDDLE: 1;
  readonly RIGHT: 2;
  readonly ROTATE: 0;
  readonly DOLLY: 1;
  readonly PAN: 2;
} = { LEFT: 0, MIDDLE: 1, RIGHT: 2, ROTATE: 0, DOLLY: 1, PAN: 2 };
/**
 * three's `MaterialBlending`: represents material blending
 * @category constants
 * @advanced
 */
export const MaterialBlending = 6;
/**
 * three's `MaxEquation`: A blend equation that uses the maximum of source and destination
 * @category constants
 * @advanced
 */
export const MaxEquation = 104;
/**
 * three's `MinEquation`: A blend equation that uses the minimum of source and destination
 * @category constants
 * @advanced
 */
export const MinEquation = 103;
/**
 * three's `MirroredRepeatWrapping`: the texture will repeats to infinity, mirroring on each repeat
 * @category constants
 * @standard
 */
export const MirroredRepeatWrapping = 1002;
/**
 * three's `MixOperation`: uses reflectivity to blend between the two colors
 * @category constants
 * @advanced
 */
export const MixOperation = 1;
/**
 * three's `MultiplyBlending`: represents multiply blending
 * @category constants
 * @standard
 */
export const MultiplyBlending = 4;
/**
 * three's `MultiplyOperation`: multiplies the environment map color with the surface color
 * @category constants
 * @advanced
 */
export const MultiplyOperation = 0;
/**
 * three's `NearestFilter`: returns the value of the texture element that is nearest (in Manhattan distance) to the specified texture coordinates
 * @category constants
 * @standard
 */
export const NearestFilter = 1003;
/**
 * three's `NearestMipMapLinearFilter`
 * @category constants
 * @advanced
 */
export const NearestMipMapLinearFilter = 1005;
/**
 * three's `NearestMipMapNearestFilter`
 * @category constants
 * @advanced
 */
export const NearestMipMapNearestFilter = 1004;
/**
 * three's `NearestMipmapLinearFilter`: chooses the two mipmaps that most closely match the size of the pixel being textured and uses the 'NearestFilter' criterion to produce a texture value from each mipmap
 * @category constants
 * @advanced
 */
export const NearestMipmapLinearFilter = 1005;
/**
 * three's `NearestMipmapNearestFilter`: chooses the mipmap that most closely matches the size of the pixel being textured and uses the 'NearestFilter' criterion (the texel nearest to the center of the pixel) to produce a texture value
 * @category constants
 * @advanced
 */
export const NearestMipmapNearestFilter = 1004;
/**
 * three's `NeutralToneMapping`; pixi-3d has no neutral curve, so it maps to `'aces'`
 * @category constants
 * @standard
 */
export const NeutralToneMapping = 7;
/**
 * three's `NeverCompare`: never pass
 * @category constants
 * @advanced
 */
export const NeverCompare = 512;
/**
 * three's `NeverDepth`: never pass
 * @category constants
 * @advanced
 */
export const NeverDepth = 0;
/**
 * three's `NeverStencilFunc`: will never return true
 * @category constants
 * @advanced
 */
export const NeverStencilFunc = 512;
/**
 * three's `NoBlending`: no blending is performed which effectively disables alpha transparency
 * @category constants
 * @standard
 */
export const NoBlending = 0;
/**
 * three's `NoColorSpace`: no color space
 * @category constants
 * @standard
 */
export const NoColorSpace = '';
/**
 * three's `NoNormalPacking`: no normal map packing
 * @category constants
 * @advanced
 */
export const NoNormalPacking = '';
/**
 * three's `NoToneMapping`; maps to pixi-3d's `'none'`
 * @category constants
 * @standard
 */
export const NoToneMapping = 0;
/**
 * three's `NormalAnimationBlendMode`: default animation blend mode
 * @category constants
 * @advanced
 */
export const NormalAnimationBlendMode = 2500;
/**
 * three's `NormalBlending`: the default blending
 * @category constants
 * @standard
 */
export const NormalBlending = 1;
/**
 * three's `NormalGAPacking`: normal GA packing
 * @category constants
 * @advanced
 */
export const NormalGAPacking = 'ga';
/**
 * three's `NormalRGPacking`: normal RG packing
 * @category constants
 * @advanced
 */
export const NormalRGPacking = 'rg';
/**
 * three's `NotEqualCompare`: pass if the incoming value is not equal to the texture value
 * @category constants
 * @advanced
 */
export const NotEqualCompare = 517;
/**
 * three's `NotEqualDepth`: pass if the incoming value is not equal to the depth buffer value
 * @category constants
 * @advanced
 */
export const NotEqualDepth = 7;
/**
 * three's `NotEqualStencilFunc`: will return true if the stencil reference value is not equal to the current stencil value
 * @category constants
 * @advanced
 */
export const NotEqualStencilFunc = 517;
/**
 * three's `ObjectSpaceNormalMap`: normal information is relative to the object orientation
 * @category constants
 * @advanced
 */
export const ObjectSpaceNormalMap = 1;
/**
 * three's `OneFactor`: multiplies all colors by '1'
 * @category constants
 * @advanced
 */
export const OneFactor = 201;
/**
 * three's `OneMinusConstantAlphaFactor`: multiplies all colors by 1 minus a constant alpha value
 * @category constants
 * @advanced
 */
export const OneMinusConstantAlphaFactor = 214;
/**
 * three's `OneMinusConstantColorFactor`: multiplies all colors by '1' minus a constant color
 * @category constants
 * @advanced
 */
export const OneMinusConstantColorFactor = 212;
/**
 * three's `OneMinusDstAlphaFactor`: multiplies all colors by '1' minus the destination alpha value
 * @category constants
 * @advanced
 */
export const OneMinusDstAlphaFactor = 207;
/**
 * three's `OneMinusDstColorFactor`: multiplies all colors by '1' minus each destination color
 * @category constants
 * @advanced
 */
export const OneMinusDstColorFactor = 209;
/**
 * three's `OneMinusSrcAlphaFactor`: multiplies all colors by 1 minus the source alpha value
 * @category constants
 * @advanced
 */
export const OneMinusSrcAlphaFactor = 205;
/**
 * three's `OneMinusSrcColorFactor`: multiplies all colors by '1' minus each source color
 * @category constants
 * @advanced
 */
export const OneMinusSrcColorFactor = 203;
/**
 * three's `PCFShadowMap`, r3f's default; maps to pixi-3d's `'pcf'` shadow filter
 * @category constants
 * @standard
 */
export const PCFShadowMap = 1;
/**
 * three's `PCFSoftShadowMap`; maps to pixi-3d's `'pcf-high'` shadow filter
 * @category constants
 * @standard
 */
export const PCFSoftShadowMap = 2;
/**
 * three's `R11_EAC_Format`: EAC R11 UNORM format
 * @category constants
 * @advanced
 */
export const R11_EAC_Format = 37488;
/**
 * three's `RED_GREEN_RGTC2_Format`: RGTC2 Red Green format
 * @category constants
 * @advanced
 */
export const RED_GREEN_RGTC2_Format = 36285;
/**
 * three's `RED_RGTC1_Format`: RGTC1 Red format
 * @category constants
 * @advanced
 */
export const RED_RGTC1_Format = 36283;
/**
 * three's `REVISION`
 * @category constants
 * @advanced
 */
export const REVISION = '187';
/**
 * three's `RG11_EAC_Format`: EAC RG11 UNORM format
 * @category constants
 * @advanced
 */
export const RG11_EAC_Format = 37490;
/**
 * three's `RGBADepthPacking`: the depth value is packed into 32 bit RGBA
 * @category constants
 * @advanced
 */
export const RGBADepthPacking = 3201;
/**
 * three's `RGBAFormat`; r3f's core reads it when it tags textures
 * @category constants
 * @advanced
 */
export const RGBAFormat = 1023;
/**
 * three's `RGBAIntegerFormat`: reads the red, green, blue and alpha components
 * @category constants
 * @advanced
 */
export const RGBAIntegerFormat = 1033;
/**
 * three's `RGBA_ASTC_10x10_Format`: ASTC RGBA 10x10 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_10x10_Format = 37819;
/**
 * three's `RGBA_ASTC_10x5_Format`: ASTC RGBA 10x5 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_10x5_Format = 37816;
/**
 * three's `RGBA_ASTC_10x6_Format`: ASTC RGBA 10x6 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_10x6_Format = 37817;
/**
 * three's `RGBA_ASTC_10x8_Format`: ASTC RGBA 10x8 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_10x8_Format = 37818;
/**
 * three's `RGBA_ASTC_12x10_Format`: ASTC RGBA 12x10 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_12x10_Format = 37820;
/**
 * three's `RGBA_ASTC_12x12_Format`: ASTC RGBA 12x12 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_12x12_Format = 37821;
/**
 * three's `RGBA_ASTC_4x4_Format`: ASTC RGBA 4x4 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_4x4_Format = 37808;
/**
 * three's `RGBA_ASTC_5x4_Format`: ASTC RGBA 5x4 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_5x4_Format = 37809;
/**
 * three's `RGBA_ASTC_5x5_Format`: ASTC RGBA 5x5 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_5x5_Format = 37810;
/**
 * three's `RGBA_ASTC_6x5_Format`: ASTC RGBA 6x5 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_6x5_Format = 37811;
/**
 * three's `RGBA_ASTC_6x6_Format`: ASTC RGBA 6x6 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_6x6_Format = 37812;
/**
 * three's `RGBA_ASTC_8x5_Format`: ASTC RGBA 8x5 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_8x5_Format = 37813;
/**
 * three's `RGBA_ASTC_8x6_Format`: ASTC RGBA 8x6 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_8x6_Format = 37814;
/**
 * three's `RGBA_ASTC_8x8_Format`: ASTC RGBA 8x8 format
 * @category constants
 * @advanced
 */
export const RGBA_ASTC_8x8_Format = 37815;
/**
 * three's `RGBA_BPTC_Format`: BPTC RGBA format
 * @category constants
 * @advanced
 */
export const RGBA_BPTC_Format = 36492;
/**
 * three's `RGBA_ETC2_EAC_Format`: ETC2 RGBA format
 * @category constants
 * @advanced
 */
export const RGBA_ETC2_EAC_Format = 37496;
/**
 * three's `RGBA_PVRTC_2BPPV1_Format`: PVRTC RGBA compression in 2-bit mode
 * @category constants
 * @advanced
 */
export const RGBA_PVRTC_2BPPV1_Format = 35843;
/**
 * three's `RGBA_PVRTC_4BPPV1_Format`: PVRTC RGBA compression in 4-bit mode
 * @category constants
 * @advanced
 */
export const RGBA_PVRTC_4BPPV1_Format = 35842;
/**
 * three's `RGBA_S3TC_DXT1_Format`: A DXT1-compressed image in an RGB image format with a simple on/off alpha value
 * @category constants
 * @advanced
 */
export const RGBA_S3TC_DXT1_Format = 33777;
/**
 * three's `RGBA_S3TC_DXT3_Format`: A DXT3-compressed image in an RGBA image format
 * @category constants
 * @advanced
 */
export const RGBA_S3TC_DXT3_Format = 33778;
/**
 * three's `RGBA_S3TC_DXT5_Format`: A DXT5-compressed image in an RGBA image format
 * @category constants
 * @advanced
 */
export const RGBA_S3TC_DXT5_Format = 33779;
/**
 * three's `RGBDepthPacking`: the depth value is packed into 24 bit RGB
 * @category constants
 * @advanced
 */
export const RGBDepthPacking = 3202;
/**
 * three's `RGBFormat`: discards the alpha component and reads the red, green and blue component
 * @category constants
 * @advanced
 */
export const RGBFormat = 1022;
/**
 * three's `RGBIntegerFormat`: discards the alpha component and reads the red, green and blue component
 * @category constants
 * @advanced
 */
export const RGBIntegerFormat = 1032;
/**
 * three's `RGB_BPTC_SIGNED_Format`: BPTC Signed RGB format
 * @category constants
 * @advanced
 */
export const RGB_BPTC_SIGNED_Format = 36494;
/**
 * three's `RGB_BPTC_UNSIGNED_Format`: BPTC Unsigned RGB format
 * @category constants
 * @advanced
 */
export const RGB_BPTC_UNSIGNED_Format = 36495;
/**
 * three's `RGB_ETC1_Format`: ETC1 RGB format
 * @category constants
 * @advanced
 */
export const RGB_ETC1_Format = 36196;
/**
 * three's `RGB_ETC2_Format`: ETC2 RGB format
 * @category constants
 * @advanced
 */
export const RGB_ETC2_Format = 37492;
/**
 * three's `RGB_PVRTC_2BPPV1_Format`: PVRTC RGB compression in 2-bit mode
 * @category constants
 * @advanced
 */
export const RGB_PVRTC_2BPPV1_Format = 35841;
/**
 * three's `RGB_PVRTC_4BPPV1_Format`: PVRTC RGB compression in 4-bit mode
 * @category constants
 * @advanced
 */
export const RGB_PVRTC_4BPPV1_Format = 35840;
/**
 * three's `RGB_S3TC_DXT1_Format`: A DXT1-compressed image in an RGB image format
 * @category constants
 * @advanced
 */
export const RGB_S3TC_DXT1_Format = 33776;
/**
 * three's `RGDepthPacking`: the depth value is packed into 16 bit RG
 * @category constants
 * @advanced
 */
export const RGDepthPacking = 3203;
/**
 * three's `RGFormat`: discards the alpha, and blue components and reads the red, and green components
 * @category constants
 * @advanced
 */
export const RGFormat = 1030;
/**
 * three's `RGIntegerFormat`: discards the alpha, and blue components and reads the red, and green components
 * @category constants
 * @advanced
 */
export const RGIntegerFormat = 1031;
/**
 * three's `RedFormat`: discards the green, blue and alpha components and reads just the red component
 * @category constants
 * @advanced
 */
export const RedFormat = 1028;
/**
 * three's `RedIntegerFormat`: discards the green, blue and alpha components and reads just the red component
 * @category constants
 * @advanced
 */
export const RedIntegerFormat = 1029;
/**
 * three's `ReinhardToneMapping`; maps to pixi-3d's `'reinhard'`
 * @category constants
 * @standard
 */
export const ReinhardToneMapping = 2;
/**
 * three's `RenderObjectRefreshType`: represents the refresh types of render objects
 * @category constants
 * @advanced
 */
export const RenderObjectRefreshType: { readonly NONE: 0; readonly SHARED: 1; readonly FULL: 2 } = {
  NONE: 0,
  SHARED: 1,
  FULL: 2,
};
/**
 * three's `RepeatWrapping`: the texture will simply repeat to infinity
 * @category constants
 * @standard
 */
export const RepeatWrapping = 1000;
/**
 * three's `ReplaceStencilOp`: sets the stencil buffer value to the specified reference value
 * @category constants
 * @advanced
 */
export const ReplaceStencilOp = 7681;
/**
 * three's `ReverseSubtractEquation`: A 'destination; source' blending equation
 * @category constants
 * @advanced
 */
export const ReverseSubtractEquation = 102;
/**
 * three's `SIGNED_R11_EAC_Format`: EAC R11 SNORM format
 * @category constants
 * @advanced
 */
export const SIGNED_R11_EAC_Format = 37489;
/**
 * three's `SIGNED_RED_GREEN_RGTC2_Format`: RGTC2 Signed Red Green format
 * @category constants
 * @advanced
 */
export const SIGNED_RED_GREEN_RGTC2_Format = 36286;
/**
 * three's `SIGNED_RED_RGTC1_Format`: RGTC1 Signed Red format
 * @category constants
 * @advanced
 */
export const SIGNED_RED_RGTC1_Format = 36284;
/**
 * three's `SIGNED_RG11_EAC_Format`: EAC RG11 SNORM format
 * @category constants
 * @advanced
 */
export const SIGNED_RG11_EAC_Format = 37491;
/**
 * three's `SRGBColorSpace`; r3f sets it as the output colour space
 * @category constants
 * @standard
 */
export const SRGBColorSpace = 'srgb';
/**
 * three's `SRGBTransfer`: sRGB transfer function
 * @category constants
 * @advanced
 */
export const SRGBTransfer = 'srgb';
/**
 * three's `ShortType`: A short data type for textures
 * @category constants
 * @advanced
 */
export const ShortType = 1011;
/**
 * three's `SrcAlphaFactor`: multiplies all colors by the source alpha value
 * @category constants
 * @advanced
 */
export const SrcAlphaFactor = 204;
/**
 * three's `SrcAlphaSaturateFactor`: multiplies the RGB colors by the smaller of either the source alpha value or the value of '1' minus the destination alpha value
 * @category constants
 * @advanced
 */
export const SrcAlphaSaturateFactor = 210;
/**
 * three's `SrcColorFactor`: multiplies all colors by the source colors
 * @category constants
 * @advanced
 */
export const SrcColorFactor = 202;
/**
 * three's `StaticCopyUsage`: the contents are intended to be specified once by reading data from the 3D API, and used many times as the source for WebGL drawing and image specification commands
 * @category constants
 * @advanced
 */
export const StaticCopyUsage = 35046;
/**
 * three's `StaticDrawUsage`: the contents are intended to be specified once by the application, and used many times as the source for drawing and image specification commands
 * @category constants
 * @advanced
 */
export const StaticDrawUsage = 35044;
/**
 * three's `StaticReadUsage`: the contents are intended to be specified once by reading data from the 3D API, and queried many times by the application
 * @category constants
 * @advanced
 */
export const StaticReadUsage = 35045;
/**
 * three's `StreamCopyUsage`: the contents are intended to be specified once by reading data from the 3D API, and used at most a few times as the source for WebGL drawing and image specification commands
 * @category constants
 * @advanced
 */
export const StreamCopyUsage = 35042;
/**
 * three's `StreamDrawUsage`: the contents are intended to be specified once by the application, and used at most a few times as the source for drawing and image specification commands
 * @category constants
 * @advanced
 */
export const StreamDrawUsage = 35040;
/**
 * three's `StreamReadUsage`: the contents are intended to be specified once by reading data from the 3D API, and queried at most a few times by the application
 * @category constants
 * @advanced
 */
export const StreamReadUsage = 35041;
/**
 * three's `SubtractEquation`: A 'source; destination' blending equation
 * @category constants
 * @advanced
 */
export const SubtractEquation = 101;
/**
 * three's `SubtractiveBlending`: represents subtractive blending
 * @category constants
 * @standard
 */
export const SubtractiveBlending = 3;
/**
 * three's `TOUCH`: represents touch interaction types in context of controls
 * @category constants
 * @standard
 */
export const TOUCH: { readonly ROTATE: 0; readonly PAN: 1; readonly DOLLY_PAN: 2; readonly DOLLY_ROTATE: 3 } = {
  ROTATE: 0,
  PAN: 1,
  DOLLY_PAN: 2,
  DOLLY_ROTATE: 3,
};
/**
 * three's `TangentSpaceNormalMap`: normal information is relative to the underlying surface
 * @category constants
 * @advanced
 */
export const TangentSpaceNormalMap = 0;
/**
 * three's `TimestampQuery`: represents the different timestamp query types
 * @category constants
 * @advanced
 */
export const TimestampQuery: { readonly COMPUTE: 'compute'; readonly RENDER: 'render' } = {
  COMPUTE: 'compute',
  RENDER: 'render',
};
/**
 * three's `TriangleFanDrawMode`: for each vertex draw a triangle from the first vertex and the last two vertices
 * @category constants
 * @advanced
 */
export const TriangleFanDrawMode = 2;
/**
 * three's `TriangleStripDrawMode`: for each vertex draw a triangle from the last three vertices
 * @category constants
 * @advanced
 */
export const TriangleStripDrawMode = 1;
/**
 * three's `TrianglesDrawMode`: for every three vertices draw a single triangle
 * @category constants
 * @advanced
 */
export const TrianglesDrawMode = 0;
/**
 * three's `UVMapping`: maps textures using the geometry's UV coordinates
 * @category constants
 * @advanced
 */
export const UVMapping = 300;
/**
 * three's `UnsignedByteType`; r3f's core reads it when it tags textures
 * @category constants
 * @advanced
 */
export const UnsignedByteType = 1009;
/**
 * three's `UnsignedInt101111Type`: an unsigned int 10_11_11 (packed) data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedInt101111Type = 35899;
/**
 * three's `UnsignedInt248Type`: an unsigned int 24_8 data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedInt248Type = 1020;
/**
 * three's `UnsignedInt5999Type`: an unsigned int 5_9_9_9 (packed) data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedInt5999Type = 35902;
/**
 * three's `UnsignedIntType`: an unsigned int data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedIntType = 1014;
/**
 * three's `UnsignedShort4444Type`: an unsigned short 4_4_4_4 (packed) data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedShort4444Type = 1017;
/**
 * three's `UnsignedShort5551Type`: an unsigned short 5_5_5_1 (packed) data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedShort5551Type = 1018;
/**
 * three's `UnsignedShortType`: an unsigned short data type for textures
 * @category constants
 * @advanced
 */
export const UnsignedShortType = 1012;
/**
 * three's `VSMShadowMap`; pixi-3d has no VSM, so it maps to `'pcf-high'`
 * @category constants
 * @standard
 */
export const VSMShadowMap = 3;
/**
 * three's `WebGLCoordinateSystem`: webGL coordinate system
 * @category constants
 * @advanced
 */
export const WebGLCoordinateSystem = 2000;
/**
 * three's `WebGPUCoordinateSystem`: webGPU coordinate system
 * @category constants
 * @advanced
 */
export const WebGPUCoordinateSystem = 2001;
/**
 * three's `WrapAroundEnding`: wrap around ending for animations
 * @category constants
 * @advanced
 */
export const WrapAroundEnding = 2402;
/**
 * three's `ZeroCurvatureEnding`: zero curvature ending for animations
 * @category constants
 * @advanced
 */
export const ZeroCurvatureEnding = 2400;
/**
 * three's `ZeroFactor`: multiplies all colors by '0'
 * @category constants
 * @advanced
 */
export const ZeroFactor = 200;
/**
 * three's `ZeroSlopeEnding`: zero slope ending for animations
 * @category constants
 * @advanced
 */
export const ZeroSlopeEnding = 2401;
/**
 * three's `ZeroStencilOp`: sets the stencil buffer value to '0'
 * @category constants
 * @advanced
 */
export const ZeroStencilOp = 0;
