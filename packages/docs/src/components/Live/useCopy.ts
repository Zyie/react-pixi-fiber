import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Writes text to the clipboard. Text that isn't ready yet goes in as a promise of a `ClipboardItem`, so
 * the write still starts inside the click, which Safari requires.
 * @param text - The text, or a promise of it
 */
function write(text: string | Promise<string>): Promise<void> {
  try {
    if (typeof text === 'string') return navigator.clipboard.writeText(text);
    if (typeof ClipboardItem === 'undefined') return text.then((ready) => navigator.clipboard.writeText(ready));

    return navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': text.then((ready) => new Blob([ready], { type: 'text/plain' })) }),
    ]);
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Copying to the clipboard from a button that says it did
 * @param shown - How long the button says so, in ms
 * @returns Whether a copy has just succeeded, and what copies some text, or a promise of it: it resolves
 * to whether the browser let it
 */
export function useCopy(shown = 1600): [boolean, (text: string | Promise<string>) => Promise<boolean>] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    (text: string | Promise<string>) =>
      write(text).then(
        () => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), shown);
          setCopied(true);

          return true;
        },
        () => false,
      ),
    [shown],
  );

  return [copied, copy];
}
