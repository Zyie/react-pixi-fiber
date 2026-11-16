import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'error',
  },
  plugins: ['eslint', 'typescript', 'import', 'unicorn', 'vitest', 'react', 'jsdoc'],
  // A docs test fixture is a tree of a repo's files, whose imports lead nowhere on purpose
  ignorePatterns: ['.repos/**', '**/dist/**', 'packages/r3f/**', 'packages/docs/**/__tests__/fixtures/**'],
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
      files: ['scripts/**/*', 'examples/**/*', 'packages/docs/scripts/**/*', 'packages/docs/plugins/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
});
