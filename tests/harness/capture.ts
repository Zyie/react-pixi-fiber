let next = 0;

/**
 * Marks an element of the test page so a browser command can find it, to capture it or send it input
 * @param element - A scene's canvas
 * @returns The mark, which is the element's `data-shot` attribute
 */
export function markForCapture(element: HTMLElement): string {
  element.dataset.shot ??= `shot-${next++}`;

  return element.dataset.shot;
}
