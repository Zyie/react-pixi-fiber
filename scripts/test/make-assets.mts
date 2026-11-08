/**
 * Writes the models and textures the asset scenes load into `tests/assets`, from code, so every file
 * there is the repo's own work under its licence and nothing is fetched at test time.
 *
 *   node scripts/test/make-assets.mts
 *
 * Models (`tests/assets/models`), each a GLB with one scene:
 * - `box.glb`: a red box named `Box` on a blue slab named `Base`, materials `Red` and `Blue`, and a
 *   perspective camera named `Camera`.
 * - `textured-box.glb`: a box named `Crate` whose material `Crate` shows `textures/quadrants.png`.
 * - `animated.glb`: three boxes, `Spinner`, `Bouncer` and `Pulser`, with clips `Spin` (Spinner's
 *   rotation), `Bounce` (Bouncer's translation, Pulser's stepped scale) and `Sway` (Spinner's
 *   translation).
 * - `skinned.glb`: a column named `Column` skinned to the bones `Root`, `Middle` and `Top` under an
 *   `Armature` node, with the clip `Bend`.
 * - `morph.glb`: a box named `Blob` with the morph targets `Tall` and `Wide` and the clip `Morph`.
 * - `extensions.glb`: a grey slab named `Floor` lit by a `KHR_lights_punctual` spot light named
 *   `Spot`, under which stand a red box named `Coated` whose material has `KHR_materials_clearcoat`
 *   factors, and a dark blue box named `Velvet` whose material has `KHR_materials_sheen` factors.
 *
 * Textures (`tests/assets/textures`):
 * - `checker.png`: 64 by 64, eight by eight cells, with a red cell at its top left so its turn and
 *   flip show.
 * - `cube/px.png` to `cube/nz.png`: 32 by 32 faces of a cube map, one colour each, with a white
 *   square at the top left of each.
 *
 * 2D assets, which pixi's `Assets` loads:
 * - `sprites/walk.png` and `sprites/walk.json`: a spritesheet of four 32 by 32 frames, `walk-0` to
 *   `walk-3`, a teal square with a white bar that steps down a quarter of it each frame, and the
 *   animation `walk` of all four.
 * - `fonts/blocks.png` and `fonts/blocks.fnt`: a bitmap font named `Blocks`, 28 pixels high, with the
 *   glyphs `P`, `I`, `X`, `2`, `D` and a space drawn as 5 by 7 blocks of 4 pixels.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { PNG } from 'pngjs';

const ROOT = path.resolve(import.meta.dirname, '../../tests/assets');

type Vec3 = [number, number, number];

/** One mesh's vertex data, in glTF's conventions */
interface Primitive {
  positions: number[];
  normals: number[];
  uvs?: number[];
  indices: number[];
  joints?: number[];
  weights?: number[];
  targets?: { POSITION: number[] }[];
}

/** Builds a GLB: its JSON and one binary buffer, the accessors added as data is appended */
class GlbBuilder {
  public readonly json: Record<string, unknown[]> & { asset: unknown; scene?: number } = {
    asset: { version: '2.0', generator: 'react-pixi-fiber make-assets' },
    accessors: [],
    bufferViews: [],
    buffers: [],
    meshes: [],
    materials: [],
    nodes: [],
    scenes: [],
  } as never;
  private readonly _chunks: Buffer[] = [];
  private _length = 0;

  public view(bytes: Buffer, target?: number): number {
    const padding = (4 - (this._length % 4)) % 4;

    if (padding) this._append(Buffer.alloc(padding));

    const index = this.json.bufferViews.push({
      buffer: 0,
      byteOffset: this._length,
      byteLength: bytes.byteLength,
      ...(target ? { target } : {}),
    });

    this._append(bytes);

    return index - 1;
  }

  public accessor(
    data: number[],
    type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT4',
    componentType: 5126 | 5123 | 5121 = 5126,
    target?: number,
    bounds = false,
  ): number {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const array =
      componentType === 5126
        ? new Float32Array(data)
        : componentType === 5123
          ? new Uint16Array(data)
          : new Uint8Array(data);
    const view = this.view(Buffer.from(array.buffer), target);
    const accessor: Record<string, unknown> = { bufferView: view, componentType, count: data.length / size, type };

    if (bounds) {
      const min = Array.from({ length: size }, (_, c) => Math.min(...data.filter((_, i) => i % size === c)));
      const max = Array.from({ length: size }, (_, c) => Math.max(...data.filter((_, i) => i % size === c)));

      Object.assign(accessor, { min, max });
    }

    return this.json.accessors.push(accessor) - 1;
  }

