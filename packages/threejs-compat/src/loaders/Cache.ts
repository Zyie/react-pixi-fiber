/**
 * three's `Cache`: files three's loaders share by URL while `enabled` is on
 * @category catalog
 * @advanced
 */
export interface CacheApi {
  /** Whether loaders read and fill the cache @default false */
  enabled: boolean;
  /** The cached files, by key */
  files: Record<string, unknown>;
  /**
   * Caches a file
   * @param key - Its URL
   * @param file - The file
   */
  add(key: string, file: unknown): void;
  /**
   * A cached file, or `undefined`
   * @param key - Its URL
   */
  get(key: string): unknown;
  /**
   * Forgets a file
   * @param key - Its URL
   */
  remove(key: string): void;
  /** Forgets every file */
  clear(): void;
}

/**
 * three's `Cache`: `ImageLoader` and `FileLoader` keep what they load here by URL while `enabled` is
 * on, which it isn't by default
 * @example
 * ```ts
 * Cache.enabled = true;
 * ```
 * @category catalog
 * @advanced
 */
export const Cache: CacheApi = {
  enabled: false,
  files: {},
  add(key, file) {
    if (this.enabled) this.files[key] = file;
  },
  get(key) {
    return this.enabled ? this.files[key] : undefined;
  },
  remove(key) {
    delete this.files[key];
  },
  clear() {
    this.files = {};
  },
};
