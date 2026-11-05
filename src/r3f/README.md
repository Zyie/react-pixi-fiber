# Vendored react-three-fiber

A byte-for-byte copy of `packages/fiber` (`src`, `types`, `package.json`) from
[react-three-fiber](https://github.com/pmndrs/react-three-fiber) `v10` at commit `58acabc0fc996bac5a25320ca3a8670bdd209db7`.

Never edit these files. `npm run test:lint` fails on any difference from `.repos/react-three-fiber`;
run `node scripts/r3f/vendor.mts --write` after `npm run sync:repos` to take a new upstream commit.

Our own files here: this README (written by the script) and `react-reconciler/`, which stands in for
the ESM build of react-reconciler that upstream generates at install time, at the path r3f's core imports.
