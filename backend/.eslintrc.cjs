/**
 * Config própria do backend.
 *
 * Sem `root: true`, o ESLint subia até a raiz do repositório e aplicava a
 * config do app (React Native), que não conhece `__dirname`, `Buffer`,
 * `URL` nem `AbortController` — e marcava como erro código Node correto.
 */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  extends: ['eslint:recommended'],
  rules: {
    // `ignoreRestSiblings` libera o idioma de desestruturar para omitir:
    // `const { passwordHash, ...rest } = user` existe justamente para
    // descartar o campo, e marcá-lo como não usado seria ruído.
    'no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    'no-console': ['warn', { allow: ['error'] }],
    eqeqeq: ['error', 'smart'],
    'prefer-const': 'error',
  },
  ignorePatterns: ['node_modules/', 'coverage/'],
};