  public mesh(name: string, primitive: Primitive, material: number, extras?: unknown): number {
    const attributes: Record<string, number> = {
      POSITION: this.accessor(primitive.positions, 'VEC3', 5126, 34962, true),
      NORMAL: this.accessor(primitive.normals, 'VEC3', 5126, 34962),
    };

    if (primitive.uvs) attributes.TEXCOORD_0 = this.accessor(primitive.uvs, 'VEC2', 5126, 34962);
    if (primitive.joints) attributes.JOINTS_0 = this.accessor(primitive.joints, 'VEC4', 5121, 34962);
    if (primitive.weights) attributes.WEIGHTS_0 = this.accessor(primitive.weights, 'VEC4', 5126, 34962);

    const targets = primitive.targets?.map((target) => ({
      POSITION: this.accessor(target.POSITION, 'VEC3', 5126, 34962, true),
    }));

    return (
      this.json.meshes.push({
        name,
        primitives: [
          {
            attributes,
            indices: this.accessor(primitive.indices, 'SCALAR', 5123, 34963),
            material,
            ...(targets ? { targets } : {}),
          },
        ],
        ...(extras ? { extras } : {}),
      }) - 1
    );
  }

  public material(name: string, color: [number, number, number, number], extra: Record<string, unknown> = {}): number {
    return (
      this.json.materials.push({
        name,
        pbrMetallicRoughness: { baseColorFactor: color, metallicFactor: 0, roughnessFactor: 1, ...extra },
      }) - 1
    );
  }

  public node(node: Record<string, unknown>): number {
    return this.json.nodes.push(node) - 1;
  }

  public animation(
    name: string,
    channels: { node: number; path: string; times: number[]; values: number[]; interpolation?: string }[],
  ): void {
    const samplers: unknown[] = [];
    const out: unknown[] = [];

    for (const channel of channels) {
      const size = channel.path === 'rotation' ? 'VEC4' : channel.path === 'weights' ? 'SCALAR' : 'VEC3';
      const input = this.accessor(channel.times, 'SCALAR', 5126, undefined, true);
      const output = this.accessor(channel.values, size);
      const sampler = samplers.push({ input, output, interpolation: channel.interpolation ?? 'LINEAR' }) - 1;

      out.push({ sampler, target: { node: channel.node, path: channel.path } });
    }

    (this.json.animations ??= []).push({ name, samplers, channels: out });
  }

  public write(file: string): void {
    const bin = Buffer.concat(this._chunks);
    const binPadded = Buffer.concat([bin, Buffer.alloc((4 - (bin.byteLength % 4)) % 4)]);

    this.json.buffers = [{ byteLength: binPadded.byteLength }];

    const text = Buffer.from(JSON.stringify(this.json));
    const jsonPadded = Buffer.concat([text, Buffer.alloc((4 - (text.byteLength % 4)) % 4, 0x20)]);
    const header = Buffer.alloc(12);
    const jsonHeader = Buffer.alloc(8);
    const binHeader = Buffer.alloc(8);

    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(12 + 8 + jsonPadded.byteLength + 8 + binPadded.byteLength, 8);
    jsonHeader.writeUInt32LE(jsonPadded.byteLength, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);
    binHeader.writeUInt32LE(binPadded.byteLength, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);

    writeFileSync(file, Buffer.concat([header, jsonHeader, jsonPadded, binHeader, binPadded]));
  }

  private _append(bytes: Buffer): void {
    this._chunks.push(bytes);
    this._length += bytes.byteLength;
  }
}

/** A box centred on the origin: four vertices a face, with normals and UVs (top left of each face at 0, 0) */
function box([w, h, d]: Vec3): Primitive {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const faces: { n: Vec3; u: Vec3; v: Vec3 }[] = [
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, -1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, -1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, -1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, -1, 0] },
  ];
  const half = [w / 2, h / 2, d / 2];

  for (const { n, u, v } of faces) {
    const start = positions.length / 3;

    for (const [su, sv] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      for (let axis = 0; axis < 3; axis++) {
        positions.push((n[axis] + u[axis] * su + v[axis] * sv) * half[axis]);
      }
      normals.push(...n);
      uvs.push((su + 1) / 2, (sv + 1) / 2);
    }
    indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
  }

  return { positions, normals, uvs, indices };
}

