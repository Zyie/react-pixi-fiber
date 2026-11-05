/*!
 * Adapted from three.js r187, src/helpers/BoxHelper.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import type { Container3D } from '@pixi/3d';

import { Box3 } from '../../math/Box3';
import type { ColorRepresentation } from '../../math/Color';
import { BufferAttribute } from '../geometries/BufferAttribute';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { LineBasicMaterial } from './LineBasicMaterial';
import { LineSegments } from './LineSegments';

const box = new Box3();

/**
 * three's `BoxHelper`: the edges of an object's world bounding box; call `update()` after the object
 * moves
 * @example
 * ```ts
 * const helper = new BoxHelper(mesh, 'yellow');
 * scene.add(helper);
 * ```
 * @category catalog
 * @standard
 */
export class BoxHelper extends LineSegments {
  /** The object it outlines */
  public object?: Container3D;

  /**
   * @param object - The object to outline
   * @param color - Colour of the lines
   */
  constructor(object?: Container3D, color: ColorRepresentation = 0xffff00) {
    const geometry = new BufferGeometry();
    geometry.setIndex(
      new BufferAttribute(new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]), 1),
    );
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(24), 3));
    super(geometry, new LineBasicMaterial({ color, toneMapped: false }));
    this.type = 'BoxHelper';
    this.object = object;
    this.update();
  }

  /** Fits the box around the object again */
  public update(): void {
    if (!this.object) return;
    box.setFromObject(this.object);
    if (box.isEmpty()) return;
    const { min, max } = box;
    const position = (this.geometry as BufferGeometry).getAttribute('position');
    // prettier-ignore
    position.copyArray([
      max.x, max.y, max.z, min.x, max.y, max.z, min.x, min.y, max.z, max.x, min.y, max.z,
      max.x, max.y, min.z, min.x, max.y, min.z, min.x, min.y, min.z, max.x, min.y, min.z,
    ]);
    position.needsUpdate = true;
    (this.geometry as BufferGeometry).computeBoundingSphere();
  }

  /**
   * Outlines another object
   * @param object - The object to outline
   * @returns This helper
   */
  public setFromObject(object: Container3D): this {
    this.object = object;
    this.update();
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
