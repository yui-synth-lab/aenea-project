/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies were resolved in Phase 2 and must not be reintroduced.',
      from: { path: '^src' },
      to: {
        circular: true,
      },
    },
    {
      name: 'no-aenea-to-server',
      severity: 'warn',
      comment: 'src/aenea should not import from src/server (cognitive layer coupling to infrastructure).',
      from: { path: '^src/aenea' },
      to: { path: '^src/server' },
    },
    {
      name: 'no-utils-to-server',
      severity: 'warn',
      comment: 'src/utils should not import from src/server (utility layer coupling to infrastructure).',
      from: { path: '^src/utils' },
      to: { path: '^src/server' },
    },
    {
      name: 'no-reach-into-yui-dist',
      severity: 'warn',
      comment: 'src/ should not reach into yui-protocol/dist directly — use the package exports.',
      from: { path: '^src' },
      to: { path: 'yui-protocol/dist' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '\\.d\\.ts$',
    },
    tsConfig: {
      fileName: './tsconfig.json',
    },
    tsPreCompilationDeps: true,
    moduleSystems: ['es6', 'cjs'],
    combinedDependencies: false,
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
