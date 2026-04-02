/**
 * Configuración de ESLint para el proyecto SCR Agent
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2020: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'security'],
  rules: {
    /**
     * Seguridad
     */
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-no-csrf-before-method-override': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',

    /**
     * TypeScript
     * Asegurar type safety strict
     */
    '@typescript-eslint/explicit-function-return-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',

    /**
     * General
     * Best practices
     */
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-throw-literal': 'error',
  },
  overrides: [
    {
      // Configuración específica para tests
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
