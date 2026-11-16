/*!
 * Adapted from three.js r187, src/helpers/ArrowHelper.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import type { PointData3D } from '@pixi/3d';

import type { ColorRepresentation } from '../../math/Color';
import { Vector3 } from '../../math/Vector3';
import { Float32BufferAttribute } from '../geometries/BufferAttribute';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { ConeGeometry } from '../geometries/ConeGeometry';
import { MeshBasicMaterial } from '../materials/MeshBasicMaterial';
import { Mesh } from '../objects/Mesh';
import { Object3D } from '../objects/Object3D';
import { Line } from './Line';
import { LineBasicMaterial } from './LineBasicMaterial';

const axis = new Vector3();

/**
 * three's `ArrowHelper`: a line and a cone pointing along a direction
 * @example
 * ```tsx
 * <arrowHelper args={[new Vector3(1, 0, 0), new Vector3(0, 0, 0), 2, 'hotpink']} />
 * ```
 * @category catalog
 * @standard
 */
export class ArrowHelper extends Object3D {
  /** three's class name */
  public type = 'ArrowHelper';
  /** The shaft */
  public readonly line: Line;
  /** The head */
  public readonly cone: Mesh;

  /**
   * @param dir - Which way it points; normalised
   * @param origin - Where it starts
   * @param length - Length, head included
   * @param color - Colour
   * @param headLength - Length of the head
   * @param headWidth - Width of the head
   */
  constructor(
    dir: PointData3D = new Vector3(0, 0, 1),
    origin: PointData3D = new Vector3(0, 0, 0),
    length = 1,
    color: ColorRepresentation = 0xffff00,
    headLength: number = length * 0.2,
    headWidth: number = headLength * 0.2,
  ) {
    super();
    const shaft = new BufferGeometry();
    shaft.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
    const head = new ConeGeometry(0.5, 1, 5, 1).translate(0, -0.5, 0);
    this.position.copyFrom(origin);
    this.line = new Line(shaft, new LineBasicMaterial({ color, toneMapped: false }));
    this.cone = new Mesh(head, new MeshBasicMaterial({ color, toneMapped: false }));
    this.addChild(this.line, this.cone);
    this.setDirection(dir);
    this.setLength(length, headLength, headWidth);
  }

  /**
   * Points the arrow
   * @param dir - Which way, normalised
   */
  public setDirection(dir: PointData3D): void {
    if (dir.y > 0.99999) this.quaternion.set(0, 0, 0, 1);
    else if (dir.y < -0.99999) this.quaternion.set(1, 0, 0, 0);
    else this.quaternion.setFromAxisAngle(axis.set(dir.z, 0, -dir.x).normalize(), Math.acos(dir.y));
  }

  /**
   * Sizes the arrow
   * @param length - Length, head included
   * @param headLength - Length of the head
   * @param headWidth - Width of the head
   */
  public setLength(length: number, headLength: number = length * 0.2, headWidth: number = headLength * 0.2): void {
    this.line.scale.set(1, Math.max(0.0001, length - headLength), 1);
    this.cone.scale.set(headWidth, headLength, headWidth);
    this.cone.position.y = length;
  }

  /**
   * Recolours the arrow
   * @param color - The colour
   */
  public setColor(color: ColorRepresentation): void {
    (this.line.material as LineBasicMaterial).color.set(color);
    (this.cone.material as MeshBasicMaterial).color.set(color);
  }

  /** Frees the arrow with the shaft's and head's geometries and materials, which no other node holds */
  public override destroy(): void {
    for (const part of [this.line, this.cone]) {
      const { geometry, material } = part;
      part.destroy();
      geometry.destroy(true);
      material.destroy();
    }
    super.destroy();
  }
}
