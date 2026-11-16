import { defineConfig } from 'tsdown';

// Builds every package with its own tsdown.config.ts; the docs site builds with Docusaurus.
export default defineConfig({
  workspace: ['packages/r3f', 'packages/core', 'packages/2d', 'packages/3d', 'packages/threejs-compat'],
});
