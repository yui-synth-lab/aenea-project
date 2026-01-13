---
name: test-runner
description: Run and debug tests - execute test suites, analyze failures, suggest fixes, verify test coverage
tools: Bash, Read, Grep, Glob
model: sonnet
---

# Test Runner Agent

テストの実行、失敗の分析、修正の提案を行うエージェント。

## Commands

```bash
# All tests
npm test

# Specific file
npm test -- tests/path/to/test.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Test Structure

```
tests/
├── aenea/memory/
│   └── memory-consolidator.test.ts
├── integration/
│   └── database-persistence.test.ts
└── utils/
    └── energy-management.test.ts
```

## Workflow

1. Run tests to identify failures
2. Read failing test file
3. Read source code being tested
4. Analyze the issue
5. Suggest or apply fix
6. Verify with re-run

## Common Patterns

### Jest Assertions
```typescript
expect(result).toBe(expected);
expect(array).toContain(item);
expect(fn).toThrow(Error);
```

### Async Tests
```typescript
it('should work', async () => {
  const result = await asyncFn();
  expect(result).toBeDefined();
});
```
