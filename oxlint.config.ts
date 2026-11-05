import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'error',
  },
  plugins: ['eslint', 'typescript', 'import', 'unicorn', 'vitest', 'react', 'jsdoc'],
  ignorePatterns: ['.repos/**', 'dist/**', 'spike/**', 'src/r3f/**'],
  rules: {
    'import/no-empty-named-blocks': 'error',
    'import/no-duplicates': 'error',
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    'typescript/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
    'typescript/no-explicit-any': 'error',
    'vitest/expect-expect': ['warn', { assertFunctionNames: ['expect', 'expect*'] }],
    'vitest/valid-expect': ['warn', { maxArgs: 2 }],
    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'warn',
    'no-console': 'error',
    // The docs' API reference reads these tags from the JSDoc of every public export.
    'jsdoc/check-tag-names': ['warn', { definedTags: ['category', 'standard', 'advanced', 'internal'] }],
  },
  overrides: [
    {
      files: ['scripts/**/*', 'examples/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
});
