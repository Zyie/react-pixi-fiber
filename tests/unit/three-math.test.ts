import {
  Box3,
  Color,
  ColorManagement,
  Euler,
  MathUtils,
  Matrix4,
  Object3D,
  Plane,
  Quaternion,
  Ray,
  Sphere,
  Vector3,
} from '@react-fiber/threejs-compat/three';
import type { EulerOrder } from '@react-fiber/threejs-compat/three';
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installObject3DSurface } from '~threejs-compat/compat/installObject3DSurface';

// Numbers have no picture: each case runs the same calls on react-pixi-fiber/three and on three.js
// itself and expects the same result. Matrices are float32 on pixi-3d, so they match to about 1e-6.

const ORDERS: EulerOrder[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
const ANGLES: [number, number, number][] = [
  [0.3, -0.7, 1.1],
  [1.4, 0.2, -2.5],
  [-0.9, 1.5, 0.4],
];

const expectClose = (actual: Iterable<unknown>, expected: Iterable<unknown>, digits = 5): void => {
  const a = [...actual];
  const e = [...expected];
  expect(a.length).toBe(e.length);
  a.forEach((value, i) =>
    typeof value === 'number' ? expect(value).toBeCloseTo(e[i] as number, digits) : expect(value).toBe(e[i]),
  );
};

describe('rotations match three in every axis order', () => {
  for (const order of ORDERS) {
    it(`${order}: Euler to quaternion and matrix, and back`, () => {
      for (const [x, y, z] of ANGLES) {
        const q = new Quaternion().setFromEuler(new Euler(x, y, z, order));
        const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, order));
        expectClose(q, tq, 6);

        const m = new Matrix4().makeRotationFromEuler(new Euler(x, y, z, order));
        const tm = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x, y, z, order));
        expectClose(m.elements, tm.elements);

        expectClose(new Euler().setFromQuaternion(q, order), new THREE.Euler().setFromQuaternion(tq, order));
        expectClose(new Euler(x, y, z, order).reorder('ZXY'), new THREE.Euler(x, y, z, order).reorder('ZXY'));
      }
    });
  }

  it('slerp, rotateTowards, multiply and invert', () => {
    const a = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.4);
    const b = new Quaternion().setFromAxisAngle(new Vector3(1, 1, 0).normalize(), 2.1);
    const ta = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4);
    const tb = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 1, 0).normalize(), 2.1);

    expectClose(a.clone().slerp(b, 0.3), ta.clone().slerp(tb, 0.3), 6);
    expectClose(a.clone().rotateTowards(b, 0.5), ta.clone().rotateTowards(tb, 0.5), 6);
    expectClose(new Quaternion().multiplyQuaternions(a, b), new THREE.Quaternion().multiplyQuaternions(ta, tb), 6);
    expectClose(a.clone().premultiply(b).invert(), ta.clone().premultiply(tb).invert(), 6);
  });
});

describe('matrices match three', () => {
  it('compose, decompose, invert, multiply and lookAt', () => {
    const position = [1, -2, 3] as const;
    const angles = [0.4, 1.1, -0.3] as const;
    const scale = [2, 0.5, 1.5] as const;
    const m = new Matrix4().compose(
      new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...angles, 'YXZ')),
      new Vector3(...scale),
    );
    const tm = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles, 'YXZ')),
      new THREE.Vector3(...scale),
    );
    expectClose(m.elements, tm.elements);

    const [p, q, s] = [new Vector3(), new Quaternion(), new Vector3()];
    const [tp, tq, ts] = [new THREE.Vector3(), new THREE.Quaternion(), new THREE.Vector3()];
    m.decompose(p, q, s);
    tm.decompose(tp, tq, ts);
    expectClose(p, tp);
    expectClose(q, tq);
    expectClose(s, ts);

    expectClose(m.clone().invert().elements, tm.clone().invert().elements, 4);
    const rotation = new Matrix4().makeRotationAxis(new Vector3(0, 0, 1), 0.7);
    const threeRotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), 0.7);
    expectClose(m.clone().multiply(rotation).elements, tm.clone().multiply(threeRotation).elements);
    expectClose(m.clone().premultiply(rotation).elements, tm.clone().premultiply(threeRotation).elements);
    expectClose(
      new Matrix4().lookAt(new Vector3(1, 2, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0)).elements,
      new THREE.Matrix4().lookAt(new THREE.Vector3(1, 2, 3), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0))
        .elements,
    );
    expectClose(new Matrix4().setPosition(4, 5, 6).elements, new THREE.Matrix4().setPosition(4, 5, 6).elements);
    expectClose(m.toArray([], 0), tm.toArray([], 0));
  });
});

