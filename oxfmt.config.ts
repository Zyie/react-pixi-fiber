import { defineConfig } from 'oxfmt';

export default defineConfig({
  // src/r3f is r3f source copied byte-for-byte; formatting it would break `scripts/r3f/vendor.mts --check`.
  ignorePatterns: ['.claude/**', 'src/r3f/**'],
  printWidth: 120,
  singleQuote: true,
  sortImports: {},
});
