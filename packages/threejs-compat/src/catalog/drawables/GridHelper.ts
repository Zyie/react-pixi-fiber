/*!
 * Adapted from three.js r187, src/helpers/GridHelper.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Color } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { Float32BufferAttribute } from '../geometries/BufferAttribute';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { LineBasicMaterial } from './LineBasicMaterial';
import { LineSegments } from './LineSegments';

/**
 * three's `GridHelper`: a square grid of lines on the XZ plane, its two centre lines in `color1`
 * @example
 * ```tsx
 * <gridHelper args={[10, 10, 'white', 'gray']} />
 * ```
 * @category catalog
 * @standard
 */
export class GridHelper extends LineSegments {
  /**
   * @param size - Width and depth of the grid
   * @param divisions - Cells along each side
   * @param color1 - Colour of the centre lines
   * @param color2 - Colour of the other lines
   */
  constructor(
    size = 10,
    divisions = 10,
    color1: ColorRepresentation = 0x444444,
    color2: ColorRepresentation = 0x888888,
  ) {
    const center = new Color(color1);
    const grid = new Color(color2);
    const step = size / divisions;
    const half = size / 2;
    const vertices: number[] = [];
    const colors: number[] = [];

    for (let i = 0, k = -half; i <= divisions; i++, k += step) {
      vertices.push(-half, 0, k, half, 0, k, k, 0, -half, k, 0, half);
      const color = i === divisions / 2 ? center : grid;
      for (let c = 0; c < 4; c++) color.toArray(colors, colors.length);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    super(geometry, new LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    this.type = 'GridHelper';
  }

  /** Frees the grid with its geometry and material, which no other node holds */
  public override destroy(): void {
    const { geometry, material } = this;
    super.destroy();
    geometry.destroy(true);
    material.destroy();
  }
}