/** A square column standing on the origin, `rings` rings of four sides, skinned to three bones */
function column(height: number, rings: number, bones: number[]): Primitive {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const joints: number[] = [];
  const weights: number[] = [];
  const r = 0.25;
  const sides: { n: Vec3; a: [number, number]; b: [number, number] }[] = [
    { n: [0, 0, 1], a: [-r, r], b: [r, r] },
    { n: [1, 0, 0], a: [r, r], b: [r, -r] },
    { n: [0, 0, -1], a: [r, -r], b: [-r, -r] },
    { n: [-1, 0, 0], a: [-r, -r], b: [-r, r] },
  ];
  const skin = (y: number): void => {
    const segment = Math.min(Math.floor(y / bones[1]), bones.length - 1);
    const t = segment < bones.length - 1 ? (y - bones[segment]) / (bones[segment + 1] - bones[segment]) : 0;

    joints.push(segment, Math.min(segment + 1, bones.length - 1), 0, 0);
    weights.push(1 - t, t, 0, 0);
  };

  for (const side of sides) {
    const start = positions.length / 3;

    for (let ring = 0; ring < rings; ring++) {
      const y = (height * ring) / (rings - 1);

      positions.push(side.a[0], y, side.a[1], side.b[0], y, side.b[1]);
      normals.push(...side.n, ...side.n);
      skin(y);
      skin(y);
      if (ring > 0) {
        const i = start + ring * 2;

        indices.push(i - 2, i - 1, i + 1, i - 2, i + 1, i);
      }
    }
  }

  for (const [y, ny] of [
    [0, -1],
    [height, 1],
  ]) {
    const start = positions.length / 3;
    const corners = [
      [-r, -r],
      [r, -r],
      [r, r],
      [-r, r],
    ];

    for (const [x, z] of corners) {
      positions.push(x, y, z);
      normals.push(0, ny, 0);
      skin(y);
    }
    indices.push(
      ...(ny > 0
        ? [start, start + 2, start + 1, start, start + 3, start + 2]
        : [start, start + 1, start + 2, start, start + 2, start + 3]),
    );
  }

  return { positions, normals, indices, joints, weights };
}

const quat = (axis: Vec3, angle: number): number[] => [
  axis[0] * Math.sin(angle / 2),
  axis[1] * Math.sin(angle / 2),
  axis[2] * Math.sin(angle / 2),
  Math.cos(angle / 2),
];

function writeBox(file: string): void {
  const gltf = new GlbBuilder();
  const red = gltf.material('Red', [0.8, 0.05, 0.05, 1]);
  const blue = gltf.material('Blue', [0.05, 0.2, 0.8, 1]);
  const boxMesh = gltf.mesh('BoxMesh', box([1, 1, 1]), red);
  const baseMesh = gltf.mesh('BaseMesh', box([2.5, 0.2, 2.5]), blue);

  gltf.json.cameras = [{ name: 'Camera', type: 'perspective', perspective: { yfov: 0.8, znear: 0.1, zfar: 100 } }];
  const boxNode = gltf.node({ name: 'Box', mesh: boxMesh, translation: [0, 0.6, 0], rotation: quat([0, 1, 0], 0.5) });
  const baseNode = gltf.node({ name: 'Base', mesh: baseMesh, extras: { kind: 'slab' } });
  const camera = gltf.node({ name: 'Camera', camera: 0, translation: [0, 1, 5] });

  gltf.json.scenes.push({ name: 'Scene', nodes: [baseNode, boxNode, camera] });
  gltf.json.scene = 0;
  gltf.json.extras = { author: 'react-pixi-fiber' } as never;
  gltf.write(file);
}

