import type { Container3D } from '@pixi/3d';

const RESERVED = '\\[\\]\\.:\\/';
const reservedRe = new RegExp(`[${RESERVED}]`, 'g');
const wordChar = `[^${RESERVED}]`;
const wordCharOrDot = `[^${RESERVED.replace('\\.', '')}]`;
const trackRe = new RegExp(
  `^((?:${wordChar}+[\\/:])*)(${wordCharOrDot}+)?(?:\\.(${wordChar}+)(?:\\[(.+)\\])?)?\\.(${wordChar}+)(?:\\[(.+)\\])?$`,
);
const OBJECT_NAMES = ['material', 'materials', 'bones', 'map'];

/**
 * The parts of a track name, as three's `PropertyBinding.parseTrackName` splits
 * `'Armature/Hips.material.color[r]'`
 * @category catalog
 * @advanced
 */
export interface ParsedTrackName {
  /** The node's name, or nothing for the root */
  nodeName?: string;
  /** An object on the node: `material`, `materials`, `bones` or `map` */
  objectName?: string;
  /** Which of `objectName`'s entries, for `materials` and `bones` */
  objectIndex?: string;
  /** The property, such as `position` or `morphTargetInfluences` */
  propertyName: string;
  /** One entry of the property: a component, an index, or a morph target's name */
  propertyIndex?: string;
}

/** Reads or writes a property's value at an offset of a buffer */
type Accessor = (buffer: ArrayLike<number> & { [index: number]: number }, offset: number) => void;

interface Settable {
  set(...components: number[]): unknown;
}

interface Readable {
  x?: number;
  y?: number;
  z?: number;
  w?: number;
  r?: number;
  g?: number;
  b?: number;
}

const noop: Accessor = () => undefined;
const COMPONENTS: Record<number, (keyof Readable)[]> = {
  3: ['x', 'y', 'z'],
  4: ['x', 'y', 'z', 'w'],
};

type Target = Record<string, unknown>;

/**
 * three's `PropertyBinding`: finds the property a track names under a root node, and reads and writes
 * it for the mixer
 *
 * It finds nodes by name or `uuid` as three's does, the root itself for a name that is empty or the
 * root's, and bones of a skinned root by name. It drives vectors and quaternions (`position`,
 * `quaternion`, `scale`), colours (`material.color`), numbers (`material.opacity`), flags (`visible`),
 * whole arrays (`morphTargetInfluences`) and their entries by index or morph target name. A name that
 * finds nothing binds to nothing, as in three.
 * @example
 * ```ts
 * const { nodeName, propertyName } = PropertyBinding.parseTrackName('Hips.quaternion');
 * ```
 * @category catalog
 * @advanced
 */
export class PropertyBinding {
  /** The track name, as given */
  public readonly path: string;
  /** Its parts */
  public readonly parsedPath: ParsedTrackName;
  /** The root the node is looked up under */
  public readonly rootNode: Container3D;
  /** The node the name found, once bound; `null` when it found nothing */
  public node: Container3D | null = null;
  /**
   * Copies the property's value into a buffer
   * @param buffer - Receives the value
   * @param offset - Where in `buffer`
   */
  public getValue: Accessor;
  /**
   * Writes a value from a buffer to the property
   * @param buffer - Holds the value
   * @param offset - Where in `buffer`
   */
  public setValue: Accessor;
  private _bound = false;

  /**
   * @param rootNode - The root to look the node up under
   * @param path - The track name
   * @param parsedPath - Its parts, when already parsed
   */
  constructor(rootNode: Container3D, path: string, parsedPath?: ParsedTrackName) {
    this.path = path;
    this.parsedPath = parsedPath ?? PropertyBinding.parseTrackName(path);
    this.rootNode = rootNode;
    this.getValue = (buffer, offset) => {
      this.bind();
      this.getValue(buffer, offset);
    };
    this.setValue = (buffer, offset) => {
      this.bind();
      this.setValue(buffer, offset);
    };
  }

  /**
   * Splits a track name into its node, object and property, as three's does
   * @param trackName - Such as `'Hips.quaternion'` or `'.material.opacity'`
   */
  public static parseTrackName(trackName: string): ParsedTrackName {
    const matches = trackRe.exec(trackName);

    if (!matches) throw new Error(`PropertyBinding: Cannot parse trackName: ${trackName}`);

    const results: ParsedTrackName = {
      nodeName: matches[2],
      objectName: matches[3],
      objectIndex: matches[4],
      propertyName: matches[5],
      propertyIndex: matches[6],
    };
    const lastDot = results.nodeName?.lastIndexOf('.') ?? -1;

    if (lastDot !== -1) {
      const objectName = results.nodeName!.substring(lastDot + 1);

      if (OBJECT_NAMES.includes(objectName)) {
        results.nodeName = results.nodeName!.substring(0, lastDot);
        results.objectName = objectName;
      }
    }

    return results;
  }

