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
      severity: 'error',
      comment: 'src/aenea must not import from src/server (resolved in Phase 3; the ports in src/aenea/ports are the dependency-inversion boundary).',
      from: { path: '^src/aenea' },
      to: { path: '^src/server' },
    },
    {
      name: 'no-utils-to-server',
      severity: 'error',
      comment: 'src/utils should not import from src/server (utility layer coupling to infrastructure).',
      from: { path: '^src/utils' },
      to: { path: '^src/server' },
    },
    {
      name: 'platform-must-stay-leaf',
      severity: 'error',
      // src/platform is a cross-cutting leaf layer (logging); any layer may import it; it must import nothing from src/ outside platform.
      comment: 'src/platform must not import from any src/ layer other than itself — it is a cross-cutting leaf.',
      from: { path: '^src/platform' },
      to: { path: '^src', pathNot: '^src/platform' },
    },
    {
      name: 'no-reach-into-yui-dist',
      severity: 'error',
      comment: 'src/ must not reach into yui-protocol/dist directly — use the gateway (src/integration/yui-protocol-gateway.ts), the single permitted boundary.',
      from: { path: '^src', pathNot: '^src/integration/yui-protocol-gateway\\.ts$' },
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
