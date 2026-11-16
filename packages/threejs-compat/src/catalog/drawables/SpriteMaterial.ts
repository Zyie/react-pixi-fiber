import { FlatMaterial } from '@pixi/3d';
import type { ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { readSlot, writeSlot } from '../materials/textureSlots';
import { initThreeMaterial, threeDescriptor } from '../materials/threeMaterial';
import type { MaterialParameters } from '../materials/threeMaterial';

/**
 * three's `SpriteMaterial` parameters
 * @category catalog
 * @standard
 */
export interface SpriteMaterialParameters extends MaterialParameters {
  /** Colour */
  color?: ColorRepresentation;
  /** The sprite's image, multiplied by `color` */
  map?: Texture | null;
  /** Opacity in the green channel, multiplying `opacity` */
  alphaMap?: Texture | null;
  /** Turns the sprite in the screen plane, in radians */
  rotation?: number;
  /** Kept for three's shape: sprites shrink with distance, as with three's default */
  sizeAttenuation?: boolean;
}

/** Turns the sprite's quad in its own plane before pixi-3d turns it to the camera, and multiplies alpha by the alpha map's green channel */
const spriteBit: ShaderBit = {
  name: 'threeSprite',
  textures: ['alphaMap'],
  bindings: { material: { spriteRotation: 'f32' } },
  gpu: {
    vertex: {
      beforeTransform: /* wgsl */ `
  let spriteCos = cos(material.spriteRotation);
  let spriteSin = sin(material.spriteRotation);
  position = vec4<f32>(spriteCos * position.x - spriteSin * position.y, spriteSin * position.x + spriteCos * position.y, position.z, position.w);
`,
    },
    fragment: {
      material: /* wgsl */ `
  alpha *= sampleAlphaMap(input.vUV).g;
`,
    },
  },
  gl: {
    vertex: {
      beforeTransform: /* glsl */ `
  float spriteCos = cos(material.spriteRotation);
  float spriteSin = sin(material.spriteRotation);
  position.xy = vec2(spriteCos * position.x - spriteSin * position.y, spriteSin * position.x + spriteCos * position.y);
`,
    },
    fragment: {
      material: /* glsl */ `
  alpha *= sampleAlphaMap(vUV).g;
`,
    },
  },
};

/**
 * three's `SpriteMaterial`, an unlit image for a `<sprite>`, over pixi-3d's `FlatMaterial`
 *
 * Transparent by default, as in three. `rotation` turns the sprite in the screen plane.
 * `sizeAttenuation` is kept, and sprites always shrink with distance.
 * @example
 * ```tsx
 * <sprite scale={[2, 1, 1]}>
 *   <spriteMaterial map={texture} />
 * </sprite>
 * ```
 * @category catalog
 * @standard
 */
export class SpriteMaterial extends FlatMaterial {
  /** Always `true`, as on three's `SpriteMaterial` */
  public readonly isSpriteMaterial = true;
  /** three's class name */
  public type = 'SpriteMaterial';
  /** Kept for three's shape: sprites shrink with distance */
  public sizeAttenuation = true;
  private readonly _color: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: SpriteMaterialParameters = {}) {
    super({ extraBits: [spriteBit] });
    this.state.culling = false;
    this._color = new Color(0xffffff)._onChange(() => {
      this.baseColor = toPixiColor(this._color);
    });
    this._color._onChangeCallback();
    initThreeMaterial(this, { transparent: true, ...parameters });
  }

  /** Colour, in the working colour space; pixi-3d's `baseColor` follows it */
  public get color(): Color {
    return this._color;
  }

  public set color(value: ColorRepresentation) {
    this._color.set(value);
  }

  /** Turns the sprite in the screen plane, in radians @default 0 */
  public get rotation(): number {
    return (this.data as unknown as { spriteRotation: number }).spriteRotation;
  }

  public set rotation(value: number) {
    (this.data as unknown as { spriteRotation: number }).spriteRotation = value;
    this.update();
  }

  /** The sprite's image, multiplied by `color`, or `null` */
  public get map(): Texture | null {
    return readSlot(this, 'baseColor');
  }

  public set map(value: Texture | null) {
    writeSlot(this, 'baseColor', value);
  }

  /** Opacity in the green channel, multiplying `opacity`, or `null` */
  public get alphaMap(): Texture | null {
    return readSlot(this, 'alphaMap');
  }

  public set alphaMap(value: Texture | null) {
    writeSlot(this, 'alphaMap', value);
  }

  /**
   * pixi-3d's flat shader, with three's back-side handling
   * @param view - The view about to draw the material
   * @advanced
   */
  public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
    return threeDescriptor(this, super.getPrimaryDescriptor(view));
  }
}
