import { useFrame } from '@react-fiber/threejs-compat';
import {
  AnimationClip,
  AnimationMixer,
  ColorKeyframeTrack,
  LoopOnce,
  LoopPingPong,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from '@react-fiber/threejs-compat/three';
import type { Group } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef, useState } from 'react';

const quarterTurnY = [0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)];
const eighthTurnZ = [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)];

const clips = {
  bob: new AnimationClip('bob', -1, [
    new VectorKeyframeTrack('Mover.position', [0, 1, 2], [-2, 1, 0, -2, 1.8, 0, -2, 1, 0]),
  ]),
  turn: new AnimationClip('turn', -1, [
    new QuaternionKeyframeTrack('Turner.quaternion', [0, 0.5], [0, 0, 0, 1, ...quarterTurnY]),
  ]),
  blush: new AnimationClip('blush', -1, [new ColorKeyframeTrack('Blusher.material.color', [0, 1], [1, 1, 1, 1, 0, 0])]),
  rise: new AnimationClip('rise', -1, [new VectorKeyframeTrack('Once.position', [0, 1], [-2, -1, 0, -2, -0.2, 0])]),
  grow: new AnimationClip('grow', -1, [new VectorKeyframeTrack('Slow.scale', [0, 1], [1, 1, 1, 1.6, 1.6, 1.6])]),
  tilt: new AnimationClip('tilt', -1, [
    new QuaternionKeyframeTrack('Fader.quaternion', [0, 1], [...eighthTurnZ, ...eighthTurnZ]),
  ]),
};

function Box({ name, position, color }: { name: string; position: [number, number, number]; color: string }) {
  return (
    <mesh name={name} position={position}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Animated() {
  const group = useRef<Group>(null!);
  const [mixer] = useState(() => new AnimationMixer(null!));

  useLayoutEffect(() => {
    const root = group.current;

    mixer.clipAction(clips.bob, root)!.play();
    mixer.clipAction(clips.turn, root)!.setLoop(LoopPingPong, Infinity).play();

    const blush = mixer.clipAction(clips.blush, root)!;

    blush.setLoop(LoopOnce, 1);
    blush.clampWhenFinished = true;
    blush.play();
    mixer.clipAction(clips.rise, root)!.setLoop(LoopOnce, 1).play();

    const grow = mixer.clipAction(clips.grow, root)!;

    grow.timeScale = 0.5;
    grow.play();
    mixer.clipAction(clips.tilt, root)!.fadeIn(2).play();

    return () => void mixer.stopAllAction();
  }, [mixer]);

  useFrame((_, delta) => void mixer.update(delta));

  return (
    <group ref={group}>
      <Box name="Mover" position={[-2, 1, 0]} color="#e07a2e" />
      <Box name="Turner" position={[0, 1, 0]} color="#3fa34d" />
      <Box name="Blusher" position={[2, 1, 0]} color="white" />
      <Box name="Once" position={[-2, -1, 0]} color="#3b6fd8" />
      <Box name="Slow" position={[0, -1, 0]} color="#9b4fd1" />
      <Box name="Fader" position={[2, -1, 0]} color="#d8c43b" />
    </group>
  );
}

/**
 * An `AnimationMixer` playing six clips built in code, 69 sixtieths of a second in. Top row: a
 * repeating bob (orange, near its top), a quarter turn ping-ponging (green, on its third pass,
 * forwards again), a colour fade to red played once and clamped (red). Bottom row: a rise played once
 * and not clamped, so back where it started (blue), a scale at half speed (purple, a third larger) and
 * an eighth turn fading in over two seconds, half blended with the box's rest pose (yellow).
 */
export const scene: TestScene = {
  frames: 70,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 5]} intensity={2} />
      <Animated />
    </>
  ),
};