function writeTexturedBox(file: string): void {
  const gltf = new GlbBuilder();
  const image = readFileSync(path.join(ROOT, 'textures/quadrants.png'));
  const view = gltf.view(image);

  gltf.json.images = [{ bufferView: view, mimeType: 'image/png', name: 'quadrants' }];
  gltf.json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
  gltf.json.textures = [{ source: 0, sampler: 0 }];
  const crate = gltf.material('Crate', [1, 1, 1, 1], { baseColorTexture: { index: 0 } });
  const mesh = gltf.mesh('Crate', box([1.6, 1.6, 1.6]), crate);
  const node = gltf.node({ name: 'Crate', mesh, rotation: quat([0.6, 0.8, 0], 0.7) });

  gltf.json.scenes.push({ name: 'Scene', nodes: [node] });
  gltf.json.scene = 0;
  gltf.write(file);
}

function writeAnimated(file: string): void {
  const gltf = new GlbBuilder();
  const orange = gltf.material('Orange', [0.9, 0.35, 0.05, 1]);
  const green = gltf.material('Green', [0.1, 0.7, 0.2, 1]);
  const purple = gltf.material('Purple', [0.45, 0.15, 0.75, 1]);
  const spinner = gltf.node({
    name: 'Spinner',
    mesh: gltf.mesh('SpinnerMesh', box([0.8, 1.4, 0.4]), orange),
    translation: [-1.4, 0, 0],
  });
  const bouncer = gltf.node({ name: 'Bouncer', mesh: gltf.mesh('BouncerMesh', box([0.7, 0.7, 0.7]), green) });
  const pulser = gltf.node({
    name: 'Pulser',
    mesh: gltf.mesh('PulserMesh', box([0.6, 0.6, 0.6]), purple),
    translation: [1.4, 0, 0],
  });

  gltf.json.scenes.push({ name: 'Scene', nodes: [spinner, bouncer, pulser] });
  gltf.json.scene = 0;
  gltf.animation('Spin', [
    {
      node: spinner,
      path: 'rotation',
      times: [0, 1, 2],
      values: [...quat([0, 1, 0], 0), ...quat([0, 1, 0], Math.PI), ...quat([0, 1, 0], 2 * Math.PI)],
    },
  ]);
  gltf.animation('Bounce', [
    { node: bouncer, path: 'translation', times: [0, 0.5, 1], values: [0, -0.8, 0, 0, 0.8, 0, 0, -0.8, 0] },
    { node: pulser, path: 'scale', times: [0, 0.5], values: [1, 1, 1, 1.6, 1.6, 1.6], interpolation: 'STEP' },
  ]);
  gltf.animation('Sway', [
    { node: spinner, path: 'translation', times: [0, 1, 2], values: [-1.4, 0, 0, -1.4, 0.8, 0, -1.4, 0, 0] },
  ]);
  gltf.write(file);
}

function writeSkinned(file: string): void {
  const gltf = new GlbBuilder();
  const bones = [0, 0.7, 1.4];
  const material = gltf.material('Skin', [0.85, 0.6, 0.45, 1]);
  const mesh = gltf.mesh('Column', column(2.1, 7, bones), material);
  const top = gltf.node({ name: 'Top', translation: [0, 0.7, 0] });
  const middle = gltf.node({ name: 'Middle', translation: [0, 0.7, 0], children: [top] });
  const root = gltf.node({ name: 'Root', children: [middle] });
  const armature = gltf.node({ name: 'Armature', translation: [0, -1, 0], children: [root] });
  const inverseBinds = bones.flatMap((y) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -y, 0, 1]);

  gltf.json.skins = [
    {
      name: 'Rig',
      joints: [root, middle, top],
      skeleton: root,
      inverseBindMatrices: gltf.accessor(inverseBinds, 'MAT4'),
    },
  ];
  const columnNode = gltf.node({ name: 'Column', mesh, skin: 0 });

  gltf.json.nodes[armature] = { ...(gltf.json.nodes[armature] as object), children: [root, columnNode] };
  gltf.json.scenes.push({ name: 'Scene', nodes: [armature] });
  gltf.json.scene = 0;
  gltf.animation('Bend', [
    {
      node: middle,
      path: 'rotation',
      times: [0, 1, 2],
      values: [...quat([0, 0, 1], 0), ...quat([0, 0, 1], 0.7), ...quat([0, 0, 1], 0)],
    },
    {
      node: top,
      path: 'rotation',
      times: [0, 1, 2],
      values: [...quat([0, 0, 1], 0), ...quat([0, 0, 1], 0.7), ...quat([0, 0, 1], 0)],
    },
  ]);
  gltf.write(file);
}