describe('vectors match three', () => {
  it('rotate, project onto planes, reflect, clamp and convert', () => {
    const v = (): Vector3 => new Vector3(1, -2, 0.5);
    const tv = (): THREE.Vector3 => new THREE.Vector3(1, -2, 0.5);
    const normal = new Vector3(0, 1, 1).normalize();
    const threeNormal = new THREE.Vector3(0, 1, 1).normalize();

    expectClose(
      v().applyEuler(new Euler(0.3, 0.6, 0.9, 'ZYX')),
      tv().applyEuler(new THREE.Euler(0.3, 0.6, 0.9, 'ZYX')),
    );
    expectClose(v().applyAxisAngle(normal, 1.2), tv().applyAxisAngle(threeNormal, 1.2));
    expectClose(v().projectOnPlane(normal), tv().projectOnPlane(threeNormal));
    expectClose(v().projectOnVector(normal), tv().projectOnVector(threeNormal));
    expectClose(v().reflect(normal), tv().reflect(threeNormal));
    expectClose(v().clampLength(0.5, 1), tv().clampLength(0.5, 1));
    expectClose(v().crossVectors(v(), normal), tv().crossVectors(tv(), threeNormal));
    expectClose(v().setFromSphericalCoords(2, 0.4, 1.3), tv().setFromSphericalCoords(2, 0.4, 1.3));
    expectClose(v().lerpVectors(v(), normal, 0.3), tv().lerpVectors(tv(), threeNormal, 0.3));
    expect(v().angleTo(normal)).toBeCloseTo(tv().angleTo(threeNormal), 6);
    expect(v().manhattanLength()).toBe(tv().manhattanLength());
    expectClose([...v()], [...tv()]);
  });
});

describe("colours match three's colour management", () => {
  const styles = ['hotpink', '#f80', '#1d2433', 'rgb(255, 128, 0)', 'rgb(100%, 50%, 0%)', 'hsl(200, 70%, 60%)'];

  for (const style of styles) {
    it(`reads ${style} as three does`, () => {
      const color = new Color(style);
      const threeColor = new THREE.Color(style);
      expectClose([color.r, color.g, color.b], [threeColor.r, threeColor.g, threeColor.b], 6);
      expect(color.getHex()).toBe(threeColor.getHex());
      expect(color.getHexString()).toBe(threeColor.getHexString());
      expect(color.getStyle()).toBe(threeColor.getStyle());
    });
  }

  it('sets, blends and converts as three does', () => {
    const pairs: [Color, THREE.Color][] = [
      [new Color().setHSL(0.83, 0.6, 0.55), new THREE.Color().setHSL(0.83, 0.6, 0.55)],
      [new Color(0x336699).offsetHSL(0.1, -0.2, 0.1), new THREE.Color(0x336699).offsetHSL(0.1, -0.2, 0.1)],
      [
        new Color('royalblue').lerp(new Color('orange'), 0.3),
        new THREE.Color('royalblue').lerp(new THREE.Color('orange'), 0.3),
      ],
      [
        new Color('royalblue').lerpHSL(new Color('orange'), 0.3),
        new THREE.Color('royalblue').lerpHSL(new THREE.Color('orange'), 0.3),
      ],
      [new Color().setRGB(0.9, 0.3, 0.3, 'srgb'), new THREE.Color().setRGB(0.9, 0.3, 0.3, 'srgb')],
      [new Color(0.9, 0.3, 0.3).convertLinearToSRGB(), new THREE.Color(0.9, 0.3, 0.3).convertLinearToSRGB()],
      [new Color('teal').multiplyScalar(1.5), new THREE.Color('teal').multiplyScalar(1.5)],
    ];

    for (const [color, threeColor] of pairs) expectClose(color, threeColor, 6);
    const hsl = { h: 0, s: 0, l: 0 };
    const threeHsl = { h: 0, s: 0, l: 0 };
    new Color('coral').getHSL(hsl);
    new THREE.Color('coral').getHSL(threeHsl);
    expectClose(Object.values(hsl), Object.values(threeHsl), 6);
  });

  it('takes values as written while colour management is off', () => {
    ColorManagement.enabled = false;
    THREE.ColorManagement.enabled = false;
    try {
      expectClose(new Color('#808080'), new THREE.Color('#808080'), 6);
      expect(new Color('#808080').r).toBeCloseTo(128 / 255, 6);
    } finally {
      ColorManagement.enabled = true;
      THREE.ColorManagement.enabled = true;
    }
  });
});

