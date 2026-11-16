import { useSyncExternalStore } from 'react';

const noSubscription = (): (() => void) => () => undefined;

/**
 * Something only the browser knows and that doesn't change, such as whether it has WebGPU: the server's
 * HTML and the hydration render get `onServer`, and the render after them what `read` returns
 * @param read - Reads it; it returns the same value each time
 * @param onServer - What to render until then
 */
export function useBrowserValue<Value>(read: () => Value, onServer: Value): Value {
  return useSyncExternalStore(noSubscription, read, () => onServer);
}