function writeMorph(file: string): void {
  const gltf = new GlbBuilder();
  const shape = box([1, 1, 1]);
  const tall = shape.positions.map((value, i) => (i % 3 === 1 && shape.positions[i] > 0 ? 0.8 : 0));
  const wide = shape.positions.map((value, i) => (i % 3 === 0 ? Math.sign(value) * 0.6 : 0));
  const material = gltf.material('Clay', [0.3, 0.6, 0.85, 1]);
  const mesh = gltf.mesh('Blob', { ...shape, targets: [{ POSITION: tall }, { POSITION: wide }] }, material, {
    targetNames: ['Tall', 'Wide'],
  });

  (gltf.json.meshes[mesh] as Record<string, unknown>).weights = [0, 0];
  const node = gltf.node({ name: 'Blob', mesh, rotation: quat([1, 0, 0], 0.35) });

  gltf.json.scenes.push({ name: 'Scene', nodes: [node] });
  gltf.json.scene = 0;
  gltf.animation('Morph', [{ node, path: 'weights', times: [0, 1, 2], values: [0, 0, 1, 0, 0, 1] }]);
  gltf.write(file);
}

function writeExtensions(file: string): void {
  const gltf = new GlbBuilder();
  const grey = gltf.material('Floor', [0.5, 0.5, 0.5, 1]);
  const coated = gltf.material('Coated', [0.7, 0.05, 0.05, 1], { roughnessFactor: 0.6 });
  const velvet = gltf.material('Velvet', [0.05, 0.05, 0.3, 1], { roughnessFactor: 0.8 });
  const materials = gltf.json.materials as Record<string, unknown>[];

  materials[coated]!.extensions = { KHR_materials_clearcoat: { clearcoatFactor: 1, clearcoatRoughnessFactor: 0.1 } };
  materials[velvet]!.extensions = {
    KHR_materials_sheen: { sheenColorFactor: [1, 0.6, 0.8], sheenRoughnessFactor: 0.4 },
  };
  gltf.json.extensionsUsed = ['KHR_lights_punctual', 'KHR_materials_clearcoat', 'KHR_materials_sheen'];
  gltf.json.extensions = {
    KHR_lights_punctual: {
      lights: [
        {
          name: 'Spot',
          type: 'spot',
          color: [1, 0.9, 0.75],
          intensity: 40,
          spot: { innerConeAngle: 0.3, outerConeAngle: 0.6 },
        },
      ],
    },
  } as never;

  const floor = gltf.node({
    name: 'Floor',
    mesh: gltf.mesh('Floor', box([5, 0.2, 5]), grey),
    translation: [0, -0.1, 0],
  });
  const coatedNode = gltf.node({
    name: 'Coated',
    mesh: gltf.mesh('Coated', box([1, 1, 1]), coated),
    translation: [-0.8, 0.5, 0],
    rotation: quat([0, 1, 0], 0.6),
  });
  const velvetNode = gltf.node({
    name: 'Velvet',
    mesh: gltf.mesh('Velvet', box([1, 1, 1]), velvet),
    translation: [0.8, 0.5, 0],
    rotation: quat([0, 1, 0], -0.4),
  });
  const spot = gltf.node({
    name: 'Spot',
    translation: [0, 3, 0.5],
    rotation: quat([1, 0, 0], -Math.PI / 2 + 0.15),
    extensions: { KHR_lights_punctual: { light: 0 } },
  });

  gltf.json.scenes.push({ name: 'Scene', nodes: [floor, coatedNode, velvetNode, spot] });
  gltf.json.scene = 0;
  gltf.write(file);
}

function writePng(file: string, size: number, pixel: (x: number, y: number) => [number, number, number]): void {
  const png = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const i = (y * size + x) * 4;

      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
  writeFileSync(file, PNG.sync.write(png));
}

function writeRgba(
  file: string,
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number, number],
): void {
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) png.data.set(pixel(x, y), (y * width + x) * 4);
  }
  writeFileSync(file, PNG.sync.write(png));
}

