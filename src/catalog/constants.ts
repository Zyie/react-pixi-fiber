/** three's `NoToneMapping`; maps to pixi-3d's `'none'` @category constants @standard */
export const NoToneMapping = 0;
/** three's `LinearToneMapping`; maps to pixi-3d's `'none'`, with exposure @category constants @standard */
export const LinearToneMapping = 1;
/** three's `ReinhardToneMapping`; maps to pixi-3d's `'reinhard'` @category constants @standard */
export const ReinhardToneMapping = 2;
/** three's `CineonToneMapping`; maps to pixi-3d's filmic `'uncharted2'` @category constants @standard */
export const CineonToneMapping = 3;
/** three's `ACESFilmicToneMapping`, r3f's default; maps to pixi-3d's `'aces'` @category constants @standard */
export const ACESFilmicToneMapping = 4;
/** three's `CustomToneMapping`; maps to pixi-3d's `'custom'` @category constants @standard */
export const CustomToneMapping = 5;
/** three's `AgXToneMapping`; pixi-3d has no AgX, so it maps to `'aces'` @category constants @standard */
export const AgXToneMapping = 6;
/** three's `NeutralToneMapping`; pixi-3d has no neutral curve, so it maps to `'aces'` @category constants @standard */
export const NeutralToneMapping = 7;

/** three's `BasicShadowMap`; maps to pixi-3d's `'hard'` shadow filter @category constants @standard */
export const BasicShadowMap = 0;
/** three's `PCFShadowMap`, r3f's default; maps to pixi-3d's `'pcf'` shadow filter @category constants @standard */
export const PCFShadowMap = 1;
/** three's `PCFSoftShadowMap`; maps to pixi-3d's `'pcf-high'` shadow filter @category constants @standard */
export const PCFSoftShadowMap = 2;
/** three's `VSMShadowMap`; pixi-3d has no VSM, so it maps to `'pcf-high'` @category constants @standard */
export const VSMShadowMap = 3;

/** three's `FrontSide` @category constants @standard */
export const FrontSide = 0;
/** three's `BackSide` @category constants @standard */
export const BackSide = 1;
/** three's `DoubleSide` @category constants @standard */
export const DoubleSide = 2;

/** three's `SRGBColorSpace`; r3f sets it as the output colour space @category constants @standard */
export const SRGBColorSpace = 'srgb';
/** three's `LinearSRGBColorSpace` @category constants @standard */
export const LinearSRGBColorSpace = 'srgb-linear';
/** three's `RGBAFormat`; r3f's core reads it when it tags textures @category constants @advanced */
export const RGBAFormat = 1023;
/** three's `UnsignedByteType`; r3f's core reads it when it tags textures @category constants @advanced */
export const UnsignedByteType = 1009;
