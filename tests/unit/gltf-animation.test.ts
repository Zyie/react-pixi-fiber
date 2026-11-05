import { GLTFLoader } from 'react-pixi-fiber/addons';
import type { GLTF } from 'react-pixi-fiber/addons';
import {
  AnimationClip,
  AnimationMixer,
  ColorKeyframeTrack,
  LoopOnce,
  LoopPingPong,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'react-pixi-fiber/three';
import type { AnimationAction, SkinnedMesh } from 'react-pixi-fiber/three';
import * as THREE from 'three';
import { GLTFLoader as ThreeGLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { beforeAll, describe, expect, it } from 'vitest';

import { installObject3DSurface } from '~/compat/installObject3DSurface';

// A glTF's shape and an animation's numbers have no picture to compare: each test runs the same file
// or the same clips through react-pixi-fiber and through three.js itself and expects the same result.

beforeAll(() => {
  installObject3DSurface();
});

interface NodeLike {
  type: string;
  name: string;
  children: NodeLike[];
}

const tree = (node: NodeLike): string[] => [
  `${node.type}:${node.name}`,
  ...node.children.flatMap((child) => tree(child).map((line) => `  ${line}`)),
];

async function loadBoth(name: string): Promise<{ ours: GLTF; theirs: THREE.Object3D & { gltf: unknown } }> {
  const buffer = await (await fetch(`/models/${name}.glb`)).arrayBuffer();
  const ours = await new GLTFLoader().parseAsync(buffer.slice(0), '/models/');
  const theirs = await new ThreeGLTFLoader().parseAsync(buffer.slice(0), '/models/');

  return { ours, theirs: Object.assign(theirs.scene, { gltf: theirs }) };
}

describe("GLTFLoader gives three's GLTF", () => {
  it.each(['box', 'textured-box', 'animated', 'skinned', 'morph'])(
    '%s: the same scene graph, names and clips',
    async (name) => {
      const { ours, theirs } = await loadBoth(name);
      const three = theirs.gltf as {
        animations: THREE.AnimationClip[];
        cameras: THREE.Camera[];
        asset: unknown;
        userData: unknown;
      };

      expect(tree(ours.scene as unknown as NodeLike)).toEqual(tree(theirs as unknown as NodeLike));
      expect(ours.animations.map((clip) => [clip.name, clip.duration, clip.tracks.map((track) => track.name)])).toEqual(
        three.animations.map((clip) => [clip.name, clip.duration, clip.tracks.map((track) => track.name)]),
      );
      expect(ours.cameras.length).toBe(three.cameras.length);
      expect(ours.asset).toEqual(three.asset);
      expect(ours.userData).toEqual(three.userData);
    },
  );

  it('names materials and keeps their colour, and gives skins their bones and morphs their targets', async () => {
    const box = await loadBoth('box');
    const skinned = await loadBoth('skinned');
    const morph = await loadBoth('morph');
    const material = (root: THREE.Object3D | Object3D, mesh: string) =>
      (
        root.getObjectByName(mesh) as unknown as {
          material: { name: string; color: { r: number; g: number; b: number } };
        }
      ).material;

    expect(material(box.ours.scene, 'Box').name).toBe('Red');
    expect(material(box.ours.scene, 'Box').color.r).toBeCloseTo(material(box.theirs, 'Box').color.r, 5);

    const ourColumn = skinned.ours.scene.getObjectByName('Column') as unknown as SkinnedMesh;
    const theirColumn = skinned.theirs.getObjectByName('Column') as THREE.SkinnedMesh;

    expect(ourColumn.isSkinnedMesh).toBe(true);
    expect((ourColumn.skeleton as unknown as { bones: Object3D[] }).bones.map((bone) => bone.name)).toEqual(
      theirColumn.skeleton.bones.map((bone) => bone.name),
    );

    const ourBlob = morph.ours.scene.getObjectByName('Blob') as unknown as Mesh;
    const theirBlob = morph.theirs.getObjectByName('Blob') as THREE.Mesh;

    expect(ourBlob.morphTargetDictionary).toEqual(theirBlob.morphTargetDictionary);
    expect(Array.from(ourBlob.morphTargetInfluences!)).toEqual(theirBlob.morphTargetInfluences);
  });
});

/** The same small graph on each side: a root with a box named `A` */
function graphs() {
  const ours = new Object3D();
  const ourBox = new Mesh(undefined, new MeshStandardMaterial());
  const theirs = new THREE.Object3D();
  const theirBox = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());

  ourBox.name = theirBox.name = 'A';
  ourBox.position.set(0.5, -0.25, 0);
  theirBox.position.set(0.5, -0.25, 0);
  ours.addChild(ourBox);
  theirs.add(theirBox);

  return { ours, ourBox, theirs, theirBox };
}

const turn = (angle: number): number[] => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];