/** The spritesheet `sprites/walk.json`: four frames side by side and the `walk` animation */
function writeSpritesheet(dir: string): void {
  const size = 32;
  const frames = 4;

  writeRgba(path.join(dir, 'walk.png'), size * frames, size, (x, y) => {
    const frame = Math.floor(x / size);
    const bar = y >= frame * 8 && y < frame * 8 + 8 && x % size >= 4 && x % size < 28;

    return bar ? [255, 255, 255, 255] : [40, 170, 160, 255];
  });
  const names = Array.from({ length: frames }, (_, i) => `walk-${i}`);
  const sheet = {
    frames: Object.fromEntries(
      names.map((name, i) => [
        name,
        {
          frame: { x: i * size, y: 0, w: size, h: size },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: size, h: size },
          sourceSize: { w: size, h: size },
        },
      ]),
    ),
    animations: { walk: names },
    meta: { image: 'walk.png', format: 'RGBA8888', size: { w: size * frames, h: size }, scale: '1' },
  };

  writeFileSync(path.join(dir, 'walk.json'), `${JSON.stringify(sheet, null, 2)}\n`);
}

/** The bitmap font `fonts/blocks.fnt`: a few glyphs as 5 by 7 blocks, 4 pixels each */
function writeBitmapFont(dir: string): void {
  const glyphs: Record<string, string[]> = {
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  };
  const block = 4;
  const cell = { w: 5 * block, h: 7 * block };
  const chars = Object.keys(glyphs);

  writeRgba(path.join(dir, 'blocks.png'), cell.w * chars.length, cell.h, (x, y) => {
    const rows = glyphs[chars[Math.floor(x / cell.w)]];
    const on = rows[Math.floor(y / block)][Math.floor((x % cell.w) / block)] === '#';

    return on ? [255, 255, 255, 255] : [0, 0, 0, 0];
  });
  const lines = [
    `info face="Blocks" size=${cell.h} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=0 aa=1 padding=0,0,0,0 spacing=0,0`,
    `common lineHeight=${cell.h + 4} base=${cell.h} scaleW=${cell.w * chars.length} scaleH=${cell.h} pages=1 packed=0`,
    'page id=0 file="blocks.png"',
    `chars count=${chars.length}`,
    ...chars.map(
      (char, i) =>
        `char id=${char.charCodeAt(0)} x=${i * cell.w} y=0 width=${cell.w} height=${cell.h} xoffset=0 yoffset=0 xadvance=${cell.w + block} page=0 chnl=15`,
    ),
  ];

  writeFileSync(path.join(dir, 'blocks.fnt'), `${lines.join('\n')}\n`);
}

mkdirSync(path.join(ROOT, 'models'), { recursive: true });
mkdirSync(path.join(ROOT, 'textures/cube'), { recursive: true });

writePng(path.join(ROOT, 'textures/checker.png'), 64, (x, y) => {
  const cx = Math.floor(x / 8);
  const cy = Math.floor(y / 8);

  if (cx === 0 && cy === 0) return [220, 40, 40];

  return (cx + cy) % 2 ? [40, 50, 70] : [235, 235, 225];
});

const faces: Record<string, [number, number, number]> = {
  px: [220, 60, 60],
  nx: [60, 200, 200],
  py: [80, 200, 80],
  ny: [200, 80, 200],
  pz: [70, 90, 220],
  nz: [220, 200, 60],
};

for (const [name, colour] of Object.entries(faces)) {
  writePng(path.join(ROOT, `textures/cube/${name}.png`), 32, (x, y) => (x < 10 && y < 10 ? [255, 255, 255] : colour));
}

mkdirSync(path.join(ROOT, 'sprites'), { recursive: true });
mkdirSync(path.join(ROOT, 'fonts'), { recursive: true });
writeSpritesheet(path.join(ROOT, 'sprites'));
writeBitmapFont(path.join(ROOT, 'fonts'));

writeBox(path.join(ROOT, 'models/box.glb'));
writeTexturedBox(path.join(ROOT, 'models/textured-box.glb'));
writeAnimated(path.join(ROOT, 'models/animated.glb'));
writeSkinned(path.join(ROOT, 'models/skinned.glb'));
writeMorph(path.join(ROOT, 'models/morph.glb'));
writeExtensions(path.join(ROOT, 'models/extensions.glb'));
