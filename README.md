# react-pixi-fiber

Exploring a port of [react-three-fiber](https://github.com/pmndrs/react-three-fiber) v10 to [`@pixi/3d`](https://github.com/pixijs/pixi-3d), with the aim of keeping the r3f API so an app only swaps the renderer.

## Setup

```sh
npm install
npm run sync:repos   # clones r3f v10, pixi-3d main and pixijs dev into .repos/
npm test
```
