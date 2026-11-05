import { CubeGeometry, Material3D, Mesh3D, View3D } from '@pixi/3d';
import { Application } from 'pixi.js';
import { afterEach, expect, it } from 'vitest';

let app: Application | undefined;

afterEach(() => {
  app?.destroy(true);
  app = undefined;
});

it('renders a pixi-3d scene from the .repos source', async () => {
  app = new Application();
  await app.init({ width: 64, height: 64, preference: 'webgl' });

  const view = new View3D({ width: 64, height: 64 });
  const mesh = new Mesh3D({ geometry: new CubeGeometry(), material: new Material3D() });
  view.root.addChild(mesh);
  view.camera.position.set(0, 0, 3);
  app.stage.addChild(view);
  app.render();

  expect(view.root.children).toContain(mesh);
});
