import { Cache } from './Cache';
import { Loader } from './Loader';

/**
 * How {@link FileLoader} hands a file over: `'arraybuffer'`, `'blob'`, `'document'`, `'json'`, or text
 * for `''` and `'text'`
 * @category catalog
 * @advanced
 */
export type FileResponseType = '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';

/**
 * The error {@link FileLoader} rejects with when the server answers with an error status
 * @category catalog
 * @advanced
 */
export class HttpError extends Error {
  /** The server's answer */
  public readonly response: Response;

  /**
   * @param message - What failed
   * @param response - The server's answer
   */
  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
  }
}

/**
 * three's `FileLoader`: fetches a file as text, JSON, an `ArrayBuffer`, a `Blob` or a document,
 * reporting progress as it downloads
 * @example
 * ```ts
 * const loader = new FileLoader().setResponseType('json');
 * const data = await loader.loadAsync('/data.json');
 * ```
 * @category catalog
 * @advanced
 */
export class FileLoader extends Loader<unknown> {
  /** How the file is handed over */
  public responseType: FileResponseType = '';
  /** The MIME type text and documents are read as */
  public mimeType: string | undefined = undefined;

  /**
   * Loads a file
   * @param url - The file, after `path`
   * @param onLoad - Called with the file
   * @param onProgress - Called as it downloads, with a `ProgressEvent`
   * @param onError - Called when it fails
   */
  public override load(
    url: string,
    onLoad?: (data: unknown) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    const resolved = this.manager.resolveURL(this.path + (url ?? ''));
    const key = `file:${resolved}`;
    const cached = Cache.get(key);
    const manager = this.manager;

    manager.itemStart(resolved);

    if (cached !== undefined) {
      queueMicrotask(() => {
        onLoad?.(cached);
        manager.itemEnd(resolved);
      });

      return;
    }

    const request = new Request(resolved, {
      headers: new Headers(this.requestHeader),
      credentials: this.withCredentials ? 'include' : 'same-origin',
      signal: manager.abortController.signal,
    });
    const { responseType, mimeType } = this;

    fetch(request)
      .then((response) => {
        if (response.status !== 200 && response.status !== 0) {
          throw new HttpError(
            `fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`,
            response,
          );
        }

        return onProgress ? withProgress(response, onProgress) : response;
      })
      .then((response) => read(response, responseType, mimeType))
      .then((data) => {
        Cache.add(key, data);
        onLoad?.(data);
      })
      .catch((error: unknown) => {
        onError?.(error);
        manager.itemError(resolved);
      })
      .finally(() => manager.itemEnd(resolved));
  }

  /**
   * Sets `responseType`
   * @param value - How the file is handed over
   * @returns This loader
   */
  public setResponseType(value: FileResponseType): this {
    this.responseType = value;
    return this;
  }

  /**
   * Sets `mimeType`
   * @param value - The MIME type text and documents are read as
   * @returns This loader
   */
  public setMimeType(value: string): this {
    this.mimeType = value;
    return this;
  }
}

/** The same response, reporting each chunk of its body as a `ProgressEvent` */
function withProgress(response: Response, onProgress: (event: ProgressEvent) => void): Response {
  if (!response.body) return response;

  const total = Number(response.headers.get('Content-Length') ?? 0);
  const lengthComputable = total > 0;
  const reader = response.body.getReader();
  let loaded = 0;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }
      loaded += value.byteLength;
      onProgress(new ProgressEvent('progress', { lengthComputable, loaded, total }));
      controller.enqueue(value);
    },
  });

  return new Response(stream, { headers: response.headers, status: response.status, statusText: response.statusText });
}

function read(response: Response, responseType: FileResponseType, mimeType: string | undefined): Promise<unknown> {
  switch (responseType) {
    case 'arraybuffer':
      return response.arrayBuffer();
    case 'blob':
      return response.blob();
    case 'document':
      return response
        .text()
        .then((text) => new DOMParser().parseFromString(text, (mimeType ?? 'text/html') as DOMParserSupportedType));
    case 'json':
      return response.json();
    default:
      return response.text();
  }
}
