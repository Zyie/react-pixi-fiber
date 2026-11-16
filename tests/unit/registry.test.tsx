import { createRoot } from '@react-fiber/core';
import { FiberExtensionType } from '@react-fiber/core/extension';
import { extensions } from 'pixi.js';
import { act, createElement } from 'react';
import { expect, it, vi } from 'vitest';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// An install is prototype patches and root extensions, which no picture of one root shows in time.
it("runs a package's install as it registers once a root has loaded the support, as a code-split import does", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const canvas = document.body.appendChild(document.createElement('canvas'));
  const root = createRoot(canvas);
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });

  const late = { install: vi.fn() };
  const extension = { type: FiberExtensionType.Support, name: 'late', ref: late };
  extensions.add(extension);
  expect(late.install).toHaveBeenCalledOnce();

  extensions.remove(extension);
  await act(async () => root.unmount());
  canvas.remove();
});

// An error message shows in no picture.
it("names the package to import for an element whose suffix is a package's, rather than three's namespace", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // r3f's root also reports what a render throws through reportError, which it reads as the root is made
  vi.stubGlobal('reportError', vi.fn());
  const canvas = document.body.appendChild(document.createElement('canvas'));
  const root = createRoot(canvas);
  vi.unstubAllGlobals();
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });

  let thrown: Error | null = null;
  try {
    await act(async () => root.render(createElement('notAnElement3D')));
  } catch (error) {
    thrown = error as Error;
  }
  expect(thrown?.message).toContain('<notAnElement3D> is not an element of any package installed');
  expect(thrown?.message).toContain("import '@react-fiber/3d'");

  await act(async () => root.unmount());
  canvas.remove();
});
