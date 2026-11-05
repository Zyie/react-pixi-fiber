import type { Loader } from './Loader';

/**
 * three's `LoadingManager`: counts the files its loaders load and calls back as they start, progress,
 * finish and fail
 *
 * A loader made without one uses {@link DefaultLoadingManager}. `setURLModifier` rewrites every URL
 * before it loads, which is how an app serves a model's files from somewhere else.
 * @example
 * ```ts
 * const manager = new LoadingManager(() => console.log('all loaded'));
 * manager.onProgress = (url, loaded, total) => console.log(`${loaded} of ${total}`);
 * const loader = new TextureLoader(manager);
 * ```
 * @category catalog
 * @advanced
 */
export class LoadingManager {
  /** Called when the first of a batch of files starts loading */
  public onStart?: (url: string, itemsLoaded: number, itemsTotal: number) => void;
  /** Called when every file started has loaded */
  public onLoad?: () => void;
  /** Called as each file finishes */
  public onProgress?: (url: string, itemsLoaded: number, itemsTotal: number) => void;
  /** Called when a file fails to load */
  public onError?: (url: string) => void;
  /** Aborts the requests of the loaders that read it; `abort()` replaces it */
  public abortController: AbortController = new AbortController();

  private _isLoading = false;
  private _itemsLoaded = 0;
  private _itemsTotal = 0;
  private _urlModifier?: (url: string) => string;
  private readonly _handlers: (RegExp | Loader)[] = [];

  /**
   * @param onLoad - Called when every file started has loaded
   * @param onProgress - Called as each file finishes
   * @param onError - Called when a file fails to load
   */
  constructor(
    onLoad?: () => void,
    onProgress?: (url: string, itemsLoaded: number, itemsTotal: number) => void,
    onError?: (url: string) => void,
  ) {
    this.onLoad = onLoad;
    this.onProgress = onProgress;
    this.onError = onError;
  }

  /**
   * Counts a file that starts loading; loaders call it
   * @param url - The file
   */
  public itemStart(url: string): void {
    this._itemsTotal++;
    if (!this._isLoading) this.onStart?.(url, this._itemsLoaded, this._itemsTotal);
    this._isLoading = true;
  }

  /**
   * Counts a file that finished, loaded or not; loaders call it
   * @param url - The file
   */
  public itemEnd(url: string): void {
    this._itemsLoaded++;
    this.onProgress?.(url, this._itemsLoaded, this._itemsTotal);
    if (this._itemsLoaded === this._itemsTotal) {
      this._isLoading = false;
      this.onLoad?.();
    }
  }

  /**
   * Reports a file that failed; loaders call it
   * @param url - The file
   */
  public itemError(url: string): void {
    this.onError?.(url);
  }

  /**
   * The URL a file loads from, after `setURLModifier`'s rewrite
   * @param url - The URL asked for
   */
  public resolveURL(url: string): string {
    return this._urlModifier ? this._urlModifier(url) : url;
  }

  /**
   * Rewrites every URL before it loads
   * @param transform - Takes a URL and returns the one to load
   * @returns This manager
   */
  public setURLModifier(transform?: (url: string) => string): this {
    this._urlModifier = transform;
    return this;
  }

  /**
   * Has files whose names match a pattern loaded by another loader
   * @param regex - Matches the file names
   * @param loader - The loader for them
   * @returns This manager
   */
  public addHandler(regex: RegExp, loader: Loader): this {
    this._handlers.push(regex, loader);
    return this;
  }

  /**
   * Removes a handler `addHandler` added
   * @param regex - The pattern it was added with
   * @returns This manager
   */
  public removeHandler(regex: RegExp): this {
    const index = this._handlers.indexOf(regex);

    if (index !== -1) this._handlers.splice(index, 2);
    return this;
  }

  /**
   * The loader `addHandler` gave a file's name, or `null`
   * @param file - The file name
   */
  public getHandler(file: string): Loader | null {
    for (let i = 0; i < this._handlers.length; i += 2) {
      const regex = this._handlers[i] as RegExp;

      regex.lastIndex = 0;
      if (regex.test(file)) return this._handlers[i + 1] as Loader;
    }

    return null;
  }

  /**
   * Aborts the requests in flight of the loaders that use this manager
   * @returns This manager
   */
  public abort(): this {
    this.abortController.abort();
    this.abortController = new AbortController();
    return this;
  }
}

/**
 * The manager every loader made without one uses, as three's
 * @category catalog
 * @advanced
 */
export const DefaultLoadingManager: LoadingManager = new LoadingManager();
