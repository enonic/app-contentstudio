---
paths:
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
---

# Testing Standards

## Framework

- **Runner**: Vitest
- **Environment**: Happy DOM
- **Mocking**: `vi` from Vitest (not Jest)

## Test Structure

Arrange-Act-Assert pattern. Nested `describe` blocks for grouping.

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('parseNumber', () => {
    describe('number inputs', () => {
        it('should return the number for valid integer', () => {
            const input = 42;
            const result = parseNumber(input);
            expect(result).toBe(42);
        });

        it('should return undefined for NaN', () => {
            expect(parseNumber(NaN)).toBeUndefined();
        });
    });
});
```

## Mocking

```typescript
beforeEach(() => {
    globalThis.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});
```

## Fake Timers

```typescript
beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it('should debounce', async () => {
    // Act
    triggerAction();
    await vi.runAllTimersAsync();
    // Assert
    expect(result).toBe(expected);
});
```

## Best Practices

- `should` in test names to describe expected behavior
- `afterEach(() => vi.restoreAllMocks())` always
- `async/await` for async operations
- Each test independent, no shared mutable state
- Coverage targets: 100% for utilities, high for critical paths
