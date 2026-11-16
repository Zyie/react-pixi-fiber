import { objects3D } from '@react-fiber/3d';
import { FiberExtensionType } from '@react-fiber/core/extension';
import { extensions } from 'pixi.js';

import { catalog } from './catalog/catalog';
import { installObject3DSurface } from './compat/installObject3DSurface';
import { installPixiColor } from './compat/pixiColor';
import { WebGLCubeRenderTarget } from './environment/WebGLCubeRenderTarget';
import { WebGLRenderTarget } from './environment/WebGLRenderTarget';
import { ThreeRenderer } from './renderer/ThreeRenderer';

extensions.add(
  { type: FiberExtensionType.Catalog, name: 'threejs-compat', ref: catalog },
  { type: FiberExtensionType.Objects, name: 'threejs-compat', ref: objects3D },
  {
    type: FiberExtensionType.Support,
    name: 'threejs-compat',
    ref: {
      Renderer: ThreeRenderer,
      RenderTarget: WebGLRenderTarget,
      CubeRenderTarget: WebGLCubeRenderTarget,
      install() {
        installObject3DSurface();
        installPixiColor();
      },
    },
  },
);
