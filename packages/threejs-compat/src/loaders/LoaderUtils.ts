/**
 * three's `LoaderUtils`: the helpers loaders use to resolve a file's own files
 * @category catalog
 * @advanced
 */
export interface LoaderUtilsApi {
  /**
   * The folder of a URL, with its trailing slash; `'./'` for a bare file name
   * @param url - The URL
   */
  extractUrlBase(url: string): string;
  /**
   * A file's URL against a folder: absolute, data, blob and protocol URLs as they are
   * @param url - The file's URL
   * @param path - The folder
   */
  resolveURL(url: string, path: string): string;
}

/**
 * three's `LoaderUtils`
 * @example
 * ```ts
 * LoaderUtils.extractUrlBase('/models/robot.gltf'); // '/models/'
 * ```
 * @category catalog
 * @advanced
 */
export const LoaderUtils: LoaderUtilsApi = {
  extractUrlBase(url) {
    const index = url.lastIndexOf('/');

    return index === -1 ? './' : url.slice(0, index + 1);
  },
  resolveURL(url, path) {
    if (typeof url !== 'string' || url === '') return '';
    if (/^https?:\/\//i.test(path) && url.startsWith('/')) path = path.replace(/(^https?:\/\/[^/]+).*/i, '$1');
    if (/^(https?:)?\/\//i.test(url) || /^data:.*,.*$/i.test(url) || /^blob:.*$/i.test(url)) return url;

    return path + url;
  },
};
