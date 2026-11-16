/*!
 * Adapted from three.js r187, src/helpers/AxesHelper.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Color } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { Float32BufferAttribute } from '../geometries/BufferAttribute';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { LineBasicMaterial } from './LineBasicMaterial';
import { LineSegments } from './LineSegments';

/**
 * three's `AxesHelper`: the X, Y and Z axes as red, green and blue lines from the origin
 * @example
 * ```tsx
 * <axesHelper args={[2]} />
 * ```
 * @category catalog
 * @standard
 */
export class AxesHelper extends LineSegments {
  /** @param size - Length of each axis line */
  constructor(size = 1) {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0, 0, size, 0, 0, 0, 0, 0, 0, size, 0, 0, 0, 0, 0, 0, size], 3),
    );
    geometry.setAttribute(
      'color',
      new Float32BufferAttribute([1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0, 0, 0, 1, 0, 0.6, 1], 3),
    );
    super(geometry, new LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    this.type = 'AxesHelper';
  }

  /**
   * Recolours the axes
   * @param xAxisColor - Colour of the X axis
   * @param yAxisColor - Colour of the Y axis
   * @param zAxisColor - Colour of the Z axis
   * @returns This helper
   */
  public setColors(
    xAxisColor: ColorRepresentation,
    yAxisColor: ColorRepresentation,
    zAxisColor: ColorRepresentation,
  ): this {
    const geometry = this.geometry as BufferGeometry;
    const attribute = geometry.getAttribute('color');
    const colors = [xAxisColor, yAxisColor, zAxisColor].map((value) => new Color(value));
    colors.forEach((color, axis) => {
      color.toArray(attribute.array as Float32Array, axis * 6);
      color.toArray(attribute.array as Float32Array, axis * 6 + 3);
    });
    attribute.needsUpdate = true;
    return this;
  }

  /** Frees the helper with its geometry and material, which no other node holds */
  public override destroy(): void {
    const { geometry, material } = this;
    super.destroy();
    geometry.destroy(true);
    material.destroy();
  }
}