describe('shapes and MathUtils match three', () => {
  it('boxes, spheres, rays and planes', () => {
    const points = [new Vector3(-1, 0, 2), new Vector3(3, -2, 1), new Vector3(0, 4, -1)];
    const threePoints = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    const box = new Box3().setFromPoints(points);
    const threeBox = new THREE.Box3().setFromPoints(threePoints);
    expectClose([...box.min, ...box.max], [...threeBox.min, ...threeBox.max]);
    const sphere = box.getBoundingSphere(new Sphere());
    const threeSphere = threeBox.getBoundingSphere(new THREE.Sphere());
    expectClose([...sphere.center, sphere.radius], [...threeSphere.center, threeSphere.radius]);
    const fitted = new Sphere().setFromPoints(points);
    const threeFitted = new THREE.Sphere().setFromPoints(threePoints);
    expectClose([...fitted.center, fitted.radius], [...threeFitted.center, threeFitted.radius]);
    fitted.union(new Sphere(new Vector3(6, 0, 0), 1));
    threeFitted.union(new THREE.Sphere(new THREE.Vector3(6, 0, 0), 1));
    expectClose([...fitted.center, fitted.radius], [...threeFitted.center, threeFitted.radius]);

    const ray = new Ray(new Vector3(0.2, 0.3, 5)).lookAt(new Vector3(0.2, 0.3, 0));
    const threeRay = new THREE.Ray(new THREE.Vector3(0.2, 0.3, 5)).lookAt(new THREE.Vector3(0.2, 0.3, 0));
    const triangle = [new Vector3(-1, -1, 0), new Vector3(1, -1, 0), new Vector3(0, 1, 0)] as const;
    const threeTriangle = triangle.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    expectClose(
      ray.intersectTriangle(...triangle, false, new Vector3())!,
      threeRay.intersectTriangle(threeTriangle[0], threeTriangle[1], threeTriangle[2], false, new THREE.Vector3())!,
    );

    const plane = new Plane().setFromCoplanarPoints(...triangle);
    const threePlane = new THREE.Plane().setFromCoplanarPoints(threeTriangle[0], threeTriangle[1], threeTriangle[2]);
    expectClose([...plane.normal, plane.constant], [...threePlane.normal, threePlane.constant]);
    const transform = new Matrix4().makeRotationX(0.6).setPosition(1, 2, 3);
    plane.applyMatrix4(transform);
    threePlane.applyMatrix4(new THREE.Matrix4().makeRotationX(0.6).setPosition(1, 2, 3));
    expectClose([...plane.normal, plane.constant], [...threePlane.normal, threePlane.constant]);
    expect(ray.distanceToPlane(plane)).toBeCloseTo(threeRay.distanceToPlane(threePlane)!, 5);
  });

  it('MathUtils', () => {
    expect(MathUtils.damp(1, 5, 4, 0.1)).toBe(THREE.MathUtils.damp(1, 5, 4, 0.1));
    expect(MathUtils.smoothstep(0.3, 0, 1)).toBe(THREE.MathUtils.smoothstep(0.3, 0, 1));
    expect(MathUtils.smootherstep(0.3, 0, 1)).toBe(THREE.MathUtils.smootherstep(0.3, 0, 1));
    expect(MathUtils.mapLinear(3, 0, 10, -1, 1)).toBe(THREE.MathUtils.mapLinear(3, 0, 10, -1, 1));
    expect(MathUtils.pingpong(3.4, 2)).toBe(THREE.MathUtils.pingpong(3.4, 2));
    expect(MathUtils.euclideanModulo(-3, 5)).toBe(THREE.MathUtils.euclideanModulo(-3, 5));
    expect(MathUtils.ceilPowerOfTwo(300)).toBe(THREE.MathUtils.ceilPowerOfTwo(300));
    const seeded = [MathUtils.seededRandom(42), MathUtils.seededRandom(), MathUtils.seededRandom()];
    const threeSeeded = [
      THREE.MathUtils.seededRandom(42),
      THREE.MathUtils.seededRandom(),
      THREE.MathUtils.seededRandom(),
    ];
    expect(seeded).toEqual(threeSeeded);
    expect(MathUtils.generateUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("a node's three surface matches three's Object3D", () => {
  beforeAll(() => installObject3DSurface());

  it('keeps rotation and quaternion in step and lands where three does', () => {
    const parent = new Object3D();
    const node = new Object3D();
    const threeParent = new THREE.Object3D();
    const threeNode = new THREE.Object3D();
    parent.addChild(node);
    threeParent.add(threeNode);

    for (const [object, scene] of [
      [parent, node],
      [threeParent, threeNode],
    ] as const) {
      object.position.set(1, 2, -1);
      object.rotation.set(0.3, -0.4, 0.2, 'ZYX');
      object.scale.set(1.5, 1.5, 1.5);
      scene.position.set(0.5, 0, 1);
      scene.rotation.order = 'YXZ';
      scene.rotation.y = 0.7;
      scene.rotateOnAxis({ x: 1, y: 0, z: 0 } as THREE.Vector3 & Vector3, 0.25);
      scene.translateZ(0.8);
      scene.rotation.x += 0.1;
    }
    expectClose(node.rotation, threeNode.rotation);
    expectClose(node.quaternion, threeNode.quaternion);
    threeParent.updateMatrixWorld();
    expectClose(node.matrixWorld.elements, threeNode.matrixWorld.elements);

    node.up.set(0, 0, 1);
    threeNode.up.set(0, 0, 1);
    node.lookAt(4, -2, 3);
    threeNode.lookAt(4, -2, 3);
    expectClose(node.quaternion, threeNode.quaternion);
    expectClose(node.rotation, threeNode.rotation);
    expectClose(node.getWorldDirection(new Vector3()), threeNode.getWorldDirection(new THREE.Vector3()));
    expectClose(node.localToWorld(new Vector3(1, 1, 1)), threeNode.localToWorld(new THREE.Vector3(1, 1, 1)));
    expectClose(node.worldToLocal(new Vector3(1, 1, 1)), threeNode.worldToLocal(new THREE.Vector3(1, 1, 1)), 4);
  });

  it('finds, attaches and names nodes as three does', () => {
    const root = new Object3D();
    const a = new Object3D();
    const b = new Object3D();
    root.addChild(a);
    a.addChild(b);
    b.name = 'leaf';
    a.position.set(2, 0, 0);
    a.rotation.y = Math.PI / 2;

    expect(root.getObjectByName('leaf')).toBe(b);
    expect(root.getObjectById(b.id)).toBe(b);
    expect(root.getObjectsByProperty('name', 'leaf')).toEqual([b]);
    expect(b.type).toBe('Object3D');
    expect(b.isObject3D).toBe(true);
    expect(b.position.isVector3).toBe(true);

    const before = b.getWorldPosition(new Vector3());
    root.attach(b);
    expect(b.parent).toBe(root);
    expectClose(b.getWorldPosition(new Vector3()), before);

    a.clear();
    expect(a.children).toHaveLength(0);
  });
});