const clipSpecs = {
  move: { name: '.position', times: [0, 1, 2], values: [0, 0, 0, 0, 2, 0, 1, 0, 0] },
  turn: { name: '.quaternion', times: [0, 0.7], values: [...turn(0), ...turn(2)] },
  tint: { name: '.material.color', times: [0, 1], values: [1, 1, 1, 1, 0, 0] },
  lift: { name: '.position', times: [0, 1.5], values: [0, 0, 0, 0, 0, 3] },
};

function clipsFor(side: 'ours' | 'theirs', spec: (typeof clipSpecs)[keyof typeof clipSpecs]) {
  const target = `A${spec.name}`;
  const Track =
    spec.name === '.quaternion'
      ? side === 'ours'
        ? QuaternionKeyframeTrack
        : THREE.QuaternionKeyframeTrack
      : spec.name === '.material.color'
        ? side === 'ours'
          ? ColorKeyframeTrack
          : THREE.ColorKeyframeTrack
        : side === 'ours'
          ? VectorKeyframeTrack
          : THREE.VectorKeyframeTrack;
  const Clip = side === 'ours' ? AnimationClip : THREE.AnimationClip;

  return new (Clip as typeof AnimationClip)(target, -1, [
    new (Track as typeof VectorKeyframeTrack)(target, spec.times, spec.values),
  ]);
}

type Setup = (actions: Record<keyof typeof clipSpecs, AnimationAction | THREE.AnimationAction>) => void;

/** Plays the clips set up on both sides through the steps, expecting the same pose and events after each */
function run(setup: Setup, steps: number[]): void {
  const { ours, ourBox, theirs, theirBox } = graphs();
  const ourMixer = new AnimationMixer(ours);
  const theirMixer = new THREE.AnimationMixer(theirs);
  const events: Record<string, string[]> = { ours: [], theirs: [] };
  const action = (side: 'ours' | 'theirs', key: keyof typeof clipSpecs) =>
    side === 'ours'
      ? ourMixer.clipAction(clipsFor('ours', clipSpecs[key]))!
      : theirMixer.clipAction(clipsFor('theirs', clipSpecs[key]) as unknown as THREE.AnimationClip);
  const keys = Object.keys(clipSpecs) as (keyof typeof clipSpecs)[];

  for (const side of ['ours', 'theirs'] as const) {
    const actions = Object.fromEntries(keys.map((key) => [key, action(side, key)])) as Parameters<Setup>[0];
    const mixer = side === 'ours' ? ourMixer : theirMixer;

    for (const type of ['loop', 'finished']) {
      (mixer as unknown as THREE.EventDispatcher<Record<string, object>>).addEventListener(type, () =>
        events[side].push(type),
      );
    }
    setup(actions);
  }

  for (const step of steps) {
    ourMixer.update(step);
    theirMixer.update(step);

    const ourColor = (ourBox.material as MeshStandardMaterial).color;
    const theirColor = (theirBox.material as THREE.MeshStandardMaterial).color;
    const sign = Math.sign(ourBox.quaternion.w * theirBox.quaternion.w || 1);

    expect(ourBox.position.x).toBeCloseTo(theirBox.position.x, 4);
    expect(ourBox.position.y).toBeCloseTo(theirBox.position.y, 4);
    expect(ourBox.position.z).toBeCloseTo(theirBox.position.z, 4);
    expect(ourBox.quaternion.y * sign).toBeCloseTo(theirBox.quaternion.y, 4);
    expect(ourBox.quaternion.w * sign).toBeCloseTo(theirBox.quaternion.w, 4);
    expect(ourColor.g).toBeCloseTo(theirColor.g, 4);
  }

  expect(events.ours).toEqual(events.theirs);
}

const STEPS = [0, 0.1, 0.25, 0.4, 0.55, 0.3, 0.9, 0.05, 1.3, 0.2];

// oxlint-disable vitest/expect-expect -- run() makes the assertions

describe("AnimationMixer plays as three's does", () => {
  it('repeats, ping-pongs, plays once with and without a clamp', () => {
    run((a) => {
      a.move.play();
      a.turn.setLoop(LoopPingPong, 3).play();
      a.tint.setLoop(LoopOnce, 1);
      a.tint.clampWhenFinished = true;
      a.tint.play();
    }, STEPS);
    run((a) => {
      a.lift.setLoop(LoopOnce, 1).play();
      a.turn.play();
    }, STEPS);
  });

  it('fades, cross-fades with a warp, and blends with the rest pose', () => {
    run((a) => {
      a.move.play();
      a.lift.play();
      a.move.crossFadeTo(a.lift as AnimationAction & THREE.AnimationAction, 0.8, true);
      a.turn.fadeIn(1.5).play();
      a.tint.play().fadeOut(0.6);
    }, STEPS);
    run((a) => {
      a.move.setEffectiveWeight(0.3).play();
      a.lift.setEffectiveWeight(0.4).play();
    }, STEPS);
  });

  it('runs backwards, starts late, halts, and changes speed', () => {
    run((a) => {
      a.move.timeScale = -1;
      a.move.play();
      a.turn.startAt(0.5).play();
      a.tint.play().halt(0.7);
      a.lift.setDuration(0.5).play();
    }, STEPS);
  });
});
