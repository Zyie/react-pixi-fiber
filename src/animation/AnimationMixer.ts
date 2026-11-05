import type { Container3D } from '@pixi/3d';

import { AnimationAction } from './AnimationAction';
import { AnimationClip } from './AnimationClip';
import { EventDispatcher } from './EventDispatcher';
import { PropertyBinding } from './PropertyBinding';
import { PropertyMixer } from './PropertyMixer';

/**
 * three's `AnimationMixer`: plays clips on a root and its descendants, found by name
 *
 * Advance it yourself, from `useFrame`: `mixer.update(delta)`. It is three's mixer on pixi-3d nodes,
 * sampling the tracks with pixi-3d's keyframe code: actions blend by weight, fade, warp and loop as in
 * three, it fires `'loop'` and `'finished'` events, and a property no playing action drives goes back
 * to its value from before. A glTF model's bones are nodes, so a clip moves a skinned mesh's bones as
 * in three.
 * @example
 * ```tsx
 * const { scene, animations } = useLoader(GLTFLoader, '/robot.glb');
 * const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
 *
 * useEffect(() => void mixer.clipAction(animations[0]).play(), [mixer, animations]);
 * useFrame((_, delta) => mixer.update(delta));
 *
 * return <primitive object={scene} />;
 * ```
 * @category catalog
 * @standard
 */
export class AnimationMixer extends EventDispatcher {
  /** The mixer's clock, in seconds */
  public time: number = 0;
  /** Scales every `update`'s delta */
  public timeScale: number = 1;

  private readonly _root: Container3D;
  private readonly _actions = new Map<string, AnimationAction>();
  private readonly _activeActions: AnimationAction[] = [];
  private readonly _bindings = new Map<Container3D, Map<string, PropertyMixer>>();
  private readonly _activeBindings: PropertyMixer[] = [];

  /** @param root - The node whose descendants the clips' tracks name */
  constructor(root: Container3D) {
    super();
    this._root = root;
  }

  /**
   * The action that plays a clip on a root, made the first time and reused after
   * @param clip - The clip, or its name among the root's `animations`
   * @param optionalRoot - The root to play it on; the mixer's when omitted
   * @param blendMode - How it blends; the clip's when omitted
   * @returns The action, or `null` when no clip has that name
   */
  public clipAction(
    clip: AnimationClip | string,
    optionalRoot?: Container3D | null,
    blendMode?: number,
  ): AnimationAction | null {
    const root = optionalRoot ?? this._root;
    const clipObject =
      typeof clip === 'string'
        ? AnimationClip.findByName((root as Container3D & { animations?: AnimationClip[] }).animations ?? [], clip)
        : clip;

    if (!clipObject) return null;

    const key = `${clipObject.uuid}:${root.uuid}`;
    const existing = this._actions.get(key);

    if (existing && (blendMode === undefined || existing.blendMode === blendMode)) return existing;

    const action = new AnimationAction(this, clipObject, optionalRoot ?? null, blendMode);

    this._bindAction(action, root);
    this._actions.set(key, action);

    return action;
  }

  /**
   * The action `clipAction` made for a clip and root, or `null`
   * @param clip - The clip, or its name
   * @param optionalRoot - The root; the mixer's when omitted
   */
  public existingAction(clip: AnimationClip | string, optionalRoot?: Container3D | null): AnimationAction | null {
    const root = optionalRoot ?? this._root;

    for (const action of this._actions.values()) {
      const actionClip = action.getClip();

      if (action.getRoot() === root && (actionClip === clip || actionClip.name === clip)) return action;
    }

    return null;
  }

  /**
   * Stops every playing action
   * @returns This mixer
   */
  public stopAllAction(): this {
    for (const action of this._activeActions.slice()) action.stop();
    return this;
  }

  /**
   * Advances every playing action and writes the blended poses
   * @param deltaTime - Seconds since the last update
   * @returns This mixer
   */
  public update(deltaTime: number): this {
    deltaTime *= this.timeScale;

    const time = (this.time += deltaTime);
    const direction = Math.sign(deltaTime);
    const actions = this._activeActions;

    for (let i = 0; i < actions.length; i++) actions[i]._update(time, deltaTime, direction);

    const bindings = this._activeBindings;

    for (let i = 0; i < bindings.length; i++) bindings[i].apply();

    return this;
  }

  /**
   * Sets the mixer's time, putting every action back to its start first and then advancing to it
   * @param time - Seconds
   * @returns This mixer
   */
  public setTime(time: number): this {
    this.time = 0;
    for (const action of this._actions.values()) action.time = 0;

    return this.update(time);
  }

  /** The root the clips play on */
  public getRoot(): Container3D {
    return this._root;
  }

  /**
   * Forgets a clip's actions, stopping them
   * @param clip - The clip
   */
  public uncacheClip(clip: AnimationClip): void {
    for (const [key, action] of this._actions) {
      if (action.getClip() === clip) this._forget(key, action);
    }
  }

  /**
   * Forgets every action on a root, stopping them, and the root's bindings
   * @param root - The root
   */
  public uncacheRoot(root: Container3D): void {
    for (const [key, action] of this._actions) {
      if (action.getRoot() === root) this._forget(key, action);
    }
    this._bindings.delete(root);
  }

  /**
   * Forgets one clip's action on a root, stopping it
   * @param clip - The clip
   * @param optionalRoot - The root; the mixer's when omitted
   */
  public uncacheAction(clip: AnimationClip | string, optionalRoot?: Container3D | null): void {
    const action = this.existingAction(clip, optionalRoot);

    if (!action) return;
    for (const [key, cached] of this._actions) {
      if (cached === action) this._forget(key, action);
    }
  }

  /**
   * Whether an action is scheduled to play
   * @param action - The action
   * @internal
   */
  public _isActiveAction(action: AnimationAction): boolean {
    return this._activeActions.includes(action);
  }

  /**
   * Schedules an action and takes hold of its properties, remembering their values
   * @param action - The action
   * @internal
   */
  public _activateAction(action: AnimationAction): void {
    if (this._isActiveAction(action)) return;

    for (const binding of action._propertyBindings) {
      if (binding.useCount++ === 0) {
        binding.saveOriginalState();
        this._activeBindings.push(binding);
      }
    }
    this._activeActions.push(action);
  }

  /**
   * Unschedules an action and puts back the values of the properties no other action drives
   * @param action - The action
   * @internal
   */
  public _deactivateAction(action: AnimationAction): void {
    const index = this._activeActions.indexOf(action);

    if (index === -1) return;
    this._activeActions.splice(index, 1);

    for (const binding of action._propertyBindings) {
      if (--binding.useCount === 0) {
        binding.restoreOriginalState();
        this._activeBindings.splice(this._activeBindings.indexOf(binding), 1);
      }
    }
  }

  private _bindAction(action: AnimationAction, root: Container3D): void {
    let byName = this._bindings.get(root);

    if (!byName) this._bindings.set(root, (byName = new Map()));

    action._propertyBindings = action.getClip().tracks.map((track) => {
      let mixer = byName.get(track.name);

      if (!mixer) {
        mixer = new PropertyMixer(new PropertyBinding(root, track.name), track.ValueTypeName, track.getValueSize());
        byName.set(track.name, mixer);
      }
      mixer.referenceCount++;

      return mixer;
    });
  }

  private _forget(key: string, action: AnimationAction): void {
    action.stop();
    this._actions.delete(key);

    const byName = this._bindings.get(action.getRoot());

    for (const mixer of action._propertyBindings) {
      if (--mixer.referenceCount === 0) byName?.delete(mixer.binding.path);
    }
  }
}
