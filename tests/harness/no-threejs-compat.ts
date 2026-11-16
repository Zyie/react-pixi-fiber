/**
 * What `@react-fiber/threejs-compat` and its entries resolve to in the `native` project: an error.
 * Its scenes hold @pixi/3d's elements without the compat package, and a page that loaded it once
 * would keep three's surface installed for every scene after.
 */
throw new Error('@react-fiber/threejs-compat is not available in the native project');
