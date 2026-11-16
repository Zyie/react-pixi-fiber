import { createRoot } from '@react-fiber/core';
import { FiberExtensionType } from '@react-fiber/core/extension';
import { extensions } from 'pixi.js';
import { act } from 'react';
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