  /**
   * A node name with the characters a track name reserves taken out and spaces made underscores, as
   * three's
   * @param name - The node's name
   */
  public static sanitizeNodeName(name: string): string {
    return name.replace(/\s/g, '_').replace(reservedRe, '');
  }

  /**
   * Finds a node by name or `uuid` under a root, as three's does
   * @param root - Where to look
   * @param nodeName - The name; empty for the root
   */
  public static findNode(root: Container3D, nodeName?: string): Container3D | null {
    if (!nodeName || nodeName === '.' || nodeName === root.name || nodeName === root.uuid) return root;

    const skeleton = (
      root as Container3D & { skeleton?: { getBoneByName?: (name: string) => Container3D | undefined } }
    ).skeleton;
    const bone = skeleton?.getBoneByName?.(nodeName);

    if (bone) return bone;

    const search = (children: readonly Container3D[]): Container3D | null => {
      for (const child of children) {
        if (child.name === nodeName || child.uuid === nodeName) return child;

        const found = search(child.children);

        if (found) return found;
      }

      return null;
    };

    return search(root.children);
  }

  /** Finds the node and property, once; later calls do nothing until `unbind` */
  public bind(): void {
    if (this._bound) return;
    this._bound = true;
    this.getValue = noop;
    this.setValue = noop;

    const { nodeName, objectName, objectIndex, propertyName, propertyIndex } = this.parsedPath;
    const node = PropertyBinding.findNode(this.rootNode, nodeName);

    this.node = node;
    if (!node) return;

    let target = node as unknown as Target;

    if (objectName === 'materials' || objectName === 'bones') {
      const list = (
        objectName === 'bones'
          ? (target.skeleton as { bones?: Container3D[] } | undefined)?.bones
          : (target.material as unknown[] | undefined)
      ) as Target[] | undefined;
      const index = Number.isNaN(Number(objectIndex))
        ? (list?.findIndex((entry) => entry.name === objectIndex) ?? -1)
        : Number(objectIndex);

      target = list?.[index] as Target;
    } else if (objectName) {
      target = target[objectName] as Target;
    }
    if (!target || !(propertyName in target)) return;

    const value = target[propertyName];

    if (propertyIndex !== undefined) {
      this._bindEntry(target, propertyName, propertyIndex);
    } else if (ArrayBuffer.isView(value) || Array.isArray(value)) {
      const array = value as number[];

      this.getValue = (buffer, offset) => {
        for (let i = 0; i < array.length; i++) buffer[offset + i] = array[i];
      };
      this.setValue = (buffer, offset) => {
        const current = target[propertyName] as number[];

        for (let i = 0; i < current.length; i++) current[i] = buffer[offset + i];
      };
    } else if (typeof value === 'boolean') {
      this.getValue = (buffer, offset) => {
        buffer[offset] = target[propertyName] ? 1 : 0;
      };
      this.setValue = (buffer, offset) => {
        target[propertyName] = buffer[offset] > 0.5;
      };
    } else if (typeof value === 'number') {
      this.getValue = (buffer, offset) => {
        buffer[offset] = target[propertyName] as number;
      };
      this.setValue = (buffer, offset) => {
        target[propertyName] = buffer[offset];
      };
    } else if (value && typeof (value as Partial<Settable>).set === 'function') {
      this._bindComponents(value as Settable & Readable);
    }
  }

  /** Forgets the node, so the next read or write looks it up again */
  public unbind(): void {
    this._bound = false;
    this.node = null;
    this.getValue = (buffer, offset) => {
      this.bind();
      this.getValue(buffer, offset);
    };
    this.setValue = (buffer, offset) => {
      this.bind();
      this.setValue(buffer, offset);
    };
  }

  private _bindEntry(target: Target, propertyName: string, propertyIndex: string): void {
    const container = target[propertyName] as Record<string | number, number>;
    let key: string | number = propertyIndex;

    if (propertyName === 'morphTargetInfluences') {
      const dictionary = target.morphTargetDictionary as Record<string, number> | undefined;
      const index = dictionary?.[propertyIndex];

      key = index ?? Number(propertyIndex);
    } else if (!Number.isNaN(Number(propertyIndex))) {
      key = Number(propertyIndex);
    }

    this.getValue = (buffer, offset) => {
      buffer[offset] = container[key];
    };
    this.setValue = (buffer, offset) => {
      container[key] = buffer[offset];
    };
  }

  private _bindComponents(value: Settable & Readable): void {
    const isColor = 'r' in value && 'g' in value && 'b' in value;
    const keys: (keyof Readable)[] = isColor ? ['r', 'g', 'b'] : (COMPONENTS[('w' in value ? 4 : 3) as 3 | 4] ?? []);

    this.getValue = (buffer, offset) => {
      for (let i = 0; i < keys.length; i++) buffer[offset + i] = value[keys[i]] as number;
    };
    this.setValue =
      keys.length === 4
        ? (buffer, offset) => void value.set(buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3])
        : (buffer, offset) => void value.set(buffer[offset], buffer[offset + 1], buffer[offset + 2]);
  }
}
